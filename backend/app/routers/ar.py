from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.utils.auth import require_accountant
from app.schemas.ar import (
    ARInvoiceCreateRequest, ARInvoiceUpdateRequest, ARReceiptCreateRequest,
    ARInvoiceResponse, ARInvoiceListResponse, ARReceiptResponse, ARAgingReportResponse
)
from app.services.ar_service import ARService

router = APIRouter(prefix='/api/v1/ar', tags=['Accounts Receivable'])


@router.post('/invoice', response_model=ARInvoiceResponse, dependencies=[Depends(require_accountant)])
def create_invoice(invoice_data: ARInvoiceCreateRequest, db: Session = Depends(get_db)):
    """Create new AR Invoice (draft)"""
    try:
        invoice = ARService.create_invoice(db, invoice_data)
        return invoice
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/invoice', dependencies=[Depends(require_accountant)])
def list_invoices(
    member_id: int = Query(None),
    status: str = Query(None),
    month_year: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List AR Invoices with optional filters"""
    try:
        result = ARService.list_invoices(db, member_id=member_id, status=status, month_year=month_year, skip=skip, limit=limit)
        return {
            'total': result['total'],
            'items': [ARInvoiceListResponse.model_validate(inv) for inv in result['items']],
            'skip': skip,
            'limit': limit
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/invoice/{invoice_id}', response_model=ARInvoiceResponse, dependencies=[Depends(require_accountant)])
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get AR Invoice details"""
    try:
        invoice = ARService.get_invoice(db, invoice_id)
        return invoice
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put('/invoice/{invoice_id}', response_model=ARInvoiceResponse, dependencies=[Depends(require_accountant)])
def update_invoice(invoice_id: int, invoice_data: ARInvoiceUpdateRequest, db: Session = Depends(get_db)):
    """Update AR Invoice (draft only)"""
    try:
        invoice = ARService.update_invoice(db, invoice_id, invoice_data)
        return invoice
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/invoice/{invoice_id}/issue', response_model=ARInvoiceResponse, dependencies=[Depends(require_accountant)])
def issue_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Mark invoice as issued"""
    try:
        invoice = ARService.issue_invoice(db, invoice_id)
        return invoice
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/receipt', response_model=ARReceiptResponse, dependencies=[Depends(require_accountant)])
def record_receipt(receipt_data: ARReceiptCreateRequest, db: Session = Depends(get_db)):
    """Record payment receipt against invoice"""
    try:
        receipt = ARService.record_receipt(db, receipt_data)
        return receipt
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/aging', response_model=ARAgingReportResponse)
def get_aging_report(db: Session = Depends(get_db)):
    """Get AR aging report"""
    try:
        report = ARService.get_aging_report(db)
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/member/{member_id}')
def get_member_ar_summary(member_id: int, db: Session = Depends(get_db)):
    """Get AR summary for a member"""
    try:
        summary = ARService.get_member_ar_summary(db, member_id)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
