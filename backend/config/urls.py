"""Root URL configuration for the SmartAI CRM API."""
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/users/", include("apps.users.urls")),
    path("api/leads/", include("apps.leads.urls")),
    path("api/contacts/", include("apps.contacts.urls")),
    path("api/sales/", include("apps.sales.urls")),
    path("api/marketing/", include("apps.marketing.urls")),
    path("api/support/", include("apps.support.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/workflow/", include("apps.workflow.urls")),
    path("api/assistant/", include("apps.assistant.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/documents/", include("apps.documents.urls")),
    path("api/communication/", include("apps.communication.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
]
