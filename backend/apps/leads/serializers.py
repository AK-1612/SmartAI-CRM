from rest_framework import serializers
from apps.leads.models import Lead, LeadInteraction

class LeadInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadInteraction
        fields = '__all__'
        read_only_fields = ('created_by', 'date')

class LeadSerializer(serializers.ModelSerializer):
    interactions = LeadInteractionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('score', 'conversion_probability', 'ai_insights', 'created_at', 'updated_at')
