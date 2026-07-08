from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ActivityCreate(BaseModel):
    contact_id: UUID
    type: str
    subject: str | None = None
    body: str | None = None
    sender: str | None = None
    receiver: str | None = None
    duration_seconds: int | None = None
    scheduled_at: datetime | None = None

class ActivityOut(ActivityCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
