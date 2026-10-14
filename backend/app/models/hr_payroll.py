from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import Base


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    LEAVE = "leave"
    TERMINATED = "terminated"


class EmployeePosition(str, enum.Enum):
    DIRECTOR = "director"
    MANAGER = "manager"
    STAFF = "staff"
    SECURITY = "security"
    MAINTENANCE = "maintenance"
    DRIVER = "driver"
    HELPER = "helper"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EARLY_LEAVE = "early_leave"
    HALF_DAY = "half_day"
    SICK_LEAVE = "sick_leave"
    PERSONAL_LEAVE = "personal_leave"
    EMERGENCY_LEAVE = "emergency_leave"


class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    position = Column(Enum(EmployeePosition), nullable=False)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE, nullable=False)
    salary = Column(Numeric(12, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    id_card_number = Column(String(20))
    tax_id = Column(String(20))
    bank_account = Column(String(20))
    bank_name = Column(String(100))
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    attendances = relationship("Attendance", back_populates="employee")
    payrolls = relationship("Payroll", back_populates="employee")
    benefits = relationship("EmployeeBenefit", back_populates="employee")
    deductions = relationship("EmployeeDeduction", back_populates="employee")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    hours = Column(Numeric(5, 2))
    notes = Column(String(255))
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    employee = relationship("Employee", back_populates="attendances")


class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    payroll_date = Column(Date, nullable=False)
    month_year = Column(String(7), nullable=False)
    payroll_no = Column(String(50), unique=True, nullable=False)

    # Income
    base_salary = Column(Numeric(12, 2), nullable=False)
    overtime_pay = Column(Numeric(12, 2), default=0)
    bonus = Column(Numeric(12, 2), default=0)
    other_income = Column(Numeric(12, 2), default=0)
    gross_salary = Column(Numeric(12, 2), nullable=False)

    # Deductions
    social_security = Column(Numeric(12, 2), default=0)
    personal_income_tax = Column(Numeric(12, 2), default=0)
    other_deduction = Column(Numeric(12, 2), default=0)
    total_deduction = Column(Numeric(12, 2), nullable=False)

    # Net
    net_pay = Column(Numeric(12, 2), nullable=False)

    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT, nullable=False)
    paid_date = Column(DateTime)
    approved_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(String(255))
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    employee = relationship("Employee", back_populates="payrolls")
    approved_user = relationship("User", foreign_keys=[approved_by])


class EmployeeBenefit(Base):
    __tablename__ = "employee_benefits"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    benefit_type = Column(String(50), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    frequency = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    employee = relationship("Employee", back_populates="benefits")


class EmployeeDeduction(Base):
    __tablename__ = "employee_deductions"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    deduction_type = Column(String(50), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    frequency = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    reason = Column(String(255))
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    employee = relationship("Employee", back_populates="deductions")
