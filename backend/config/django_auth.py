import os
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from jose import jwt

class FastAPIJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.split(" ")[1]
        try:
            secret_key = os.getenv("SECRET_KEY", "change-me-in-production")
            # Decode using FastAPI's shared parameters
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            user_id = payload.get("sub")
            if not user_id:
                return None
                
            # Create a unique but valid username string from the UUID sub claim
            username = f"u_{user_id.replace('-', '')[:28]}"
            
            # Auto-provision a Django User instance so SimpleJWT/Django permissions succeed
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "is_active": True,
                    "is_staff": True,
                    "is_superuser": True
                }
            )
            return (user, token)
        except Exception as e:
            raise AuthenticationFailed(f"Invalid FastAPI JWT Token signature or structure: {str(e)}")
