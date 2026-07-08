from datetime import datetime
from typing import Annotated
from uuid import UUID
from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field

class ContactBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    company: Annotated[str | None, Field(validation_alias=AliasChoices("company", "company_name"))] = None
    email: EmailStr
    phone: Annotated[str, Field(validation_alias=AliasChoices("phone", "phone_number"))]
    alternate_phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    industry: str | None = None
    customer_source: Annotated[str | None, Field(validation_alias=AliasChoices("customer_source", "source"))] = None
    assigned_employee_id: UUID | None = None
    status: str = "new"
    tags: list[str] = []
    total_revenue: float = 0

class ContactCreate(ContactBase): pass
class ContactUpdate(BaseModel):
    full_name: str | None = None
    company: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    alternate_phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    industry: str | None = None
    customer_source: str | None = None
    assigned_employee_id: UUID | None = None
    status: str | None = None
    tags: list[str] | None = None
    total_revenue: float | None = None

class ContactOut(ContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    customer_id: str
    segment: str
    created_at: datetime
    updated_at: datetime

class ContactPage(BaseModel):
    items: list[ContactOut]
    total: int
    page: int
    page_size: int
    pages: int
