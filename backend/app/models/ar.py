from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey, Enum as SQLEnum, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import TimestampMixin, Base


class ARInvoiceStatus(str, enum.Enum):
    DRAFT = 'draft'
    ISSUED = 'issued'
    PAID = 'paid'
    OVERDUE = 'overdue'
    PARTIAL = 'partial'


class ARReceiptPaymentMethod(str, enum.Enum):
    CASH = 'cash'
    TRANSFER = 'transfer'
    CHECK = 'check'
    PROMPTPAY = 'promptpay'


class ARInvoice(TimestampMixin, Base):
    __tablename__ = 'ar_invoices'

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, nullable=False, index=True)  # INV-202601-0001
    month_year = Column(String(6), nullable=False, index=True)  # 202601
    seq_no = Column(Integer, nullable=False)  # Running sequence per month
    member_id = Column(Integer, ForeignKey('members.id'), nullable=False, index=True)
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    description = Column(String(255), nullable=False)  # e.g., "ค่าสมาชิก มกราคม 2568"
    amount = Column(Numeric(15, 2), nullable=False)  # Total amount due
    status = Column(SQLEnum(ARInvoiceStatus), default=ARInvoiceStatus.DRAFT, index=True)
    payment_date = Column(DateTime, nullable=True)
    pdf_path = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    member = relationship('Member', backref='ar_invoices')
    receipts = relationship('ARReceipt', back_populates='invoice')


class ARReceipt(TimestampMixin, Base):
    __tablename__ = 'ar_receipts'

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), unique=True, nullable=False, index=True)  # REC-202601-0001
    month_year = Column(String(6), nullable=False, index=True)  # 202601
    seq_no = Column(Integer, nullable=False)  # Running sequence per month
    member_id = Column(Integer, ForeignKey('members.id'), nullable=False, index=True)
    invoice_id = Column(Integer, ForeignKey('ar_invoices.id'), nullable=False)
    amount_paid = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(SQLEnum(ARReceiptPaymentMethod), nullable=False)
    payment_date = Column(DateTime, nullable=False)
    reference_number = Column(String(100), nullable=True)  # Bank ref, check no, PromptPay txn
    pdf_path = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    member = relationship('Member', backref='ar_receipts')
    invoice = relationship('ARInvoice', back_populates='receipts')
