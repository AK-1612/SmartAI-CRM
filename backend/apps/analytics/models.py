"""Analytics models."""
from django.conf import settings
from django.db import models


class MetricEvent(models.Model):
    """A generic, append-only business event other modules record analytics against.

    This decouples analytics from modules that don't exist yet (leads, sales):
    once apps.leads/apps.sales are built, they just call
    ``AnalyticsService.record_event("lead_created", ...)`` on the events that
    matter, and the dashboard queries below start reflecting real data — no
    schema change needed here.
    """

    class EventType(models.TextChoices):
        LEAD_CREATED = "lead_created", "Lead Created"
        LEAD_CONVERTED = "lead_converted", "Lead Converted"
        DEAL_WON = "deal_won", "Deal Won"
        DEAL_LOST = "deal_lost", "Deal Lost"
        TICKET_CREATED = "ticket_created", "Ticket Created"
        TICKET_RESOLVED = "ticket_resolved", "Ticket Resolved"
        CAMPAIGN_SENT = "campaign_sent", "Campaign Sent"
        WORKFLOW_COMPLETED = "workflow_completed", "Workflow Completed"

    event_type = models.CharField(max_length=32, choices=EventType.choices)
    value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, help_text="Optional numeric value, e.g. deal revenue.")
    metadata = models.JSONField(default=dict, blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="metric_events"
    )
    occurred_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]
        indexes = [models.Index(fields=["event_type", "occurred_at"])]

    def __str__(self) -> str:
        return f"{self.event_type} @ {self.occurred_at:%Y-%m-%d}"
