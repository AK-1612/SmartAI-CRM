"""Analytics data access layer."""
from datetime import date, timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from .models import MetricEvent


class MetricEventRepository:
    @staticmethod
    def record(event_type: str, *, value=None, metadata=None, recorded_by=None, occurred_at=None) -> MetricEvent:
        return MetricEvent.objects.create(
            event_type=event_type,
            value=value,
            metadata=metadata or {},
            recorded_by=recorded_by,
            occurred_at=occurred_at or timezone.now(),
        )

    @staticmethod
    def in_range(event_type: str, date_from: date, date_to: date):
        return MetricEvent.objects.filter(
            event_type=event_type, occurred_at__date__gte=date_from, occurred_at__date__lte=date_to
        )

    @staticmethod
    def counts_by_day(event_type: str, days: int = 30):
        since = timezone.now() - timedelta(days=days)
        rows = (
            MetricEvent.objects.filter(event_type=event_type, occurred_at__gte=since)
            .annotate(day=TruncDate("occurred_at"))
            .values("day")
            .annotate(count=Count("id"), total_value=Sum("value"))
            .order_by("day")
        )
        return list(rows)

    @staticmethod
    def total_value(event_type: str, date_from: date | None = None, date_to: date | None = None):
        queryset = MetricEvent.objects.filter(event_type=event_type)
        if date_from:
            queryset = queryset.filter(occurred_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(occurred_at__date__lte=date_to)
        return queryset.aggregate(total=Sum("value"))["total"] or 0

    @staticmethod
    def count(event_type: str, date_from: date | None = None, date_to: date | None = None) -> int:
        queryset = MetricEvent.objects.filter(event_type=event_type)
        if date_from:
            queryset = queryset.filter(occurred_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(occurred_at__date__lte=date_to)
        return queryset.count()
