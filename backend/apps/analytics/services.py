"""Analytics service layer: dashboard aggregation, trend forecasting, recommendations.

Forecasting here is a small pure-Python linear regression over daily counts —
enough to show direction and a next-period estimate without any ML dependency.
Swap `TrendForecastService.forecast` for a model trained under `ai/` (the repo
already has `ai/sales_forecasting/`, `ai/revenue_prediction/`, etc.) once real
historical volume exists; the API response shape here is designed to stay stable.
"""
from __future__ import annotations

from datetime import date, timedelta

from django.utils import timezone

from .models import MetricEvent
from .repositories import MetricEventRepository


class AnalyticsService:
    """Entry point other modules call to log a business event, e.g.
    ``AnalyticsService.record_event("ticket_resolved", value=None, metadata={...})``."""

    @staticmethod
    def record_event(event_type: str, *, value=None, metadata=None, recorded_by=None, occurred_at=None) -> MetricEvent:
        return MetricEventRepository.record(
            event_type, value=value, metadata=metadata, recorded_by=recorded_by, occurred_at=occurred_at
        )


class DashboardService:
    @staticmethod
    def sales_summary(date_from: date | None = None, date_to: date | None = None) -> dict:
        won_value = MetricEventRepository.total_value(MetricEvent.EventType.DEAL_WON, date_from, date_to)
        won_count = MetricEventRepository.count(MetricEvent.EventType.DEAL_WON, date_from, date_to)
        lost_count = MetricEventRepository.count(MetricEvent.EventType.DEAL_LOST, date_from, date_to)
        win_rate = round(won_count / (won_count + lost_count) * 100, 1) if (won_count + lost_count) else None
        return {
            "revenue_won": float(won_value),
            "deals_won": won_count,
            "deals_lost": lost_count,
            "win_rate_percent": win_rate,
        }

    @staticmethod
    def lead_conversion_report(date_from: date | None = None, date_to: date | None = None) -> dict:
        created = MetricEventRepository.count(MetricEvent.EventType.LEAD_CREATED, date_from, date_to)
        converted = MetricEventRepository.count(MetricEvent.EventType.LEAD_CONVERTED, date_from, date_to)
        conversion_rate = round(converted / created * 100, 1) if created else None
        return {"leads_created": created, "leads_converted": converted, "conversion_rate_percent": conversion_rate}

    @staticmethod
    def support_summary() -> dict:
        """Pulls real, live numbers from the support module (already built)."""
        try:
            from apps.support.services import SupportAnalyticsService

            return SupportAnalyticsService.summary()
        except Exception:  # noqa: BLE001
            return {"by_status": {}, "by_priority": {}, "average_resolution_minutes": None, "agent_performance": []}

    @staticmethod
    def overview(date_from: date | None = None, date_to: date | None = None) -> dict:
        return {
            "sales": DashboardService.sales_summary(date_from, date_to),
            "leads": DashboardService.lead_conversion_report(date_from, date_to),
            "support": DashboardService.support_summary(),
            "generated_at": timezone.now().isoformat(),
        }


class TrendForecastService:
    @staticmethod
    def forecast(event_type: str, days: int = 30, forecast_days: int = 7) -> dict:
        """Fits y = a*x + b over the last `days` of daily counts, then projects
        `forecast_days` forward. Returns the historical series plus the projection
        so the frontend can chart both in one line."""
        rows = MetricEventRepository.counts_by_day(event_type, days=days)
        series = [{"date": row["day"].isoformat(), "count": row["count"]} for row in rows]

        if len(series) < 2:
            return {"history": series, "projection": [], "trend": "insufficient_data", "slope_per_day": 0.0}

        xs = list(range(len(series)))
        ys = [point["count"] for point in series]
        n = len(xs)
        mean_x, mean_y = sum(xs) / n, sum(ys) / n
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
        denominator = sum((x - mean_x) ** 2 for x in xs)
        slope = numerator / denominator if denominator else 0.0
        intercept = mean_y - slope * mean_x

        last_date = date.fromisoformat(series[-1]["date"])
        projection = []
        for step in range(1, forecast_days + 1):
            projected_value = max(0, round(slope * (n - 1 + step) + intercept, 1))
            projection.append({"date": (last_date + timedelta(days=step)).isoformat(), "count": projected_value})

        trend = "flat"
        if slope > 0.05:
            trend = "up"
        elif slope < -0.05:
            trend = "down"

        return {"history": series, "projection": projection, "trend": trend, "slope_per_day": round(slope, 2)}


class GrowthRecommendationService:
    """Rule-based recommendations from current metrics — a stand-in for a future
    LLM-generated version (see apps.assistant) that reads the same summary dict."""

    @staticmethod
    def recommendations() -> list[dict]:
        overview = DashboardService.overview()
        notes: list[dict] = []

        conversion_rate = overview["leads"]["conversion_rate_percent"]
        if conversion_rate is not None and conversion_rate < 15:
            notes.append(
                {
                    "area": "lead_conversion",
                    "severity": "warning",
                    "message": f"Lead conversion is {conversion_rate}%, below the 15% healthy baseline. "
                    "Consider tightening lead qualification or following up faster on new leads.",
                }
            )

        win_rate = overview["sales"]["win_rate_percent"]
        if win_rate is not None and win_rate < 25:
            notes.append(
                {
                    "area": "sales_win_rate",
                    "severity": "warning",
                    "message": f"Win rate is {win_rate}%. Review deals stuck in negotiation and consider "
                    "sales-enablement content for common objections.",
                }
            )

        support = overview["support"]
        open_backlog = sum(
            count for status_key, count in support.get("by_status", {}).items() if status_key in {"new", "open", "escalated"}
        )
        if open_backlog > 20:
            notes.append(
                {
                    "area": "support_backlog",
                    "severity": "critical",
                    "message": f"{open_backlog} tickets are open or escalated. Consider rebalancing agent "
                    "assignments or triggering an escalation workflow.",
                }
            )

        if not notes:
            notes.append(
                {
                    "area": "overall",
                    "severity": "info",
                    "message": "Key metrics are within healthy ranges — no action needed right now.",
                }
            )
        return notes
