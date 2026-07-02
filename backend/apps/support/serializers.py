"""Customer support serializers."""
from rest_framework import serializers

from .models import KnowledgeBaseArticle, SLAPolicy, Ticket, TicketComment


class SLAPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = SLAPolicy
        fields = ["id", "name", "priority", "response_time_minutes", "resolution_time_minutes"]


class KnowledgeBaseArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseArticle
        fields = ["id", "title", "slug", "body", "category", "keywords", "is_published", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True, default=None)

    class Meta:
        model = TicketComment
        fields = ["id", "ticket", "author", "author_name", "body", "is_internal", "is_ai_suggested", "created_at"]
        read_only_fields = ["ticket", "author", "author_name", "is_ai_suggested", "created_at"]


class TicketSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True, default=None)
    is_response_sla_breached = serializers.BooleanField(read_only=True)
    is_resolution_sla_breached = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "subject",
            "description",
            "customer_name",
            "customer_email",
            "status",
            "priority",
            "category",
            "sentiment",
            "sentiment_score",
            "assigned_to",
            "assigned_to_name",
            "sla_policy",
            "response_due_at",
            "resolution_due_at",
            "first_responded_at",
            "resolved_at",
            "is_response_sla_breached",
            "is_resolution_sla_breached",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "status",
            "category",
            "sentiment",
            "sentiment_score",
            "sla_policy",
            "response_due_at",
            "resolution_due_at",
            "first_responded_at",
            "resolved_at",
            "created_at",
            "updated_at",
        ]


class TicketCreateSerializer(serializers.Serializer):
    """Input-only serializer for POST /tickets/ so AI-derived fields can't be spoofed."""

    subject = serializers.CharField(max_length=200)
    description = serializers.CharField()
    customer_name = serializers.CharField(max_length=150)
    customer_email = serializers.EmailField()
    priority = serializers.ChoiceField(choices=Ticket.Priority.choices, required=False)


class AssignTicketSerializer(serializers.Serializer):
    agent_id = serializers.IntegerField()


class AddCommentSerializer(serializers.Serializer):
    body = serializers.CharField()
    is_internal = serializers.BooleanField(default=False)


class ChatbotQuerySerializer(serializers.Serializer):
    message = serializers.CharField()
