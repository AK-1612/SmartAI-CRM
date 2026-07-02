"""Analytics serializers."""
from rest_framework import serializers

from .models import MetricEvent


class MetricEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricEvent
        fields = ["id", "event_type", "value", "metadata", "recorded_by", "occurred_at", "created_at"]
        read_only_fields = ["recorded_by", "created_at"]


class DateRangeSerializer(serializers.Serializer):
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)


class TrendForecastQuerySerializer(serializers.Serializer):
    event_type = serializers.ChoiceField(choices=MetricEvent.EventType.choices)
    days = serializers.IntegerField(required=False, default=30, min_value=2, max_value=365)
    forecast_days = serializers.IntegerField(required=False, default=7, min_value=1, max_value=90)
