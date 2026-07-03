from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.assistant.services import VirtualAssistantService

class AssistantChatView(APIView):
    def post(self, request):
        query = request.data.get('query')
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        user_id = request.user.id if request.user.is_authenticated else None
        
        # Process the query using the AI Service
        response_text = VirtualAssistantService.process_query(query, user_id=user_id)
        
        return Response({
            'query': query,
            'response': response_text
        })
