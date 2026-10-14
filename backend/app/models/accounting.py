from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import TimestampMixin, Base


class ChartOfAccounts(TimestampMixin, Base):
    __tablename__ = 'chart_of_accounts'

    id = Column(Integer, primary_key=True)
    account_code = Column(String(20), unique=True, nullable=False, index=True)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # Asset/Liability/Equity/Revenue/Expense
    category = Column(String(100), nullable=True)  # e.g., "Current Assets", "Fixed Assets"
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    parent_account_id = Column(Integer, ForeignKey('chart_of_accounts.id'), nullable=True)

    parent_account = relationship('ChartOfAccounts', remote_side=[id], backref='sub_accounts')
    journal_entries = relationship('JournalEntry', back_populates='debit_account', foreign_keys='JournalEntry.debit_account_id')
    journal_entries_credit = relationship('JournalEntry', back_populates='credit_account', foreign_keys='JournalEntry.credit_account_id')


class JournalEntryType(str, enum.Enum):
    PV = 'pv'
    AR = 'ar'
    BANK = 'bank'
    MANUAL = 'manual'


class JournalEntry(TimestampMixin, Base):
    __tablename__ = 'journal_entries'

    id = Column(Integer, primary_key=True)
    entry_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    description = Column(String(255), nullable=False)
    debit_account_id = Column(Integer, ForeignKey('chart_of_accounts.id'), nullable=False)
    credit_account_id = Column(Integer, ForeignKey('chart_of_accounts.id'), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    reference_type = Column(SQLEnum(JournalEntryType), nullable=False)
    reference_id = Column(Integer, nullable=True)  # PV ID, AR ID, Bank ID, etc.
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    notes = Column(Text, nullable=True)

    debit_account = relationship('ChartOfAccounts', back_populates='journal_entries', foreign_keys=[debit_account_id])
    credit_account = relationship('ChartOfAccounts', back_populates='journal_entries_credit', foreign_keys=[credit_account_id])
    creator = relationship('User', backref='journal_entries')
