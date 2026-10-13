from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import TimestampMixin, Base


class PVStatus(str, enum.Enum):
    DRAFT = 'draft'
    APPROVED = 'approved'
    VOID = 'void'
    PAID = 'paid'


class PaymentVoucher(TimestampMixin, Base):
    __tablename__ = 'payment_vouchers'

    id = Column(Integer, primary_key=True, index=True)
    pv_no = Column(String(50), unique=True, nullable=False, index=True)  # PV-202501-0001
    month_year = Column(String(6), nullable=False, index=True)  # 202501
    seq_no = Column(Integer, nullable=False)  # Running sequence per month
    pv_date = Column(DateTime, nullable=False)
    vendor_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Amount fields (all in Baht)
    amount = Column(Numeric(15, 2), nullable=False)  # Base amount (before VAT/WHT)
    vat_rate = Column(Numeric(5, 2), default=7.00)  # VAT rate (%)
    vat_amount = Column(Numeric(15, 2), default=0)  # VAT amount
    wht_rate = Column(Numeric(5, 2), default=3.00)  # Withholding Tax rate (%)
    wht_amount = Column(Numeric(15, 2), default=0)  # WHT amount
    net_amount = Column(Numeric(15, 2), nullable=False)  # amount + vat - wht

    # Account & Status
    account_id = Column(Integer, ForeignKey('chart_of_accounts.id'), nullable=False)
    status = Column(SQLEnum(PVStatus), default=PVStatus.DRAFT, index=True)

    # Approval workflow
    approved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    approved_date = Column(DateTime, nullable=True)
    void_reason = Column(Text, nullable=True)

    # PDF & documents
    pdf_path = Column(String(255), nullable=True)

    # Relationships
    account = relationship('ChartOfAccounts', backref='payment_vouchers')
    approver = relationship('User', backref='approved_payment_vouchers')
