from rest_framework import serializers
from apps.communication.models import CommunicationLog, MessageTemplate

class CommunicationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationLog
        fields = '__all__'
        read_only_fields = ('status', 'error_message', 'sent_by', 'timestamp')

class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = '__all__'
