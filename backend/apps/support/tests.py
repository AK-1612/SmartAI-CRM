"""Customer support tests."""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .ai_helpers import analyze_sentiment, categorize_ticket
from .models import KnowledgeBaseArticle, SLAPolicy, Ticket


class AIHelperTests(APITestCase):
    def test_categorize_ticket_matches_billing_keywords(self):
        category = categorize_ticket("Refund request", "I was charged twice on my invoice this month.")
        self.assertEqual(category, "billing")

    def test_analyze_sentiment_flags_negative_language(self):
        label, score = analyze_sentiment("This is broken and unacceptable, I am furious")
        self.assertEqual(label, "negative")
        self.assertLess(score, 0)


class TicketAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.agent = User.objects.create_user(username="agent1", password="pass12345")
        self.client.force_authenticate(self.agent)
        SLAPolicy.objects.create(name="High priority", priority="high", response_time_minutes=30, resolution_time_minutes=240)
        SLAPolicy.objects.create(name="Medium priority", priority="medium", response_time_minutes=120, resolution_time_minutes=1440)
        SLAPolicy.objects.create(name="Low priority", priority="low", response_time_minutes=480, resolution_time_minutes=4320)

    def test_create_ticket_auto_categorizes_and_sets_sla(self):
        response = self.client.post(
            reverse("support:ticket-list"),
            {
                "subject": "Can't log in to my account",
                "description": "I keep getting an error when I try to reset my password.",
                "customer_name": "Priya Shah",
                "customer_email": "priya@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["category"], "account")
        self.assertIsNotNone(response.data["response_due_at"])

    def test_assign_and_resolve_flow(self):
        ticket = Ticket.objects.create(
            subject="App crashes on save",
            description="The app crashes every time I try to save changes.",
            customer_name="Alex",
            customer_email="alex@example.com",
            category="technical",
            priority="medium",
        )
        assign_response = self.client.post(
            reverse("support:ticket-assign", args=[ticket.id]), {"agent_id": self.agent.id}, format="json"
        )
        self.assertEqual(assign_response.status_code, 200)
        self.assertEqual(assign_response.data["status"], "open")

        resolve_response = self.client.post(reverse("support:ticket-resolve", args=[ticket.id]))
        self.assertEqual(resolve_response.status_code, 200)
        self.assertEqual(resolve_response.data["status"], "resolved")
        self.assertIsNotNone(resolve_response.data["resolved_at"])

    def test_chatbot_matches_knowledge_base_article(self):
        KnowledgeBaseArticle.objects.create(
            title="How to reset your password",
            slug="reset-password",
            body="Go to Settings > Security > Reset Password and follow the emailed link.",
            keywords=["password", "reset", "login"],
        )
        response = self.client.post(
            reverse("support:chatbot"), {"message": "I forgot my password and can't login"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["source_title"], "How to reset your password")

    def test_summary_endpoint_returns_status_breakdown(self):
        Ticket.objects.create(
            subject="Billing issue", description="charged twice", customer_name="A", customer_email="a@example.com",
            status="open",
        )
        response = self.client.get(reverse("support:summary"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("by_status", response.data)
        self.assertEqual(response.data["by_status"].get("open"), 1)
