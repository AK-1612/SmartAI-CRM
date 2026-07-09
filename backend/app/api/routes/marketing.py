from uuid import UUID
from datetime import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Campaign

router = APIRouter(prefix="/campaigns", tags=["Marketing Campaigns"], dependencies=[Depends(get_current_user)])

class CampaignCreate(BaseModel):
    name: str
    channel: str = "Email"  # Email, SMS, WhatsApp
    subject: str | None = None
    content: str | None = None
    target_segment: str | None = None

class CampaignUpdate(BaseModel):
    name: str | None = None
    channel: str | None = None
    subject: str | None = None
    content: str | None = None
    target_segment: str | None = None
    status: str | None = None

@router.get("")
def list_campaigns(channel: str | None = None, status: str | None = None, db: Session = Depends(get_db)):
    q = select(Campaign)
    if channel:
        q = q.where(Campaign.channel == channel)
    if status:
        q = q.where(Campaign.status == status)
    return db.scalars(q.order_by(Campaign.created_at.desc())).all()

@router.post("", status_code=201)
def create_campaign(data: CampaignCreate, db: Session = Depends(get_db)):
    item = Campaign(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/{campaign_id}/send")
def send_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    item = db.get(Campaign, campaign_id)
    if not item:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if item.status == "Completed":
        raise HTTPException(status_code=400, detail="Campaign already sent")
        
    # Simulate campaign execution
    target_sizes = {
        "New Customer": 250,
        "High Value": 120,
        "Churn Risk": 85,
        "All": 450
    }
    sent = target_sizes.get(item.target_segment, 150)
    
    # Random realistic performance metrics
    open_rate = random.uniform(0.15, 0.35) if item.channel == "Email" else random.uniform(0.70, 0.95)
    click_rate = random.uniform(0.02, 0.08) if item.channel == "Email" else random.uniform(0.10, 0.25)
    
    opens = int(sent * open_rate)
    clicks = int(opens * click_rate)
    
    item.status = "Completed"
    item.sent_count = sent
    item.open_count = opens
    item.click_count = clicks
    item.sent_at = datetime.now()
    
    db.commit()
    db.refresh(item)
    return item

@router.patch("/{campaign_id}")
def update_campaign(campaign_id: UUID, data: CampaignUpdate, db: Session = Depends(get_db)):
    item = db.get(Campaign, campaign_id)
    if not item:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
        
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    item = db.get(Campaign, campaign_id)
    if not item:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)
