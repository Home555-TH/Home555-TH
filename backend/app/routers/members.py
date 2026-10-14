from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.member import MemberCreate, MemberUpdate, MemberResponse, MemberListResponse
from app.services.member_service import MemberService
from app.utils.auth import get_current_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/api/members", tags=["members"])

@router.get("", response_model=MemberListResponse)
async def list_members(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all members with optional search"""
    items, total, total_outstanding = MemberService.get_members(db, skip, limit, search, status)
    return {
        "total": total,
        "items": [MemberResponse.from_orm(item) for item in items],
        "total_outstanding": total_outstanding
    }

@router.get("/summary")
async def get_members_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get members summary statistics"""
    return MemberService.get_summary(db)

@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get member by ID"""
    member = MemberService.get_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return MemberResponse.from_orm(member)

@router.post("", response_model=MemberResponse)
async def create_member(
    member_data: MemberCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create new member"""
    existing = MemberService.get_member_by_house_no(db, member_data.house_no)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="House number already exists")

    member = MemberService.create_member(db, member_data)
    return MemberResponse.from_orm(member)

@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(
    member_id: int,
    member_data: MemberUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update member"""
    member = MemberService.get_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    member = MemberService.update_member(db, member, member_data)
    return MemberResponse.from_orm(member)

@router.delete("/{member_id}")
async def delete_member(
    member_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete member (soft delete)"""
    member = MemberService.get_member_by_id(db, member_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    MemberService.delete_member(db, member)
    return {"message": "Member deleted successfully"}
