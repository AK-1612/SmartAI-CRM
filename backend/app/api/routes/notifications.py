from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"], dependencies=[Depends(get_current_user)])

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, warning, error, alert
    due_at: datetime | None = None

@router.get("")
def list_notifications(unread_only: bool = False, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        q = q.where(Notification.read_at.is_(None))
    return db.scalars(q.order_by(Notification.created_at.desc())).all()

@router.post("", status_code=201)
def create_notification(data: NotificationCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    item = Notification(
        user_id=current_user.id,
        type=data.type,
        title=data.title,
        read_at=None,
        due_at=data.due_at
    )
    # We should dynamically handle if message is stored or not. Let's make sure it matches the table schema.
    # The Notification model in entities.py is:
    # id, user_id, type, title, due_at, read_at
    # Let's verify entities.py attributes to prevent writing fields that don't exist.
    # In entities.py:
    # class Notification(Base):
    #     id, user_id, type, title, due_at, read_at
    # There is no message field in entities.py's Notification! So we will store message details in title.
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/{notification_id}/read")
def mark_read(notification_id: UUID, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    item.read_at = datetime.now()
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{notification_id}", status_code=204)
def delete_notification(notification_id: UUID, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)
