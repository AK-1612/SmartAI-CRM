from datetime import timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_token, hash_password, verify_password
from app.models.entities import Role, User

router = APIRouter(prefix="/auth", tags=["Authentication"])
class Register(BaseModel):
    email: EmailStr; full_name: str; password: str = Field(min_length=8); role: Role = Role.employee
class Refresh(BaseModel): refresh_token: str

def tokens(user):
    return {"access_token": create_token(str(user.id), user.role.value, "access"), "refresh_token": create_token(str(user.id), user.role.value, "refresh", timedelta(days=7)), "token_type":"bearer"}

@router.post("/register", status_code=201)
def register(data: Register, db: Session=Depends(get_db)):
    if db.scalar(select(User).where(User.email==data.email)): raise HTTPException(409,"Email already registered")
    user=User(email=data.email,full_name=data.full_name,password_hash=hash_password(data.password),role=data.role); db.add(user); db.commit(); db.refresh(user); return tokens(user)

@router.post("/token")
def login(form: OAuth2PasswordRequestForm=Depends(), db: Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==form.username))
    if not user or not verify_password(form.password,user.password_hash): raise HTTPException(401,"Invalid credentials")
    return tokens(user)

@router.post("/refresh")
def refresh(data: Refresh, db: Session=Depends(get_db)):
    from app.core.security import decode_token
    payload=decode_token(data.refresh_token,"refresh"); user=db.get(User,UUID(payload["sub"]))
    if not user or not user.is_active: raise HTTPException(401,"Invalid refresh token")
    return tokens(user)
