from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from decimal import Decimal
from app.models.pv import PaymentVoucher, PVStatus
from app.schemas.pv import PVCreateRequest, PVUpdateRequest
from app.utils.thai_date import get_month_year_string


class PVService:
    @staticmethod
    def generate_pv_number(db: Session, month_year: str) -> str:
        """Generate next PV number for given month: PV-202501-0001"""
        # Get max seq_no for this month
        max_seq = db.query(func.max(PaymentVoucher.seq_no)).filter(
            PaymentVoucher.month_year == month_year
        ).scalar() or 0

        next_seq = max_seq + 1
        pv_no = f"PV-{month_year}-{next_seq:04d}"
        return pv_no, next_seq

    @staticmethod
    def calculate_amounts(amount: Decimal, vat_rate: Decimal, wht_rate: Decimal) -> dict:
        """Calculate VAT and WHT amounts"""
        vat_amount = amount * (vat_rate / 100)
        wht_amount = amount * (wht_rate / 100)
        net_amount = amount + vat_amount - wht_amount

        return {
            'vat_amount': vat_amount.quantize(Decimal('0.01')),
            'wht_amount': wht_amount.quantize(Decimal('0.01')),
            'net_amount': net_amount.quantize(Decimal('0.01'))
        }

    @staticmethod
    def create_pv(db: Session, pv_data: PVCreateRequest) -> PaymentVoucher:
        """Create new Payment Voucher in draft status"""
        # Get month_year from pv_date
        month_year = pv_data.pv_date.strftime('%Y%m')

        # Generate PV number
        pv_no, seq_no = PVService.generate_pv_number(db, month_year)

        # Calculate amounts
        amounts = PVService.calculate_amounts(pv_data.amount, pv_data.vat_rate, pv_data.wht_rate)

        # Create PV
        pv = PaymentVoucher(
            pv_no=pv_no,
            month_year=month_year,
            seq_no=seq_no,
            pv_date=pv_data.pv_date,
            vendor_name=pv_data.vendor_name,
            description=pv_data.description,
            amount=pv_data.amount,
            vat_rate=pv_data.vat_rate,
            wht_rate=pv_data.wht_rate,
            vat_amount=amounts['vat_amount'],
            wht_amount=amounts['wht_amount'],
            net_amount=amounts['net_amount'],
            account_id=pv_data.account_id,
            status=PVStatus.DRAFT
        )

        db.add(pv)
        db.commit()
        db.refresh(pv)
        return pv

    @staticmethod
    def update_pv(db: Session, pv_id: int, pv_data: PVUpdateRequest) -> PaymentVoucher:
        """Update PV (draft only)"""
        pv = db.query(PaymentVoucher).filter(PaymentVoucher.id == pv_id).first()
        if not pv:
            raise ValueError(f"PV not found: {pv_id}")

        if pv.status != PVStatus.DRAFT:
            raise ValueError(f"Cannot update PV in {pv.status} status")

        # Update fields if provided
        if pv_data.vendor_name is not None:
            pv.vendor_name = pv_data.vendor_name
        if pv_data.description is not None:
            pv.description = pv_data.description
        if pv_data.pv_date is not None:
            pv.pv_date = pv_data.pv_date
        if pv_data.account_id is not None:
            pv.account_id = pv_data.account_id

        # Recalculate if amount or rates changed
        if pv_data.amount is not None or pv_data.vat_rate is not None or pv_data.wht_rate is not None:
            amount = pv_data.amount or pv.amount
            vat_rate = pv_data.vat_rate or pv.vat_rate
            wht_rate = pv_data.wht_rate or pv.wht_rate

            amounts = PVService.calculate_amounts(amount, vat_rate, wht_rate)
            pv.amount = amount
            pv.vat_rate = vat_rate
            pv.wht_rate = wht_rate
            pv.vat_amount = amounts['vat_amount']
            pv.wht_amount = amounts['wht_amount']
            pv.net_amount = amounts['net_amount']

        db.commit()
        db.refresh(pv)
        return pv

    @staticmethod
    def get_pv(db: Session, pv_id: int) -> PaymentVoucher:
        """Get PV by ID"""
        pv = db.query(PaymentVoucher).filter(PaymentVoucher.id == pv_id).first()
        if not pv:
            raise ValueError(f"PV not found: {pv_id}")
        return pv

    @staticmethod
    def get_pv_by_number(db: Session, pv_no: str) -> PaymentVoucher:
        """Get PV by PV number"""
        pv = db.query(PaymentVoucher).filter(PaymentVoucher.pv_no == pv_no).first()
        if not pv:
            raise ValueError(f"PV not found: {pv_no}")
        return pv

    @staticmethod
    def list_pvs(db: Session, month_year: str = None, status: str = None, skip: int = 0, limit: int = 50):
        """List PVs with optional filters"""
        query = db.query(PaymentVoucher)

        if month_year:
            query = query.filter(PaymentVoucher.month_year == month_year)

        if status:
            query = query.filter(PaymentVoucher.status == status)

        total = query.count()
        pvs = query.order_by(PaymentVoucher.created_at.desc()).offset(skip).limit(limit).all()

        return {'total': total, 'items': pvs}

    @staticmethod
    def approve_pv(db: Session, pv_id: int, user_id: int) -> PaymentVoucher:
        """Approve PV"""
        pv = PVService.get_pv(db, pv_id)

        if pv.status != PVStatus.DRAFT:
            raise ValueError(f"Cannot approve PV in {pv.status} status")

        pv.status = PVStatus.APPROVED
        pv.approved_by = user_id
        pv.approved_date = datetime.utcnow()

        db.commit()
        db.refresh(pv)
        return pv

    @staticmethod
    def void_pv(db: Session, pv_id: int, void_reason: str) -> PaymentVoucher:
        """Void PV"""
        pv = PVService.get_pv(db, pv_id)

        if pv.status == PVStatus.VOID:
            raise ValueError("PV already voided")

        pv.status = PVStatus.VOID
        pv.void_reason = void_reason

        db.commit()
        db.refresh(pv)
        return pv

    @staticmethod
    def get_pv_summary(db: Session, month_year: str) -> dict:
        """Get summary of PVs for a month"""
        pvs = db.query(PaymentVoucher).filter(PaymentVoucher.month_year == month_year).all()

        total_amount = sum(pv.amount for pv in pvs)
        total_vat = sum(pv.vat_amount for pv in pvs)
        total_wht = sum(pv.wht_amount for pv in pvs)
        total_net = sum(pv.net_amount for pv in pvs)

        return {
            'total_pv': len(pvs),
            'total_amount': total_amount,
            'total_vat': total_vat,
            'total_wht': total_wht,
            'total_net': total_net,
            'draft_count': len([p for p in pvs if p.status == PVStatus.DRAFT]),
            'approved_count': len([p for p in pvs if p.status == PVStatus.APPROVED]),
            'void_count': len([p for p in pvs if p.status == PVStatus.VOID]),
            'month_year': month_year
        }
