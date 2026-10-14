from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from app.models.bank import BankTransactionType, BankTransactionStatus


class BankTransactionResponse(BaseModel):
    id: int
    transaction_date: datetime
    description: str
    amount: Decimal
    type: BankTransactionType
    status: BankTransactionStatus
    matched_to: Optional[str]
    pv_id: Optional[int]
    ar_receipt_id: Optional[int]
    reference_number: Optional[str]
    is_internal_transfer: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BankTransactionListResponse(BaseModel):
    id: int
    transaction_date: datetime
    description: str
    amount: Decimal
    type: BankTransactionType
    status: BankTransactionStatus
    is_internal_transfer: bool

    class Config:
        from_attributes = True


class BankReconcileRequest(BaseModel):
    transaction_id: int
    matched_to: str = Field(..., regex='^(PV|AR|Other)$')
    pv_id: Optional[int] = None
    ar_receipt_id: Optional[int] = None


class BankImportRequest(BaseModel):
    statement_period_start: date
    statement_period_end: date
    transactions: list[dict]  # [{date, description, amount, type, reference?}]
    notes: Optional[str] = None


class BankReconciliationSummary(BaseModel):
    total_transactions: int
    pending_count: int
    matched_count: int
    reconciled_count: int
    unmatched_count: int
    total_income: Decimal
    total_expense: Decimal
    net_amount: Decimal


class BankCashFlowItem(BaseModel):
    month_year: str
    income: Decimal
    expense: Decimal
    net: Decimal


class BankCashFlowResponse(BaseModel):
    items: list[BankCashFlowItem]
    total_income: Decimal
    total_expense: Decimal
    net_total: Decimal
