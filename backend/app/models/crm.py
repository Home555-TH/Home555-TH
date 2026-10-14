from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import Base


class InteractionType(str, enum.Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    VISIT = "visit"
    MESSAGE = "message"


class RequestStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class RequestCategory(str, enum.Enum):
    MAINTENANCE = "maintenance"
    COMPLAINT = "complaint"
    REQUEST = "request"
    BILLING = "billing"
    OTHER = "other"


class CommunicationPreference(str, enum.Enum):
    PHONE = "phone"
    EMAIL = "email"
    SMS = "sms"
    LINE = "line"


class MemberInteraction(Base):
    __tablename__ = "member_interactions"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    interaction_type = Column(Enum(InteractionType), nullable=False)
    subject = Column(String(255), nullable=False)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    member = relationship("Member", back_populates="interactions")
    created_user = relationship("User", foreign_keys=[created_by])


class MemberRequest(Base):
    __tablename__ = "member_requests"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    request_no = Column(String(50), unique=True, nullable=False)
    category = Column(Enum(RequestCategory), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.OPEN, nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    priority = Column(String(20), default="normal")
    due_date = Column(Date)
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    member = relationship("Member", back_populates="requests")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    created_user = relationship("User", foreign_keys=[created_by])


class MemberCommunication(Base):
    __tablename__ = "member_communications"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    preference = Column(Enum(CommunicationPreference), nullable=False)
    value = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    is_opted_out = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    member = relationship("Member", back_populates="communications")


class DocumentDistribution(Base):
    __tablename__ = "document_distributions"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    document_type = Column(String(50), nullable=False)
    document_name = Column(String(255), nullable=False)
    document_url = Column(String(500))
    sent_at = Column(DateTime, default=datetime.now, nullable=False)
    opened_at = Column(DateTime)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    member = relationship("Member", back_populates="document_distributions")
    created_user = relationship("User", foreign_keys=[created_by])
