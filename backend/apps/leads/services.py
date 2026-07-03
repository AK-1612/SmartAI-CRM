from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AIScoringService:
    @staticmethod
    def calculate_score(lead):
        """
        Calculates the lead score and conversion probability using an AI model.
        Since we don't have a live model here yet, this is a placeholder heuristic 
        that would normally call an external AI API (e.g., Google Gemini or OpenAI).
        """
        # Placeholder heuristic logic
        score = 50
        insights = []
        
        if lead.company:
            score += 20
            insights.append("Has company information.")
        
        if lead.phone:
            score += 10
            insights.append("Provided phone number.")
            
        if lead.source == 'Website':
            score += 10
            insights.append("Inbound website lead.")
            
        # Normalize score
        score = min(score, 100)
        probability = score / 100.0
        
        # Update lead
        lead.score = score
        lead.conversion_probability = probability
        lead.ai_insights = " ".join(insights)
        lead.save(update_fields=['score', 'conversion_probability', 'ai_insights'])
        
        return lead
