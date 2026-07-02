"""Analytics API views."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MetricEvent
from .serializers import DateRangeSerializer, MetricEventSerializer, TrendForecastQuerySerializer
from .services import AnalyticsService, DashboardService, GrowthRecommendationService, TrendForecastService


class MetricEventViewSet(viewsets.ModelViewSet):
    """Create/list raw metric events. Other backend modules should generally call
    ``AnalyticsService.record_event(...)`` directly instead of this endpoint."""

    queryset = MetricEvent.objects.all()
    serializer_class = MetricEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        event_type = self.request.query_params.get("event_type")
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        return queryset

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class DashboardOverviewView(APIView):
    """Real-time dashboard: sales, lead conversion, and support metrics in one call."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = DateRangeSerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        overview = DashboardService.overview(**params.validated_data)
        return Response(overview)


class TrendForecastView(APIView):
    """GET ?event_type=lead_created&days=30&forecast_days=7 -> history + simple linear projection."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        params = TrendForecastQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        return Response(TrendForecastService.forecast(**params.validated_data))


class GrowthRecommendationsView(APIView):
    """Rule-based business growth recommendations derived from current dashboard metrics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"recommendations": GrowthRecommendationService.recommendations()})
