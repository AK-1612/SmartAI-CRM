"""Customer support API routes."""
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ChatbotQueryView,
    KnowledgeBaseArticleViewSet,
    SLAPolicyViewSet,
    SupportSummaryView,
    TicketViewSet,
)

app_name = "support"

router = DefaultRouter()
router.register("tickets", TicketViewSet, basename="ticket")
router.register("sla-policies", SLAPolicyViewSet, basename="sla-policy")
router.register("kb-articles", KnowledgeBaseArticleViewSet, basename="kb-article")

urlpatterns = [
    path("chatbot/", ChatbotQueryView.as_view(), name="chatbot"),
    path("summary/", SupportSummaryView.as_view(), name="summary"),
] + router.urls
