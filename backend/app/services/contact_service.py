from math import ceil
from uuid import UUID
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session
from app.models.entities import Contact
from app.schemas.contact import ContactCreate, ContactUpdate

FIELD_MAP = {"company": "company_name", "phone": "phone_number", "customer_source": "source"}

def _data(value):
    data = value.model_dump(exclude_unset=True)
    return {FIELD_MAP.get(k, k): v for k, v in data.items()}

def list_contacts(db: Session, page=1, page_size=20, search=None, status=None, industry=None, city=None, source=None, sort_by="created_at", sort_order="desc"):
    filters = []
    if search:
        term = f"%{search}%"
        filters.append(or_(Contact.full_name.ilike(term), Contact.email.ilike(term), Contact.company_name.ilike(term), Contact.customer_id.ilike(term)))
    for column, value in ((Contact.status,status),(Contact.industry,industry),(Contact.city,city),(Contact.source,source)):
        if value: filters.append(column == value)
    query = select(Contact).where(*filters)
    total = db.scalar(select(func.count()).select_from(Contact).where(*filters)) or 0
    allowed = {"created_at","updated_at","full_name","company_name","status","total_revenue"}
    column = getattr(Contact, sort_by if sort_by in allowed else "created_at")
    query = query.order_by((desc if sort_order == "desc" else asc)(column)).offset((page-1)*page_size).limit(page_size)
    return db.scalars(query).all(), total, ceil(total/page_size) if total else 0

def create_contact(db: Session, payload: ContactCreate):
    contact = Contact(**_data(payload)); db.add(contact); db.commit(); db.refresh(contact); return contact

def update_contact(db: Session, contact: Contact, payload: ContactUpdate):
    for key, value in _data(payload).items(): setattr(contact, key, value)
    db.commit(); db.refresh(contact); return contact

def get_contact(db: Session, contact_id: UUID): return db.get(Contact, contact_id)
