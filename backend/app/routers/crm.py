from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.services.crm_service import CRMService
from app.schemas.crm import (
    MemberInteractionCreate, MemberInteractionResponse,
    MemberRequestCreate, MemberRequestResponse,
    MemberCommunicationCreate, MemberCommunicationResponse,
    DocumentDistributionCreate, DocumentDistributionResponse,
    MemberCRMSummary
)

router = APIRouter(prefix="/api/v1/crm", tags=["CRM"])


@router.post("/member/{member_id}/interaction", response_model=MemberInteractionResponse)
def create_interaction(
    member_id: int,
    data: MemberInteractionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.create_interaction(db, member_id, data, current_user.id)


@router.get("/member/{member_id}/interactions", response_model=List[MemberInteractionResponse])
def get_interactions(
    member_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.get_member_interactions(db, member_id, limit, offset)


@router.post("/member/{member_id}/request", response_model=MemberRequestResponse)
def create_request(
    member_id: int,
    data: MemberRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.create_request(db, member_id, data, current_user.id)


@router.get("/member/{member_id}/requests", response_model=List[MemberRequestResponse])
def get_requests(
    member_id: int,
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.get_member_requests(db, member_id, status)


@router.put("/request/{request_id}/status")
def update_request_status(
    request_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.update_request_status(db, request_id, status)


@router.put("/request/{request_id}/assign")
def assign_request(
    request_id: int,
    assigned_to: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.assign_request(db, request_id, assigned_to)


@router.post("/member/{member_id}/communication", response_model=MemberCommunicationResponse)
def add_communication(
    member_id: int,
    data: MemberCommunicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.add_communication_preference(db, member_id, data)


@router.get("/member/{member_id}/communications", response_model=List[MemberCommunicationResponse])
def get_communications(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.get_member_communications(db, member_id)


@router.post("/member/{member_id}/document", response_model=DocumentDistributionResponse)
def distribute_document(
    member_id: int,
    data: DocumentDistributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.distribute_document(db, member_id, data, current_user.id)


@router.get("/member/{member_id}/documents", response_model=List[DocumentDistributionResponse])
def get_documents(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.get_member_documents(db, member_id)


@router.put("/document/{doc_id}/acknowledge")
def acknowledge_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.acknowledge_document(db, doc_id)


@router.get("/open-requests", response_model=List[MemberRequestResponse])
def get_open_requests(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.get_open_requests(db, limit)


@router.get("/member/{member_id}/summary", response_model=MemberCRMSummary)
def get_member_crm_summary(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CRMService.get_member_summary(db, member_id)
