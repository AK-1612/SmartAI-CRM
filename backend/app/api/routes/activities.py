from uuid import UUID
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Activity
from app.schemas.activity import ActivityCreate,ActivityOut
router=APIRouter(prefix="/activities",tags=["Activities"],dependencies=[Depends(get_current_user)])
@router.get("",response_model=list[ActivityOut])
def list_all(contact_id:UUID|None=None,type:str|None=None,db:Session=Depends(get_db)):
    q=select(Activity); q=q.where(Activity.contact_id==contact_id) if contact_id else q; q=q.where(Activity.type==type) if type else q; return db.scalars(q.order_by(Activity.created_at.desc()).limit(200)).all()
@router.post("",response_model=ActivityOut,status_code=201)
def create(data:ActivityCreate,db:Session=Depends(get_db)):
    item=Activity(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
@router.delete("/{activity_id}",status_code=204)
def delete(activity_id:UUID,db:Session=Depends(get_db)):
    item=db.get(Activity,activity_id)
    if not item: raise HTTPException(404,"Activity not found")
    db.delete(item);db.commit()
