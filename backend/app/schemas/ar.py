from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal
from app.models.ar import ARInvoiceStatus, ARReceiptPaymentMethod


class ARInvoiceCreateRequest(BaseModel):
    member_id: int
    invoice_date: datetime
    due_date: datetime
    description: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    notes: Optional[str] = None


class ARInvoiceUpdateRequest(BaseModel):
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    notes: Optional[str] = None


class ARReceiptCreateRequest(BaseModel):
    member_id: int
    invoice_id: int
    amount_paid: Decimal = Field(..., gt=0, decimal_places=2)
    payment_method: ARReceiptPaymentMethod
    payment_date: datetime
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class ARInvoiceResponse(BaseModel):
    id: int
    invoice_no: str
    month_year: str
    seq_no: int
    member_id: int
    invoice_date: datetime
    due_date: datetime
    description: str
    amount: Decimal
    status: ARInvoiceStatus
    payment_date: Optional[datetime]
    pdf_path: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ARInvoiceListResponse(BaseModel):
    id: int
    invoice_no: str
    invoice_date: datetime
    member_id: int
    description: str
    amount: Decimal
    status: ARInvoiceStatus
    due_date: datetime

    class Config:
        from_attributes = True


class ARReceiptResponse(BaseModel):
    id: int
    receipt_no: str
    month_year: str
    seq_no: int
    member_id: int
    invoice_id: int
    amount_paid: Decimal
    payment_method: ARReceiptPaymentMethod
    payment_date: datetime
    reference_number: Optional[str]
    pdf_path: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ARAging(BaseModel):
    member_id: int
    member_name: str
    house_no: str
    outstanding_balance: Decimal
    days_overdue: int
    age_bucket: str  # '0-30', '30-60', '60-90', '90+'


class ARAgingReportResponse(BaseModel):
    total_outstanding: Decimal
    total_overdue: Decimal
    age_0_30: Decimal
    age_30_60: Decimal
    age_60_90: Decimal
    age_90_plus: Decimal
    items: list[ARAging]
