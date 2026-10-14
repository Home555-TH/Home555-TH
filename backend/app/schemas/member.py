from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class MemberCreate(BaseModel):
    house_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    outstanding_balance: Optional[float] = None
    status: Optional[str] = None

class MemberResponse(BaseModel):
    id: int
    house_no: str
    name: str
    phone: Optional[str]
    email: Optional[str]
    outstanding_balance: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MemberListResponse(BaseModel):
    total: int
    items: list[MemberResponse]
    total_outstanding: float
