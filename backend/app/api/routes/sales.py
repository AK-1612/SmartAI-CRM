from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Deal, Contact

router = APIRouter(prefix="/deals", tags=["Sales Pipeline"], dependencies=[Depends(get_current_user)])

class DealCreate(BaseModel):
    contact_id: UUID
    name: str
    stage: str = "Prospecting"
    value: float = 0.0
    close_date: date
    status: str = "Open"

class DealUpdate(BaseModel):
    name: str | None = None
    stage: str | None = None
    value: float | None = None
    close_date: date | None = None
    status: str | None = None

@router.get("")
def list_deals(contact_id: UUID | None = None, stage: str | None = None, db: Session = Depends(get_db)):
    q = select(Deal)
    if contact_id:
        q = q.where(Deal.contact_id == contact_id)
    if stage:
        q = q.where(Deal.stage == stage)
    return db.scalars(q.order_by(Deal.close_date.asc())).all()

@router.post("", status_code=201)
def create_deal(data: DealCreate, db: Session = Depends(get_db)):
    # Verify contact exists
    contact = db.get(Contact, data.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    item = Deal(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db)):
    deals = db.scalars(select(Deal).where(Deal.status == "Open")).all()
    stage_probabilities = {
        "Prospecting": 0.1,
        "Qualification": 0.2,
        "Proposal": 0.5,
        "Negotiation": 0.7,
        "Closed Won": 1.0,
        "Closed Lost": 0.0
    }
    pipeline_total = sum(d.value for d in deals)
    forecasted_revenue = sum(d.value * stage_probabilities.get(d.stage, 0.1) for d in deals)
    
    # Add won deals total
    won_total = db.scalar(select(func.sum(Deal.value)).where(Deal.status == "Won")) or 0.0
    
    return {
        "pipeline_total": pipeline_total,
        "forecasted_revenue": round(forecasted_revenue, 2),
        "actual_won_revenue": float(won_total),
        "open_deals_count": len(deals)
    }

@router.patch("/{deal_id}")
def update_deal(deal_id: UUID, data: DealUpdate, db: Session = Depends(get_db)):
    item = db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    
    if data.status:
        if data.status == "Won":
            item.stage = "Closed Won"
        elif data.status == "Lost":
            item.stage = "Closed Lost"
            
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: UUID, db: Session = Depends(get_db)):
    item = db.get(Deal, deal_id)
    if not item:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)
