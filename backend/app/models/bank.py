from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey, Enum as SQLEnum, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import TimestampMixin, Base


class BankTransactionType(str, enum.Enum):
    INCOME = 'income'
    EXPENSE = 'expense'


class BankTransactionStatus(str, enum.Enum):
    PENDING = 'pending'
    MATCHED = 'matched'
    RECONCILED = 'reconciled'
    UNMATCHED = 'unmatched'


class BankTransaction(TimestampMixin, Base):
    __tablename__ = 'bank_transactions'

    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    type = Column(SQLEnum(BankTransactionType), nullable=False)  # income/expense
    status = Column(SQLEnum(BankTransactionStatus), default=BankTransactionStatus.PENDING, index=True)

    # Matching fields
    matched_to = Column(String(50), nullable=True)  # 'PV', 'AR', 'Other'
    pv_id = Column(Integer, ForeignKey('payment_vouchers.id'), nullable=True)
    ar_receipt_id = Column(Integer, ForeignKey('ar_receipts.id'), nullable=True)

    # Bank transfer reference
    reference_number = Column(String(100), nullable=True)
    is_internal_transfer = Column(Boolean, default=False)  # Flag for internal moves
    notes = Column(Text, nullable=True)

    # Relationships
    pv = relationship('PaymentVoucher', backref='bank_transactions')
    ar_receipt = relationship('ARReceipt', backref='bank_transactions')


class BankStatementImport(TimestampMixin, Base):
    __tablename__ = 'bank_statement_imports'

    id = Column(Integer, primary_key=True, index=True)
    import_date = Column(DateTime, nullable=False)
    statement_period_start = Column(Date, nullable=False)
    statement_period_end = Column(Date, nullable=False)
    total_transactions = Column(Integer, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    import_notes = Column(Text, nullable=True)
    imported_by = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Relationships
    importer = relationship('User', backref='bank_imports')
