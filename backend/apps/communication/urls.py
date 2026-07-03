from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.communication.views import CommunicationLogViewSet, MessageTemplateViewSet

router = DefaultRouter()
router.register(r'logs', CommunicationLogViewSet)
router.register(r'templates', MessageTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
