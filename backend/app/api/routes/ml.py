from fastapi import APIRouter,Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.ml_service import predict
router=APIRouter(tags=["AI Engagement"],dependencies=[Depends(get_current_user)])
class ActivityFeatures(BaseModel):
    total_calls:int=0; total_emails:int=0; email_opens:int=0; email_replies:int=0; meetings_done:int=0; purchase_count:int=0; total_revenue:float=0; support_tickets:int=0; website_visits:int=0; days_since_last_contact:int=0
@router.post("/predict")
def prediction(data:ActivityFeatures): return predict(data.model_dump())
@router.post("/ml/predict")
def ml_prediction(data:ActivityFeatures): return predict(data.model_dump())
