"""Analytics API routes."""
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DashboardOverviewView, GrowthRecommendationsView, MetricEventViewSet, TrendForecastView

app_name = "analytics"

router = DefaultRouter()
router.register("events", MetricEventViewSet, basename="metric-event")

urlpatterns = [
    path("dashboard/overview/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("dashboard/trend/", TrendForecastView.as_view(), name="dashboard-trend"),
    path("dashboard/recommendations/", GrowthRecommendationsView.as_view(), name="dashboard-recommendations"),
] + router.urls
