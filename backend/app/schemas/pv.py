from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal
from app.models.pv import PVStatus


class PVCreateRequest(BaseModel):
    vendor_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    pv_date: datetime
    account_id: int
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    vat_rate: Decimal = Field(default=Decimal('7.00'), ge=0)
    wht_rate: Decimal = Field(default=Decimal('3.00'), ge=0)


class PVUpdateRequest(BaseModel):
    vendor_name: Optional[str] = None
    description: Optional[str] = None
    pv_date: Optional[datetime] = None
    account_id: Optional[int] = None
    amount: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None
    wht_rate: Optional[Decimal] = None


class PVApproveRequest(BaseModel):
    pass


class PVVoidRequest(BaseModel):
    void_reason: str = Field(..., min_length=1)


class PVResponse(BaseModel):
    id: int
    pv_no: str
    month_year: str
    seq_no: int
    pv_date: datetime
    vendor_name: str
    description: Optional[str]
    amount: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    wht_rate: Decimal
    wht_amount: Decimal
    net_amount: Decimal
    account_id: int
    status: PVStatus
    approved_by: Optional[int]
    approved_date: Optional[datetime]
    void_reason: Optional[str]
    pdf_path: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PVListResponse(BaseModel):
    id: int
    pv_no: str
    pv_date: datetime
    vendor_name: str
    net_amount: Decimal
    status: PVStatus
    approved_date: Optional[datetime]

    class Config:
        from_attributes = True


class PVSummaryResponse(BaseModel):
    total_pv: int
    total_amount: Decimal
    total_vat: Decimal
    total_wht: Decimal
    total_net: Decimal
    draft_count: int
    approved_count: int
    void_count: int
    month_year: str
