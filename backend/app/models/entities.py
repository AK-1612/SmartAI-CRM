import enum
import uuid
from datetime import date, datetime
from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Role(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.employee)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (Index("ix_contacts_filter", "status", "industry", "city", "source"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, default=lambda: f"CRM-{uuid.uuid4().hex[:10].upper()}")
    full_name: Mapped[str] = mapped_column(String(160), index=True)
    company_name: Mapped[str | None] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(32))
    alternate_phone: Mapped[str | None] = mapped_column(String(32))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    industry: Mapped[str | None] = mapped_column(String(100))
    source: Mapped[str | None] = mapped_column(String(100))
    assigned_employee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="new", index=True)
    segment: Mapped[str] = mapped_column(String(40), default="New Customer", index=True)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    birth_date: Mapped[date | None] = mapped_column(Date)
    total_revenue: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    activities: Mapped[list["Activity"]] = relationship(back_populates="contact", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="contact", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(40), index=True)
    subject: Mapped[str | None] = mapped_column(String(255))
    body: Mapped[str | None] = mapped_column(Text)
    sender: Mapped[str | None] = mapped_column(String(320))
    receiver: Mapped[str | None] = mapped_column(String(320))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    contact: Mapped[Contact] = relationship(back_populates="activities")


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"), index=True)
    original_name: Mapped[str] = mapped_column(String(255))
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    content_type: Mapped[str] = mapped_column(String(120))
    size_bytes: Mapped[int] = mapped_column(Integer)
    expires_at: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    contact: Mapped[Contact] = relationship(back_populates="documents")


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(255))
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class EngagementScore(Base):
    __tablename__ = "engagement_scores"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"), index=True)
    level: Mapped[str] = mapped_column(String(20), index=True)
    score: Mapped[float] = mapped_column(Float)
    probability: Mapped[float] = mapped_column(Float)
    top_features: Mapped[str | None] = mapped_column(Text)
    recommendations: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
