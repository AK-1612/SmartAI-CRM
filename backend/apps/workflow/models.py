"""Workflow engine models."""
from django.conf import settings
from django.db import models


class Workflow(models.Model):
    """A named automation definition: a trigger plus an ordered list of steps."""

    class TriggerType(models.TextChoices):
        LEAD_CREATED = "lead_created", "Lead Created"
        LEAD_STATUS_CHANGED = "lead_status_changed", "Lead Status Changed"
        DEAL_STAGE_CHANGED = "deal_stage_changed", "Deal Stage Changed"
        TICKET_CREATED = "ticket_created", "Ticket Created"
        TICKET_ESCALATED = "ticket_escalated", "Ticket Escalated"
        CUSTOMER_ONBOARDED = "customer_onboarded", "Customer Onboarded"
        MANUAL = "manual", "Manual Trigger"

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    trigger_type = models.CharField(max_length=32, choices=TriggerType.choices)
    trigger_conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Optional field match rules evaluated against the trigger payload, "
        "e.g. {'priority': 'high'} or {'status__in': ['new', 'open']}.",
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workflows_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["trigger_type", "is_active"])]

    def __str__(self) -> str:
        return self.name


class WorkflowStep(models.Model):
    """A single ordered action within a workflow."""

    class ActionType(models.TextChoices):
        SEND_EMAIL = "send_email", "Send Email"
        SEND_SMS = "send_sms", "Send SMS"
        CREATE_TASK = "create_task", "Create Task"
        ASSIGN_LEAD = "assign_lead", "Auto-assign Lead"
        ESCALATE_TICKET = "escalate_ticket", "Escalate Support Ticket"
        REQUEST_APPROVAL = "request_approval", "Request Approval"
        WAIT = "wait", "Wait / Delay"

    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="steps")
    order = models.PositiveIntegerField(default=0)
    action_type = models.CharField(max_length=32, choices=ActionType.choices)
    action_config = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("workflow", "order")

    def __str__(self) -> str:
        return f"{self.workflow.name} · step {self.order} · {self.action_type}"


class WorkflowRun(models.Model):
    """One execution instance of a workflow, triggered by a real event."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        WAITING_APPROVAL = "waiting_approval", "Waiting on Approval"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="runs")
    trigger_payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    current_step = models.ForeignKey(
        WorkflowStep, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    log = models.JSONField(
        default=list,
        blank=True,
        help_text="Ordered list of {step, action_type, status, message, at} entries.",
    )
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
        indexes = [models.Index(fields=["workflow", "status"])]

    def __str__(self) -> str:
        return f"Run #{self.pk} · {self.workflow.name} · {self.status}"


class ApprovalRequest(models.Model):
    """A pause point created by a REQUEST_APPROVAL step, awaiting a human decision."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    workflow_run = models.ForeignKey(WorkflowRun, on_delete=models.CASCADE, related_name="approval_requests")
    step = models.ForeignKey(WorkflowStep, on_delete=models.CASCADE, related_name="approval_requests")
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_requests",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    comment = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self) -> str:
        return f"Approval for run #{self.workflow_run_id} · {self.status}"
