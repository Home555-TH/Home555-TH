from sqlalchemy.orm import Session
from datetime import datetime, date
from decimal import Decimal
from app.models import (
    Employee, Attendance, Payroll, EmployeeBenefit, EmployeeDeduction,
    PayrollStatus, AttendanceStatus
)
from app.schemas.hr_payroll import (
    EmployeeCreate, AttendanceCreate, PayrollCreate, EmployeeBenefitCreate, EmployeeDeductionCreate
)


class HRPayrollService:
    @staticmethod
    def create_employee(db: Session, data: EmployeeCreate):
        employee_id = HRPayrollService.generate_employee_id(db)
        employee = Employee(
            employee_id=employee_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
            position=data.position,
            salary=data.salary,
            start_date=data.start_date,
            id_card_number=data.id_card_number,
            tax_id=data.tax_id,
            bank_account=data.bank_account,
            bank_name=data.bank_name
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    @staticmethod
    def generate_employee_id(db: Session) -> str:
        last_employee = db.query(Employee).order_by(Employee.id.desc()).first()
        seq = 1 if not last_employee else int(last_employee.employee_id.split("-")[-1]) + 1
        return f"EMP-{seq:05d}"

    @staticmethod
    def get_employee(db: Session, employee_id: int):
        return db.query(Employee).filter(Employee.id == employee_id).first()

    @staticmethod
    def get_all_employees(db: Session, limit: int = 100):
        return db.query(Employee).filter(
            Employee.status == "active"
        ).limit(limit).all()

    @staticmethod
    def record_attendance(db: Session, employee_id: int, data: AttendanceCreate):
        existing = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date == data.attendance_date
        ).first()

        if existing:
            existing.status = data.status
            existing.check_in = data.check_in
            existing.check_out = data.check_out
            existing.hours = data.hours
            existing.notes = data.notes
            db.commit()
            db.refresh(existing)
            return existing

        attendance = Attendance(
            employee_id=employee_id,
            attendance_date=data.attendance_date,
            status=data.status,
            check_in=data.check_in,
            check_out=data.check_out,
            hours=data.hours,
            notes=data.notes
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

    @staticmethod
    def get_employee_attendance(db: Session, employee_id: int, month_year: str):
        year, month = int(month_year[:4]), int(month_year[5:])
        records = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date.year == year,
            Attendance.attendance_date.month == month
        ).all()
        return records

    @staticmethod
    def create_payroll(db: Session, employee_id: int, data: PayrollCreate):
        payroll_no = HRPayrollService.generate_payroll_number(db)
        employee = HRPayrollService.get_employee(db, employee_id)

        gross = employee.salary + data.overtime_pay + data.bonus + data.other_income
        total_deduction = data.social_security + data.personal_income_tax + data.other_deduction
        net_pay = gross - total_deduction

        payroll = Payroll(
            employee_id=employee_id,
            payroll_no=payroll_no,
            month_year=data.month_year,
            payroll_date=data.payroll_date,
            base_salary=employee.salary,
            overtime_pay=data.overtime_pay,
            bonus=data.bonus,
            other_income=data.other_income,
            gross_salary=gross,
            social_security=data.social_security,
            personal_income_tax=data.personal_income_tax,
            other_deduction=data.other_deduction,
            total_deduction=total_deduction,
            net_pay=net_pay,
            notes=data.notes
        )
        db.add(payroll)
        db.commit()
        db.refresh(payroll)
        return payroll

    @staticmethod
    def generate_payroll_number(db: Session) -> str:
        today = datetime.now()
        month_year = today.strftime("%Y%m")
        last_payroll = db.query(Payroll).filter(
            Payroll.payroll_no.like(f"PAY-{month_year}-%")
        ).order_by(Payroll.payroll_no.desc()).first()

        seq_no = 1
        if last_payroll:
            last_seq = int(last_payroll.payroll_no.split("-")[-1])
            seq_no = last_seq + 1

        return f"PAY-{month_year}-{seq_no:04d}"

    @staticmethod
    def approve_payroll(db: Session, payroll_id: int, approved_by: int):
        payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if payroll:
            payroll.status = PayrollStatus.APPROVED
            payroll.approved_by = approved_by
            db.commit()
            db.refresh(payroll)
        return payroll

    @staticmethod
    def mark_payroll_paid(db: Session, payroll_id: int):
        payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
        if payroll:
            payroll.status = PayrollStatus.PAID
            payroll.paid_date = datetime.now()
            db.commit()
            db.refresh(payroll)
        return payroll

    @staticmethod
    def get_payroll(db: Session, payroll_id: int):
        return db.query(Payroll).filter(Payroll.id == payroll_id).first()

    @staticmethod
    def get_employee_payrolls(db: Session, employee_id: int, month_year: str = None):
        query = db.query(Payroll).filter(Payroll.employee_id == employee_id)
        if month_year:
            query = query.filter(Payroll.month_year == month_year)
        return query.order_by(Payroll.payroll_date.desc()).all()

    @staticmethod
    def add_employee_benefit(db: Session, employee_id: int, data: EmployeeBenefitCreate):
        benefit = EmployeeBenefit(
            employee_id=employee_id,
            benefit_type=data.benefit_type,
            amount=data.amount,
            frequency=data.frequency,
            start_date=data.start_date,
            end_date=data.end_date
        )
        db.add(benefit)
        db.commit()
        db.refresh(benefit)
        return benefit

    @staticmethod
    def add_employee_deduction(db: Session, employee_id: int, data: EmployeeDeductionCreate):
        deduction = EmployeeDeduction(
            employee_id=employee_id,
            deduction_type=data.deduction_type,
            amount=data.amount,
            frequency=data.frequency,
            start_date=data.start_date,
            end_date=data.end_date,
            reason=data.reason
        )
        db.add(deduction)
        db.commit()
        db.refresh(deduction)
        return deduction

    @staticmethod
    def get_payroll_summary(db: Session, month_year: str):
        payrolls = db.query(Payroll).filter(Payroll.month_year == month_year).all()

        total_gross = sum(Decimal(p.gross_salary) for p in payrolls)
        total_net = sum(Decimal(p.net_pay) for p in payrolls)
        total_tax = sum(Decimal(p.personal_income_tax) for p in payrolls)

        return {
            "month_year": month_year,
            "total_employees": len(payrolls),
            "total_gross": float(total_gross),
            "total_net": float(total_net),
            "total_tax": float(total_tax),
            "payrolls": payrolls
        }

    @staticmethod
    def calculate_monthly_payroll(db: Session, employee_id: int, month_year: str):
        employee = HRPayrollService.get_employee(db, employee_id)
        if not employee:
            return None

        year, month = int(month_year[:4]), int(month_year[5:])
        attendances = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.attendance_date.year == year,
            Attendance.attendance_date.month == month
        ).all()

        benefits = db.query(EmployeeBenefit).filter(
            EmployeeBenefit.employee_id == employee_id
        ).all()

        deductions = db.query(EmployeeDeduction).filter(
            EmployeeDeduction.employee_id == employee_id
        ).all()

        return {
            "employee_id": employee_id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "base_salary": float(employee.salary),
            "attendances": len(attendances),
            "benefits": [{"type": b.benefit_type, "amount": float(b.amount)} for b in benefits],
            "deductions": [{"type": d.deduction_type, "amount": float(d.amount)} for d in deductions]
        }
