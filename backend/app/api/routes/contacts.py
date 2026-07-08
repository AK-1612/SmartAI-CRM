from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import Activity, Contact, Role
from app.schemas.activity import ActivityOut
from app.schemas.contact import ContactCreate, ContactOut, ContactPage, ContactUpdate
from app.services import contact_service

router=APIRouter(prefix="/contacts",tags=["Contacts"],dependencies=[Depends(get_current_user)])
def output(c):
    return ContactOut.model_validate(c).model_dump()
@router.get("",response_model=ContactPage)
def listing(db:Session=Depends(get_db),page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),search:str|None=None,status:str|None=None,industry:str|None=None,city:str|None=None,source:str|None=None,sort_by:str="created_at",sort_order:str="desc"):
    items,total,pages=contact_service.list_contacts(db,page,page_size,search,status,industry,city,source,sort_by,sort_order); return {"items":[output(x) for x in items],"total":total,"page":page,"page_size":page_size,"pages":pages}
@router.post("",status_code=201)
def create(data:ContactCreate,db:Session=Depends(get_db)): return output(contact_service.create_contact(db,data))
@router.get("/{contact_id}")
def detail(contact_id:UUID,db:Session=Depends(get_db)):
    item=contact_service.get_contact(db,contact_id)
    if not item: raise HTTPException(404,"Contact not found")
    return output(item)
@router.patch("/{contact_id}")
def update(contact_id:UUID,data:ContactUpdate,db:Session=Depends(get_db)):
    item=contact_service.get_contact(db,contact_id)
    if not item: raise HTTPException(404,"Contact not found")
    return output(contact_service.update_contact(db,item,data))
@router.delete("/{contact_id}",status_code=204,dependencies=[Depends(require_roles(Role.admin.value,Role.manager.value))])
def delete(contact_id:UUID,db:Session=Depends(get_db)):
    item=contact_service.get_contact(db,contact_id)
    if not item: raise HTTPException(404,"Contact not found")
    db.delete(item); db.commit(); return Response(status_code=204)
@router.get("/{contact_id}/timeline",response_model=list[ActivityOut])
def timeline(contact_id:UUID,db:Session=Depends(get_db)): return db.scalars(select(Activity).where(Activity.contact_id==contact_id).order_by(Activity.created_at.desc())).all()
