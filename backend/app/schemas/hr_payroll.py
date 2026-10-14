from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from decimal import Decimal
from app.models.hr_payroll import EmployeeStatus, EmployeePosition, AttendanceStatus, PayrollStatus


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: EmployeePosition
    salary: Decimal
    start_date: date
    id_card_number: Optional[str] = None
    tax_id: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    position: EmployeePosition
    status: EmployeeStatus
    salary: Decimal
    start_date: date
    end_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    attendance_date: date
    status: AttendanceStatus
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    hours: Optional[Decimal] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    attendance_date: date
    status: AttendanceStatus
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    hours: Optional[Decimal]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollCreate(BaseModel):
    month_year: str
    payroll_date: date
    overtime_pay: Decimal = Decimal("0")
    bonus: Decimal = Decimal("0")
    other_income: Decimal = Decimal("0")
    social_security: Decimal = Decimal("0")
    personal_income_tax: Decimal = Decimal("0")
    other_deduction: Decimal = Decimal("0")
    notes: Optional[str] = None


class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    payroll_no: str
    month_year: str
    payroll_date: date
    base_salary: Decimal
    overtime_pay: Decimal
    bonus: Decimal
    other_income: Decimal
    gross_salary: Decimal
    social_security: Decimal
    personal_income_tax: Decimal
    other_deduction: Decimal
    total_deduction: Decimal
    net_pay: Decimal
    status: PayrollStatus
    paid_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class EmployeeBenefitCreate(BaseModel):
    benefit_type: str
    amount: Decimal
    frequency: str
    start_date: date
    end_date: Optional[date] = None


class EmployeeBenefitResponse(BaseModel):
    id: int
    employee_id: int
    benefit_type: str
    amount: Decimal
    frequency: str
    start_date: date
    end_date: Optional[date]

    class Config:
        from_attributes = True


class EmployeeDeductionCreate(BaseModel):
    deduction_type: str
    amount: Decimal
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    reason: Optional[str] = None


class EmployeeDeductionResponse(BaseModel):
    id: int
    employee_id: int
    deduction_type: str
    amount: Decimal
    frequency: str
    start_date: date
    end_date: Optional[date]
    reason: Optional[str]

    class Config:
        from_attributes = True


class PayrollSummaryResponse(BaseModel):
    month_year: str
    total_employees: int
    total_gross: float
    total_net: float
    total_tax: float
