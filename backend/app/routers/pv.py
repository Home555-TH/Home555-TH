from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.utils.auth import require_admin, require_accountant
from app.schemas.pv import (
    PVCreateRequest, PVUpdateRequest, PVApproveRequest, PVVoidRequest,
    PVResponse, PVListResponse, PVSummaryResponse
)
from app.services.pv_service import PVService
from app.models.user import User

router = APIRouter(prefix='/api/v1/pv', tags=['Payment Vouchers'])


@router.post('', response_model=PVResponse, dependencies=[Depends(require_accountant)])
def create_pv(pv_data: PVCreateRequest, db: Session = Depends(get_db)):
    """Create new Payment Voucher (draft)"""
    try:
        pv = PVService.create_pv(db, pv_data)
        return pv
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('', response_model=dict, dependencies=[Depends(require_accountant)])
def list_pvs(
    month_year: str = Query(None),
    status: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List Payment Vouchers with optional filters"""
    try:
        result = PVService.list_pvs(db, month_year=month_year, status=status, skip=skip, limit=limit)
        return {
            'total': result['total'],
            'items': [PVListResponse.model_validate(pv) for pv in result['items']],
            'skip': skip,
            'limit': limit
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/{pv_id}', response_model=PVResponse, dependencies=[Depends(require_accountant)])
def get_pv(pv_id: int, db: Session = Depends(get_db)):
    """Get Payment Voucher details"""
    try:
        pv = PVService.get_pv(db, pv_id)
        return pv
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put('/{pv_id}', response_model=PVResponse, dependencies=[Depends(require_accountant)])
def update_pv(pv_id: int, pv_data: PVUpdateRequest, db: Session = Depends(get_db)):
    """Update Payment Voucher (draft only)"""
    try:
        pv = PVService.update_pv(db, pv_id, pv_data)
        return pv
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/{pv_id}/approve', response_model=PVResponse, dependencies=[Depends(require_admin)])
def approve_pv(pv_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Approve Payment Voucher"""
    try:
        pv = PVService.approve_pv(db, pv_id, current_user.id)
        return pv
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/{pv_id}/void', response_model=PVResponse, dependencies=[Depends(require_admin)])
def void_pv(pv_id: int, void_data: PVVoidRequest, db: Session = Depends(get_db)):
    """Void Payment Voucher"""
    try:
        pv = PVService.void_pv(db, pv_id, void_data.void_reason)
        return pv
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/summary/{month_year}', response_model=PVSummaryResponse)
def get_pv_summary(month_year: str, db: Session = Depends(get_db)):
    """Get PV summary for a month"""
    try:
        # Validate month_year format (YYYYMM)
        if len(month_year) != 6 or not month_year.isdigit():
            raise ValueError("Invalid month_year format. Use YYYYMM")

        summary = PVService.get_pv_summary(db, month_year)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
