from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.services.hr_payroll_service import HRPayrollService
from app.schemas.hr_payroll import (
    EmployeeCreate, EmployeeResponse,
    AttendanceCreate, AttendanceResponse,
    PayrollCreate, PayrollResponse,
    EmployeeBenefitCreate, EmployeeBenefitResponse,
    EmployeeDeductionCreate, EmployeeDeductionResponse,
    PayrollSummaryResponse
)

router = APIRouter(prefix="/api/v1/hr", tags=["HR/Payroll"])


@router.post("/employee", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.create_employee(db, data)


@router.get("/employee", response_model=List[EmployeeResponse])
def get_employees(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return HRPayrollService.get_all_employees(db, limit)


@router.get("/employee/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    employee = HRPayrollService.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.post("/employee/{employee_id}/attendance", response_model=AttendanceResponse)
def record_attendance(
    employee_id: int,
    data: AttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.record_attendance(db, employee_id, data)


@router.get("/employee/{employee_id}/attendance")
def get_attendance(
    employee_id: int,
    month_year: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return HRPayrollService.get_employee_attendance(db, employee_id, month_year)


@router.post("/payroll", response_model=PayrollResponse)
def create_payroll(
    employee_id: int,
    data: PayrollCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "accountant", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.create_payroll(db, employee_id, data)


@router.get("/payroll/{payroll_id}", response_model=PayrollResponse)
def get_payroll(
    payroll_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payroll = HRPayrollService.get_payroll(db, payroll_id)
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return payroll


@router.get("/employee/{employee_id}/payroll")
def get_employee_payrolls(
    employee_id: int,
    month_year: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return HRPayrollService.get_employee_payrolls(db, employee_id, month_year)


@router.put("/payroll/{payroll_id}/approve")
def approve_payroll(
    payroll_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "accountant", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.approve_payroll(db, payroll_id, current_user.id)


@router.put("/payroll/{payroll_id}/mark-paid")
def mark_paid(
    payroll_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "accountant", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.mark_payroll_paid(db, payroll_id)


@router.post("/employee/{employee_id}/benefit", response_model=EmployeeBenefitResponse)
def add_benefit(
    employee_id: int,
    data: EmployeeBenefitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.add_employee_benefit(db, employee_id, data)


@router.post("/employee/{employee_id}/deduction", response_model=EmployeeDeductionResponse)
def add_deduction(
    employee_id: int,
    data: EmployeeDeductionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.add_employee_deduction(db, employee_id, data)


@router.get("/payroll-summary/{month_year}", response_model=dict)
def get_payroll_summary(
    month_year: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "accountant", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return HRPayrollService.get_payroll_summary(db, month_year)


@router.get("/employee/{employee_id}/payroll-calc/{month_year}")
def calculate_payroll(
    employee_id: int,
    month_year: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return HRPayrollService.calculate_monthly_payroll(db, employee_id, month_year)
