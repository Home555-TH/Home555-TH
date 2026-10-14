from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
from app.models.crm import InteractionType, RequestStatus, RequestCategory, CommunicationPreference


class MemberInteractionCreate(BaseModel):
    interaction_type: InteractionType
    subject: str
    notes: Optional[str] = None


class MemberInteractionResponse(BaseModel):
    id: int
    member_id: int
    interaction_type: InteractionType
    subject: str
    notes: Optional[str]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class MemberRequestCreate(BaseModel):
    category: RequestCategory
    title: str
    description: str
    priority: str = "normal"
    due_date: Optional[date] = None


class MemberRequestResponse(BaseModel):
    id: int
    member_id: int
    request_no: str
    category: RequestCategory
    title: str
    description: str
    status: RequestStatus
    priority: str
    assigned_to: Optional[int]
    due_date: Optional[date]
    resolution_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class MemberCommunicationCreate(BaseModel):
    preference: CommunicationPreference
    value: str
    is_primary: bool = False


class MemberCommunicationResponse(BaseModel):
    id: int
    member_id: int
    preference: CommunicationPreference
    value: str
    is_primary: bool
    is_opted_out: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDistributionCreate(BaseModel):
    document_type: str
    document_name: str
    document_url: Optional[str] = None


class DocumentDistributionResponse(BaseModel):
    id: int
    member_id: int
    document_type: str
    document_name: str
    document_url: Optional[str]
    sent_at: datetime
    opened_at: Optional[datetime]
    acknowledged: bool
    acknowledged_at: Optional[datetime]

    class Config:
        from_attributes = True


class MemberCRMSummary(BaseModel):
    interactions_count: int
    open_requests_count: int
    communications: List[dict]
    documents_count: int
