from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.ar import ARInvoice, ARReceipt, ARInvoiceStatus, ARReceiptPaymentMethod
from app.models.member import Member
from app.schemas.ar import ARInvoiceCreateRequest, ARInvoiceUpdateRequest, ARReceiptCreateRequest, ARAging


class ARService:
    @staticmethod
    def generate_invoice_number(db: Session, month_year: str) -> tuple[str, int]:
        """Generate next invoice number for given month: INV-202601-0001"""
        max_seq = db.query(func.max(ARInvoice.seq_no)).filter(
            ARInvoice.month_year == month_year
        ).scalar() or 0

        next_seq = max_seq + 1
        invoice_no = f"INV-{month_year}-{next_seq:04d}"
        return invoice_no, next_seq

    @staticmethod
    def generate_receipt_number(db: Session, month_year: str) -> tuple[str, int]:
        """Generate next receipt number for given month: REC-202601-0001"""
        max_seq = db.query(func.max(ARReceipt.seq_no)).filter(
            ARReceipt.month_year == month_year
        ).scalar() or 0

        next_seq = max_seq + 1
        receipt_no = f"REC-{month_year}-{next_seq:04d}"
        return receipt_no, next_seq

    @staticmethod
    def create_invoice(db: Session, invoice_data: ARInvoiceCreateRequest) -> ARInvoice:
        """Create new AR Invoice in draft status"""
        # Verify member exists
        member = db.query(Member).filter(Member.id == invoice_data.member_id).first()
        if not member:
            raise ValueError(f"Member not found: {invoice_data.member_id}")

        # Get month_year from invoice_date
        month_year = invoice_data.invoice_date.strftime('%Y%m')

        # Generate invoice number
        invoice_no, seq_no = ARService.generate_invoice_number(db, month_year)

        # Create invoice
        invoice = ARInvoice(
            invoice_no=invoice_no,
            month_year=month_year,
            seq_no=seq_no,
            member_id=invoice_data.member_id,
            invoice_date=invoice_data.invoice_date,
            due_date=invoice_data.due_date,
            description=invoice_data.description,
            amount=invoice_data.amount,
            status=ARInvoiceStatus.DRAFT,
            notes=invoice_data.notes
        )

        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def update_invoice(db: Session, invoice_id: int, invoice_data: ARInvoiceUpdateRequest) -> ARInvoice:
        """Update AR Invoice (draft only)"""
        invoice = db.query(ARInvoice).filter(ARInvoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice not found: {invoice_id}")

        if invoice.status != ARInvoiceStatus.DRAFT:
            raise ValueError(f"Cannot update invoice in {invoice.status} status")

        if invoice_data.invoice_date is not None:
            invoice.invoice_date = invoice_data.invoice_date
        if invoice_data.due_date is not None:
            invoice.due_date = invoice_data.due_date
        if invoice_data.description is not None:
            invoice.description = invoice_data.description
        if invoice_data.amount is not None:
            invoice.amount = invoice_data.amount
        if invoice_data.notes is not None:
            invoice.notes = invoice_data.notes

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def get_invoice(db: Session, invoice_id: int) -> ARInvoice:
        """Get AR Invoice by ID"""
        invoice = db.query(ARInvoice).filter(ARInvoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice not found: {invoice_id}")
        return invoice

    @staticmethod
    def list_invoices(db: Session, member_id: int = None, status: str = None, month_year: str = None, skip: int = 0, limit: int = 50):
        """List AR Invoices with optional filters"""
        query = db.query(ARInvoice)

        if member_id:
            query = query.filter(ARInvoice.member_id == member_id)
        if status:
            query = query.filter(ARInvoice.status == status)
        if month_year:
            query = query.filter(ARInvoice.month_year == month_year)

        total = query.count()
        invoices = query.order_by(ARInvoice.created_at.desc()).offset(skip).limit(limit).all()

        return {'total': total, 'items': invoices}

    @staticmethod
    def issue_invoice(db: Session, invoice_id: int) -> ARInvoice:
        """Mark invoice as issued"""
        invoice = ARService.get_invoice(db, invoice_id)

        if invoice.status != ARInvoiceStatus.DRAFT:
            raise ValueError(f"Cannot issue invoice in {invoice.status} status")

        invoice.status = ARInvoiceStatus.ISSUED
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def record_receipt(db: Session, receipt_data: ARReceiptCreateRequest) -> ARReceipt:
        """Record payment receipt against invoice"""
        # Verify invoice exists
        invoice = ARService.get_invoice(db, receipt_data.invoice_id)

        if invoice.member_id != receipt_data.member_id:
            raise ValueError("Member ID does not match invoice")

        # Get month_year from payment_date
        month_year = receipt_data.payment_date.strftime('%Y%m')

        # Generate receipt number
        receipt_no, seq_no = ARService.generate_receipt_number(db, month_year)

        # Create receipt
        receipt = ARReceipt(
            receipt_no=receipt_no,
            month_year=month_year,
            seq_no=seq_no,
            member_id=receipt_data.member_id,
            invoice_id=receipt_data.invoice_id,
            amount_paid=receipt_data.amount_paid,
            payment_method=receipt_data.payment_method,
            payment_date=receipt_data.payment_date,
            reference_number=receipt_data.reference_number,
            notes=receipt_data.notes
        )

        # Update invoice status
        if receipt_data.amount_paid >= invoice.amount:
            invoice.status = ARInvoiceStatus.PAID
            invoice.payment_date = receipt_data.payment_date
        else:
            invoice.status = ARInvoiceStatus.PARTIAL

        db.add(receipt)
        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def get_member_ar_summary(db: Session, member_id: int) -> dict:
        """Get AR summary for a member"""
        # Get all non-paid invoices
        invoices = db.query(ARInvoice).filter(
            ARInvoice.member_id == member_id,
            ARInvoice.status.in_([ARInvoiceStatus.ISSUED, ARInvoiceStatus.PARTIAL, ARInvoiceStatus.OVERDUE])
        ).all()

        total_outstanding = sum(inv.amount for inv in invoices)

        # Calculate aging
        today = datetime.utcnow().date()
        age_0_30 = Decimal(0)
        age_30_60 = Decimal(0)
        age_60_90 = Decimal(0)
        age_90_plus = Decimal(0)

        for inv in invoices:
            days_overdue = (today - inv.due_date.date()).days if inv.due_date else 0
            if days_overdue <= 30:
                age_0_30 += inv.amount
            elif days_overdue <= 60:
                age_30_60 += inv.amount
            elif days_overdue <= 90:
                age_60_90 += inv.amount
            else:
                age_90_plus += inv.amount

        return {
            'member_id': member_id,
            'total_outstanding': total_outstanding,
            'age_0_30': age_0_30,
            'age_30_60': age_30_60,
            'age_60_90': age_60_90,
            'age_90_plus': age_90_plus,
            'invoice_count': len(invoices)
        }

    @staticmethod
    def get_aging_report(db: Session) -> dict:
        """Get aging report for all members"""
        today = datetime.utcnow().date()

        # Get all members with outstanding invoices
        members_with_debt = db.query(Member).filter(Member.outstanding_balance > 0).all()

        aging_items = []
        total_outstanding = Decimal(0)
        total_overdue = Decimal(0)
        age_0_30 = Decimal(0)
        age_30_60 = Decimal(0)
        age_60_90 = Decimal(0)
        age_90_plus = Decimal(0)

        for member in members_with_debt:
            # Get non-paid invoices
            invoices = db.query(ARInvoice).filter(
                ARInvoice.member_id == member.id,
                ARInvoice.status.in_([ARInvoiceStatus.ISSUED, ARInvoiceStatus.PARTIAL, ARInvoiceStatus.OVERDUE])
            ).all()

            if not invoices:
                continue

            member_outstanding = sum(inv.amount for inv in invoices)
            total_outstanding += member_outstanding

            # Calculate days overdue and bucket
            oldest_invoice = min(invoices, key=lambda x: x.due_date)
            days_overdue = (today - oldest_invoice.due_date.date()).days if oldest_invoice.due_date else 0

            if days_overdue > 0:
                total_overdue += member_outstanding

            # Determine age bucket
            if days_overdue <= 30:
                age_bucket = '0-30 วัน'
                age_0_30 += member_outstanding
            elif days_overdue <= 60:
                age_bucket = '30-60 วัน'
                age_30_60 += member_outstanding
            elif days_overdue <= 90:
                age_bucket = '60-90 วัน'
                age_60_90 += member_outstanding
            else:
                age_bucket = '90+ วัน'
                age_90_plus += member_outstanding

            aging_items.append(ARAging(
                member_id=member.id,
                member_name=member.name,
                house_no=member.house_no,
                outstanding_balance=member_outstanding,
                days_overdue=max(0, days_overdue),
                age_bucket=age_bucket
            ))

        return {
            'total_outstanding': total_outstanding,
            'total_overdue': total_overdue,
            'age_0_30': age_0_30,
            'age_30_60': age_30_60,
            'age_60_90': age_60_90,
            'age_90_plus': age_90_plus,
            'items': aging_items
        }
