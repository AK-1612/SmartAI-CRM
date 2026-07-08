from fastapi import APIRouter,Depends
from sqlalchemy import func,select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Activity,Contact
router=APIRouter(prefix="/dashboard",tags=["Dashboard"],dependencies=[Depends(get_current_user)])
@router.get("")
def dashboard(db:Session=Depends(get_db)):
    total=db.scalar(select(func.count()).select_from(Contact)) or 0
    revenue=db.scalar(select(func.coalesce(func.sum(Contact.total_revenue),0))) or 0
    statuses=db.execute(select(Contact.status,func.count()).group_by(Contact.status)).all()
    industries=db.execute(select(Contact.industry,func.count()).group_by(Contact.industry).order_by(func.count().desc()).limit(8)).all()
    return {"total_contacts":total,"total_revenue":float(revenue),"activities":db.scalar(select(func.count()).select_from(Activity)) or 0,"by_status":[{"name":x or "Unknown","value":n} for x,n in statuses],"by_industry":[{"name":x or "Unknown","value":n} for x,n in industries]}
