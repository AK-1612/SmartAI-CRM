"""Analytics tests."""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import MetricEvent
from .services import AnalyticsService, TrendForecastService


class AnalyticsServiceTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="analyst", password="pass12345")
        self.client.force_authenticate(self.user)

    def test_record_event_via_service(self):
        AnalyticsService.record_event("deal_won", value=1500)
        self.assertEqual(MetricEvent.objects.count(), 1)
        self.assertEqual(MetricEvent.objects.first().event_type, "deal_won")

    def test_dashboard_overview_computes_win_rate(self):
        AnalyticsService.record_event("deal_won", value=1000)
        AnalyticsService.record_event("deal_won", value=2000)
        AnalyticsService.record_event("deal_lost", value=500)

        response = self.client.get(reverse("analytics:dashboard-overview"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sales"]["deals_won"], 2)
        self.assertEqual(response.data["sales"]["revenue_won"], 3000.0)
        self.assertAlmostEqual(response.data["sales"]["win_rate_percent"], 66.7, places=1)

    def test_trend_forecast_detects_upward_trend(self):
        now = timezone.now()
        for day_offset, count in enumerate([1, 2, 3, 4, 5]):
            for _ in range(count):
                AnalyticsService.record_event(
                    "lead_created", occurred_at=now - timedelta(days=(4 - day_offset))
                )

        result = TrendForecastService.forecast("lead_created", days=30, forecast_days=3)
        self.assertEqual(result["trend"], "up")
        self.assertEqual(len(result["projection"]), 3)
        self.assertGreater(result["slope_per_day"], 0)

    def test_trend_forecast_handles_no_data(self):
        result = TrendForecastService.forecast("deal_won", days=30, forecast_days=7)
        self.assertEqual(result["trend"], "insufficient_data")
        self.assertEqual(result["projection"], [])

    def test_recommendations_flag_low_conversion(self):
        for _ in range(20):
            AnalyticsService.record_event("lead_created")
        AnalyticsService.record_event("lead_converted")

        response = self.client.get(reverse("analytics:dashboard-recommendations"))
        self.assertEqual(response.status_code, 200)
        areas = [item["area"] for item in response.data["recommendations"]]
        self.assertIn("lead_conversion", areas)
