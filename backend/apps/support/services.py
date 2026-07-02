"""Customer support service layer: ticket lifecycle, SLA timers, AI assists."""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from . import ai_helpers
from .models import Ticket, TicketComment
from .repositories import (
    KnowledgeBaseRepository,
    SLAPolicyRepository,
    TicketCommentRepository,
    TicketRepository,
)


class TicketService:
    @staticmethod
    def create_ticket(
        *,
        subject: str,
        description: str,
        customer_name: str,
        customer_email: str,
        created_by=None,
        priority: str | None = None,
    ) -> Ticket:
        """Create a ticket, auto-categorizing, scoring sentiment, and starting SLA
        timers. AI steps are heuristic (see ai_helpers.py) so this works with no
        external API key."""
        category = ai_helpers.categorize_ticket(subject, description)
        sentiment_label, sentiment_score = ai_helpers.analyze_sentiment(f"{subject} {description}")
        resolved_priority = priority or ai_helpers.suggest_priority(category, sentiment_label)

        sla_policy = SLAPolicyRepository.for_priority(resolved_priority)
        now = timezone.now()
        response_due_at = now + timedelta(minutes=sla_policy.response_time_minutes) if sla_policy else None
        resolution_due_at = now + timedelta(minutes=sla_policy.resolution_time_minutes) if sla_policy else None

        ticket = TicketRepository.create(
            subject=subject,
            description=description,
            customer_name=customer_name,
            customer_email=customer_email,
            category=category,
            priority=resolved_priority,
            sentiment=sentiment_label,
            sentiment_score=sentiment_score,
            sla_policy=sla_policy,
            response_due_at=response_due_at,
            resolution_due_at=resolution_due_at,
            created_by=created_by,
        )

        TicketService._notify_workflow_engine("ticket_created", ticket)
        return ticket

    @staticmethod
    def assign(ticket: Ticket, agent) -> Ticket:
        ticket.assigned_to = agent
        if ticket.status == Ticket.Status.NEW:
            ticket.status = Ticket.Status.OPEN
        ticket.save(update_fields=["assigned_to", "status"])
        return ticket

    @staticmethod
    def add_comment(ticket: Ticket, *, author, body: str, is_internal: bool = False) -> TicketComment:
        comment = TicketCommentRepository.create(ticket=ticket, author=author, body=body, is_internal=is_internal)
        if not is_internal and ticket.first_responded_at is None:
            ticket.first_responded_at = timezone.now()
            if ticket.status == Ticket.Status.NEW:
                ticket.status = Ticket.Status.OPEN
            ticket.save(update_fields=["first_responded_at", "status"])
        return comment

    @staticmethod
    def suggest_response(ticket: Ticket) -> str:
        articles = KnowledgeBaseRepository.published()
        return ai_helpers.suggest_response(ticket, articles)

    @staticmethod
    def resolve(ticket: Ticket) -> Ticket:
        ticket.status = Ticket.Status.RESOLVED
        ticket.resolved_at = timezone.now()
        ticket.save(update_fields=["status", "resolved_at"])
        TicketService._notify_workflow_engine("ticket_resolved", ticket)
        return ticket

    @staticmethod
    def escalate(ticket_id: int) -> Ticket:
        """Called both from the API and from the workflow engine's ESCALATE_TICKET
        action, so it accepts a raw id rather than an instance."""
        ticket = Ticket.objects.get(pk=ticket_id)
        ticket.status = Ticket.Status.ESCALATED
        ticket.priority = Ticket.Priority.URGENT
        ticket.save(update_fields=["status", "priority"])
        TicketService._notify_workflow_engine("ticket_escalated", ticket)
        return ticket

    @staticmethod
    def _notify_workflow_engine(trigger_type: str, ticket: Ticket) -> None:
        """Fire a workflow trigger on key ticket events. Wrapped in try/except so a
        misconfigured or absent workflow never breaks the support flow."""
        try:
            from apps.workflow.services import WorkflowService

            WorkflowService.trigger_event(
                trigger_type,
                {
                    "ticket_id": ticket.id,
                    "priority": ticket.priority,
                    "category": ticket.category,
                    "email": ticket.customer_email,
                },
            )
        except Exception:  # noqa: BLE001
            pass


class KnowledgeBaseService:
    @staticmethod
    def chatbot_reply(message: str) -> dict:
        articles = KnowledgeBaseRepository.published()
        return ai_helpers.chatbot_reply(message, articles)


class SupportAnalyticsService:
    """Read-side queries used by both the support dashboard and apps.analytics."""

    @staticmethod
    def summary() -> dict:
        return {
            "by_status": TicketRepository.counts_by_status(),
            "by_priority": TicketRepository.counts_by_priority(),
            "average_resolution_minutes": TicketRepository.average_resolution_minutes(),
            "agent_performance": list(TicketRepository.performance_by_agent()),
        }
