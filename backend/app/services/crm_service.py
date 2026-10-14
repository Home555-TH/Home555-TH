from sqlalchemy.orm import Session
from datetime import datetime
from app.models import (
    MemberInteraction, MemberRequest, MemberCommunication,
    DocumentDistribution, Member, RequestStatus, RequestCategory
)
from app.schemas.crm import (
    MemberInteractionCreate, MemberRequestCreate, MemberCommunicationCreate,
    DocumentDistributionCreate
)


class CRMService:
    @staticmethod
    def create_interaction(db: Session, member_id: int, data: MemberInteractionCreate, created_by: int):
        interaction = MemberInteraction(
            member_id=member_id,
            interaction_type=data.interaction_type,
            subject=data.subject,
            notes=data.notes,
            created_by=created_by
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        return interaction

    @staticmethod
    def get_member_interactions(db: Session, member_id: int, limit: int = 50, offset: int = 0):
        return db.query(MemberInteraction).filter(
            MemberInteraction.member_id == member_id
        ).order_by(MemberInteraction.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def create_request(db: Session, member_id: int, data: MemberRequestCreate, created_by: int):
        request_no = CRMService.generate_request_number(db)
        request = MemberRequest(
            member_id=member_id,
            request_no=request_no,
            category=data.category,
            title=data.title,
            description=data.description,
            priority=data.priority,
            due_date=data.due_date,
            created_by=created_by
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def generate_request_number(db: Session) -> str:
        today = datetime.now()
        month_year = today.strftime("%Y%m")
        last_request = db.query(MemberRequest).filter(
            MemberRequest.request_no.like(f"REQ-{month_year}-%")
        ).order_by(MemberRequest.request_no.desc()).first()

        seq_no = 1
        if last_request:
            last_seq = int(last_request.request_no.split("-")[-1])
            seq_no = last_seq + 1

        return f"REQ-{month_year}-{seq_no:04d}"

    @staticmethod
    def update_request_status(db: Session, request_id: int, status: RequestStatus):
        request = db.query(MemberRequest).filter(MemberRequest.id == request_id).first()
        if request:
            request.status = status
            if status == RequestStatus.RESOLVED or status == RequestStatus.CLOSED:
                request.resolved_at = datetime.now()
            db.commit()
            db.refresh(request)
        return request

    @staticmethod
    def assign_request(db: Session, request_id: int, assigned_to: int):
        request = db.query(MemberRequest).filter(MemberRequest.id == request_id).first()
        if request:
            request.assigned_to = assigned_to
            db.commit()
            db.refresh(request)
        return request

    @staticmethod
    def get_member_requests(db: Session, member_id: int, status: str = None):
        query = db.query(MemberRequest).filter(MemberRequest.member_id == member_id)
        if status:
            query = query.filter(MemberRequest.status == status)
        return query.order_by(MemberRequest.created_at.desc()).all()

    @staticmethod
    def add_communication_preference(db: Session, member_id: int, data: MemberCommunicationCreate):
        if data.is_primary:
            db.query(MemberCommunication).filter(
                MemberCommunication.member_id == member_id,
                MemberCommunication.preference == data.preference
            ).update({MemberCommunication.is_primary: False})

        comm = MemberCommunication(
            member_id=member_id,
            preference=data.preference,
            value=data.value,
            is_primary=data.is_primary
        )
        db.add(comm)
        db.commit()
        db.refresh(comm)
        return comm

    @staticmethod
    def get_member_communications(db: Session, member_id: int):
        return db.query(MemberCommunication).filter(
            MemberCommunication.member_id == member_id
        ).all()

    @staticmethod
    def distribute_document(db: Session, member_id: int, data: DocumentDistributionCreate, created_by: int):
        doc = DocumentDistribution(
            member_id=member_id,
            document_type=data.document_type,
            document_name=data.document_name,
            document_url=data.document_url,
            created_by=created_by
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_member_documents(db: Session, member_id: int):
        return db.query(DocumentDistribution).filter(
            DocumentDistribution.member_id == member_id
        ).order_by(DocumentDistribution.sent_at.desc()).all()

    @staticmethod
    def acknowledge_document(db: Session, doc_id: int):
        doc = db.query(DocumentDistribution).filter(DocumentDistribution.id == doc_id).first()
        if doc:
            doc.acknowledged = True
            doc.acknowledged_at = datetime.now()
            db.commit()
            db.refresh(doc)
        return doc

    @staticmethod
    def get_open_requests(db: Session, limit: int = 50):
        return db.query(MemberRequest).filter(
            MemberRequest.status.in_([RequestStatus.OPEN, RequestStatus.IN_PROGRESS])
        ).order_by(MemberRequest.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_member_summary(db: Session, member_id: int):
        interactions_count = db.query(MemberInteraction).filter(
            MemberInteraction.member_id == member_id
        ).count()

        requests_count = db.query(MemberRequest).filter(
            MemberRequest.member_id == member_id,
            MemberRequest.status.in_([RequestStatus.OPEN, RequestStatus.IN_PROGRESS])
        ).count()

        communications = db.query(MemberCommunication).filter(
            MemberCommunication.member_id == member_id
        ).all()

        documents_count = db.query(DocumentDistribution).filter(
            DocumentDistribution.member_id == member_id
        ).count()

        return {
            "interactions_count": interactions_count,
            "open_requests_count": requests_count,
            "communications": [{"preference": c.preference, "value": c.value} for c in communications],
            "documents_count": documents_count
        }
