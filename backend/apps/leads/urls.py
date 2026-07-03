from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.leads.views import LeadViewSet, LeadInteractionViewSet

router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'interactions', LeadInteractionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
