"""Workflow engine service layer: trigger matching, step execution, approvals.

Action handlers are intentionally small and side-effect-light for now — most call
out to a TODO on a sibling module (tasks, communication, leads, support) that isn't
built yet. Once those modules land, only the handler bodies below need to change;
the engine (matching, ordering, logging, pausing on approval) stays the same.
"""
from __future__ import annotations

from typing import Any, Callable

from django.utils import timezone

from .models import ApprovalRequest, Workflow, WorkflowRun, WorkflowStep
from .repositories import ApprovalRequestRepository, WorkflowRepository, WorkflowRunRepository


def _matches_conditions(payload: dict, conditions: dict) -> bool:
    """Every key in `conditions` must match the (possibly dotted-path) payload value.

    A key suffixed with "__in" checks membership instead of equality, e.g.
    {"status__in": ["new", "open"]}.
    """
    for key, expected in conditions.items():
        field, op = (key[: -len("__in")], "in") if key.endswith("__in") else (key, "eq")

        value: Any = payload
        for part in field.split("."):
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                value = None
                break

        if op == "in":
            if value not in expected:
                return False
        elif value != expected:
            return False
    return True


class WorkflowActionRegistry:
    """Maps WorkflowStep.action_type -> callable(run, step, payload) -> status message."""

    _handlers: dict[str, Callable[[WorkflowRun, WorkflowStep, dict], str]] = {}

    @classmethod
    def register(cls, action_type: str):
        def decorator(func):
            cls._handlers[action_type] = func
            return func

        return decorator

    @classmethod
    def get(cls, action_type: str):
        return cls._handlers.get(action_type)


@WorkflowActionRegistry.register(WorkflowStep.ActionType.SEND_EMAIL)
def _handle_send_email(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    to = step.action_config.get("to") or payload.get("email")
    subject = step.action_config.get("subject", "Notification")
    # TODO: send via apps.communication once its email integration is built.
    return f"Queued email to {to!r} — subject: {subject!r}"


@WorkflowActionRegistry.register(WorkflowStep.ActionType.SEND_SMS)
def _handle_send_sms(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    to = step.action_config.get("to") or payload.get("phone")
    # TODO: send via Twilio through apps.communication once it's built.
    return f"Queued SMS to {to!r}"


@WorkflowActionRegistry.register(WorkflowStep.ActionType.CREATE_TASK)
def _handle_create_task(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    title = step.action_config.get("title", "Follow up")
    # TODO: create a real row via apps.tasks once it's built.
    return f"Created task {title!r}"


@WorkflowActionRegistry.register(WorkflowStep.ActionType.ASSIGN_LEAD)
def _handle_assign_lead(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    lead_id = payload.get("lead_id")
    strategy = step.action_config.get("assignee", "round_robin")
    # TODO: assign via apps.leads once it's built.
    return f"Assigned lead {lead_id!r} using strategy {strategy!r}"


@WorkflowActionRegistry.register(WorkflowStep.ActionType.ESCALATE_TICKET)
def _handle_escalate_ticket(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    ticket_id = payload.get("ticket_id")
    if ticket_id:
        try:
            from apps.support.services import TicketService

            TicketService.escalate(ticket_id)
        except Exception:  # noqa: BLE001 - escalation failure shouldn't crash the run
            return f"Escalation call failed for ticket {ticket_id!r}"
    return f"Escalated ticket {ticket_id!r}"


@WorkflowActionRegistry.register(WorkflowStep.ActionType.WAIT)
def _handle_wait(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    seconds = step.action_config.get("seconds", 0)
    # TODO: hand off to a scheduled task runner (Celery/cron) for real delays.
    return f"Wait step recorded ({seconds}s) — no async runner wired up yet"


@WorkflowActionRegistry.register(WorkflowStep.ActionType.REQUEST_APPROVAL)
def _handle_request_approval(run: WorkflowRun, step: WorkflowStep, payload: dict) -> str:
    approver_id = step.action_config.get("approver_id")
    approver = None
    if approver_id:
        from django.contrib.auth import get_user_model

        approver = get_user_model().objects.filter(pk=approver_id).first()
    ApprovalRequestRepository.create(run, step, approver)
    run.status = WorkflowRun.Status.WAITING_APPROVAL
    run.save(update_fields=["status"])
    return "Approval requested; run paused until a decision is made"


class WorkflowService:
    """Entry point for the rest of the CRM: fire a domain event and let matching
    active workflows run. Other apps should call
    ``WorkflowService.trigger_event("ticket_created", {...})`` on real events."""

    @staticmethod
    def trigger_event(trigger_type: str, payload: dict) -> list[WorkflowRun]:
        runs = []
        for workflow in WorkflowRepository.list_active_by_trigger(trigger_type):
            if not _matches_conditions(payload, workflow.trigger_conditions):
                continue
            run = WorkflowRunRepository.create_run(workflow, payload)
            runs.append(WorkflowService._run_from(run, start_order=0))
        return runs

    @staticmethod
    def resume_run(run: WorkflowRun) -> WorkflowRun:
        """Continue a run paused on an approval step, starting after that step."""
        next_order = (run.current_step.order + 1) if run.current_step else 0
        return WorkflowService._run_from(run, start_order=next_order)

    @staticmethod
    def _run_from(run: WorkflowRun, start_order: int) -> WorkflowRun:
        run.status = WorkflowRun.Status.RUNNING
        run.save(update_fields=["status"])

        steps = run.workflow.steps.filter(order__gte=start_order).order_by("order")
        for step in steps:
            run.current_step = step
            run.save(update_fields=["current_step"])

            handler = WorkflowActionRegistry.get(step.action_type)
            entry = {"step": step.order, "action_type": step.action_type, "at": timezone.now().isoformat()}
            try:
                message = handler(run, step, run.trigger_payload) if handler else "No handler registered"
                entry.update(status="ok" if handler else "skipped", message=message)
                WorkflowRunRepository.append_log(run, entry)
            except Exception as exc:  # noqa: BLE001
                entry.update(status="error", message=str(exc))
                WorkflowRunRepository.append_log(run, entry)
                run.status = WorkflowRun.Status.FAILED
                run.error_message = str(exc)
                run.finished_at = timezone.now()
                run.save(update_fields=["status", "error_message", "finished_at"])
                return run

            run.refresh_from_db(fields=["status"])
            if run.status == WorkflowRun.Status.WAITING_APPROVAL:
                return run  # execution paused; resumed later via resume_run()

        run.status = WorkflowRun.Status.COMPLETED
        run.finished_at = timezone.now()
        run.current_step = None
        run.save(update_fields=["status", "finished_at", "current_step"])
        return run


class ApprovalService:
    @staticmethod
    def decide(approval_request: ApprovalRequest, approved: bool, comment: str = "") -> ApprovalRequest:
        approval_request.status = (
            ApprovalRequest.Status.APPROVED if approved else ApprovalRequest.Status.REJECTED
        )
        approval_request.comment = comment
        approval_request.decided_at = timezone.now()
        approval_request.save(update_fields=["status", "comment", "decided_at"])

        run = approval_request.workflow_run
        if approved:
            WorkflowService.resume_run(run)
        else:
            run.status = WorkflowRun.Status.FAILED
            run.error_message = "Approval rejected"
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "error_message", "finished_at"])
        return approval_request
