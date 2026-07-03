import os
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

class VirtualAssistantService:
    @staticmethod
    def process_query(user_query, user_id=None):
        """
        Process a natural language query using an LLM.
        This uses the OpenAI SDK which can also be pointed to Groq or local LLMs.
        """
        api_key = os.environ.get('OPENAI_API_KEY')
        base_url = os.environ.get('OPENAI_BASE_URL') # e.g., for Groq or vLLM
        model_name = os.environ.get('LLM_MODEL', 'gpt-3.5-turbo')
        
        if not api_key:
            logger.warning("LLM API key not found. Returning mock response.")
            return f"Mock Assistant Response to: '{user_query}'\n\nPlease set your API key in .env to enable real AI responses."
            
        try:
            client = OpenAI(
                api_key=api_key,
                base_url=base_url if base_url else None
            )
            
            # Simple prompt injection for CRM context
            system_prompt = (
                "You are a helpful AI Virtual Assistant for SmartAI CRM. "
                "You help users manage leads, analyze sales data, and automate tasks. "
                "Since you don't have direct DB access in this version, answer generally based on your CRM knowledge, "
                "or pretend to fetch mock data if asked about specific reports."
            )
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error calling LLM API: {e}")
            return "I'm sorry, I encountered an error while processing your request. Please check your API configuration."
