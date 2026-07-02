"""Customer support data access layer."""
from django.db.models import Count, F, Q, QuerySet

from .models import KnowledgeBaseArticle, SLAPolicy, Ticket, TicketComment

CLOSED_STATUSES = [Ticket.Status.RESOLVED, Ticket.Status.CLOSED]


class TicketRepository:
    @staticmethod
    def create(**kwargs) -> Ticket:
        return Ticket.objects.create(**kwargs)

    @staticmethod
    def all_with_relations() -> QuerySet[Ticket]:
        return Ticket.objects.select_related("assigned_to", "created_by", "sla_policy")

    @staticmethod
    def unassigned() -> QuerySet[Ticket]:
        return Ticket.objects.filter(assigned_to__isnull=True).exclude(
            status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        )

    @staticmethod
    def for_agent(user) -> QuerySet[Ticket]:
        return Ticket.objects.filter(assigned_to=user)

    @staticmethod
    def counts_by_status() -> dict:
        rows = Ticket.objects.values("status").annotate(count=Count("id"))
        return {row["status"]: row["count"] for row in rows}

    @staticmethod
    def counts_by_priority() -> dict:
        rows = Ticket.objects.values("priority").annotate(count=Count("id"))
        return {row["priority"]: row["count"] for row in rows}

    @staticmethod
    def average_resolution_minutes() -> float | None:
        resolved = Ticket.objects.filter(resolved_at__isnull=False)
        if not resolved.exists():
            return None
        durations = resolved.annotate(
            duration=F("resolved_at") - F("created_at")
        ).values_list("duration", flat=True)
        total_seconds = sum(d.total_seconds() for d in durations)
        return round((total_seconds / len(durations)) / 60, 1)

    @staticmethod
    def performance_by_agent() -> QuerySet:
        return (
            Ticket.objects.filter(assigned_to__isnull=False)
            .values("assigned_to__id", "assigned_to__username")
            .annotate(
                open_count=Count("id", filter=~Q(status__in=CLOSED_STATUSES)),
                resolved_count=Count("id", filter=Q(status__in=CLOSED_STATUSES)),
                total_count=Count("id"),
            )
            .order_by("-resolved_count")
        )


class TicketCommentRepository:
    @staticmethod
    def create(**kwargs) -> TicketComment:
        return TicketComment.objects.create(**kwargs)

    @staticmethod
    def for_ticket(ticket_id: int) -> QuerySet[TicketComment]:
        return TicketComment.objects.filter(ticket_id=ticket_id).select_related("author")


class KnowledgeBaseRepository:
    @staticmethod
    def published() -> QuerySet[KnowledgeBaseArticle]:
        return KnowledgeBaseArticle.objects.filter(is_published=True)


class SLAPolicyRepository:
    @staticmethod
    def for_priority(priority: str) -> SLAPolicy | None:
        return SLAPolicy.objects.filter(priority=priority).first()
