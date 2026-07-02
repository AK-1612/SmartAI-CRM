"""Workflow engine data access layer."""
from .models import ApprovalRequest, Workflow, WorkflowRun


class WorkflowRepository:
    @staticmethod
    def list_active_by_trigger(trigger_type: str):
        return Workflow.objects.filter(is_active=True, trigger_type=trigger_type).prefetch_related("steps")

    @staticmethod
    def get_with_steps(workflow_id: int) -> Workflow:
        return Workflow.objects.prefetch_related("steps").get(pk=workflow_id)


class WorkflowRunRepository:
    @staticmethod
    def create_run(workflow: Workflow, trigger_payload: dict) -> WorkflowRun:
        return WorkflowRun.objects.create(workflow=workflow, trigger_payload=trigger_payload)

    @staticmethod
    def for_workflow(workflow_id: int):
        return WorkflowRun.objects.filter(workflow_id=workflow_id)

    @staticmethod
    def append_log(run: WorkflowRun, entry: dict) -> None:
        run.log = [*run.log, entry]
        run.save(update_fields=["log"])


class ApprovalRequestRepository:
    @staticmethod
    def pending_for_user(user):
        return ApprovalRequest.objects.filter(approver=user, status=ApprovalRequest.Status.PENDING)

    @staticmethod
    def create(run: WorkflowRun, step, approver) -> ApprovalRequest:
        return ApprovalRequest.objects.create(workflow_run=run, step=step, approver=approver)
