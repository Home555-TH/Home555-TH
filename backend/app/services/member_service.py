from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberUpdate

class MemberService:
    @staticmethod
    def get_members(db: Session, skip: int = 0, limit: int = 100, search: str = None, status: str = None):
        """Get members with optional search and filter"""
        query = db.query(Member)

        if search:
            query = query.filter(
                or_(
                    Member.house_no.ilike(f"%{search}%"),
                    Member.name.ilike(f"%{search}%"),
                    Member.email.ilike(f"%{search}%")
                )
            )

        if status:
            query = query.filter(Member.status == status)

        total = query.count()
        items = query.offset(skip).limit(limit).all()
        total_outstanding = sum(m.outstanding_balance for m in items)

        return items, total, total_outstanding

    @staticmethod
    def get_member_by_id(db: Session, member_id: int) -> Member | None:
        """Get member by ID"""
        return db.query(Member).filter(Member.id == member_id).first()

    @staticmethod
    def get_member_by_house_no(db: Session, house_no: str) -> Member | None:
        """Get member by house number"""
        return db.query(Member).filter(Member.house_no == house_no).first()

    @staticmethod
    def create_member(db: Session, member_data: MemberCreate) -> Member:
        """Create new member"""
        member = Member(**member_data.dict())
        db.add(member)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def update_member(db: Session, member: Member, update_data: MemberUpdate) -> Member:
        """Update member"""
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(member, field, value)
        db.commit()
        db.refresh(member)
        return member

    @staticmethod
    def delete_member(db: Session, member: Member):
        """Soft delete member (set status to inactive)"""
        member.status = "inactive"
        db.commit()

    @staticmethod
    def get_summary(db: Session):
        """Get summary statistics"""
        total_members = db.query(Member).filter(Member.status == "active").count()
        total_outstanding = db.query(Member).filter(Member.status == "active").with_entities(
            db.func.sum(Member.outstanding_balance)
        ).scalar() or 0

        return {
            "total_members": total_members,
            "total_outstanding": total_outstanding
        }
