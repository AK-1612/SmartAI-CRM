"""Customer support API views."""
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import KnowledgeBaseArticle, SLAPolicy, Ticket
from .serializers import (
    AddCommentSerializer,
    AssignTicketSerializer,
    ChatbotQuerySerializer,
    KnowledgeBaseArticleSerializer,
    SLAPolicySerializer,
    TicketCommentSerializer,
    TicketCreateSerializer,
    TicketSerializer,
)
from .services import KnowledgeBaseService, SupportAnalyticsService, TicketService


class TicketViewSet(viewsets.ModelViewSet):
    """Ticket CRUD plus assign/comment/resolve/escalate/suggest-response actions."""

    queryset = Ticket.objects.select_related("assigned_to", "created_by", "sla_policy").prefetch_related("comments")
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get("status")
        priority_param = self.request.query_params.get("priority")
        assigned_to = self.request.query_params.get("assigned_to")
        if status_param:
            queryset = queryset.filter(status=status_param)
        if priority_param:
            queryset = queryset.filter(priority=priority_param)
        if assigned_to == "me":
            queryset = queryset.filter(assigned_to=self.request.user)
        elif assigned_to == "unassigned":
            queryset = queryset.filter(assigned_to__isnull=True)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = TicketCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = TicketService.create_ticket(created_by=request.user, **serializer.validated_data)
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        serializer = AssignTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agent = get_user_model().objects.get(pk=serializer.validated_data["agent_id"])
        TicketService.assign(ticket, agent)
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        ticket = TicketService.resolve(self.get_object())
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["post"])
    def escalate(self, request, pk=None):
        ticket = TicketService.escalate(self.get_object().id)
        return Response(TicketSerializer(ticket).data)

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        ticket = self.get_object()
        if request.method == "GET":
            return Response(TicketCommentSerializer(ticket.comments.select_related("author"), many=True).data)

        serializer = AddCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = TicketService.add_comment(ticket, author=request.user, **serializer.validated_data)
        return Response(TicketCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="suggest-response")
    def suggest_response(self, request, pk=None):
        ticket = self.get_object()
        return Response({"suggested_response": TicketService.suggest_response(ticket)})


class SLAPolicyViewSet(viewsets.ModelViewSet):
    queryset = SLAPolicy.objects.all()
    serializer_class = SLAPolicySerializer
    permission_classes = [IsAuthenticated]


class KnowledgeBaseArticleViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeBaseArticle.objects.all()
    serializer_class = KnowledgeBaseArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("published") == "true":
            queryset = queryset.filter(is_published=True)
        return queryset


class ChatbotQueryView(APIView):
    """POST a customer message and get back a KB-grounded chatbot answer."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatbotQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = KnowledgeBaseService.chatbot_reply(serializer.validated_data["message"])
        return Response(reply)


class SupportSummaryView(APIView):
    """Aggregated support metrics for dashboards (status/priority breakdown, SLA, agent load)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(SupportAnalyticsService.summary())
