from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_token(subject: str, role: str, token_type: str = "access", lifetime: timedelta | None = None) -> str:
    expires = datetime.now(timezone.utc) + (lifetime or timedelta(minutes=settings.access_token_expire_minutes))
    return jwt.encode({"sub": subject, "role": role, "type": token_type, "exp": expires}, settings.secret_key, algorithm=settings.algorithm)

def create_access_token(subject: str, role: str) -> str:
    return create_token(subject, role)

def decode_token(token: str, expected_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.models.entities import User
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
    except JWTError as exc:
        raise unauthorized from exc
    try:
        parsed_user_id = UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise unauthorized from exc
    user = db.scalar(select(User).where(User.id == parsed_user_id, User.is_active.is_(True)))
    if not user:
        raise unauthorized
    return user


def require_roles(*roles: str):
    def dependency(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency
