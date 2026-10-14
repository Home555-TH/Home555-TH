from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.utils.auth import require_accountant, get_current_user
from app.schemas.bank import (
    BankTransactionResponse, BankTransactionListResponse, BankReconcileRequest,
    BankImportRequest, BankReconciliationSummary, BankCashFlowResponse
)
from app.services.bank_service import BankService
from app.models.user import User

router = APIRouter(prefix='/api/v1/bank', tags=['Bank Transactions'])


@router.post('/import', dependencies=[Depends(require_accountant)])
def import_statement(
    import_data: BankImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import bank statement transactions"""
    try:
        statement_import = BankService.import_transactions(db, import_data, current_user.id)
        return {
            'import_id': statement_import.id,
            'transactions_imported': statement_import.total_transactions,
            'total_amount': statement_import.total_amount,
            'message': 'Bank statement imported successfully'
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/transactions', dependencies=[Depends(require_accountant)])
def list_transactions(
    status: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List bank transactions"""
    try:
        result = BankService.list_transactions(db, status=status, skip=skip, limit=limit)
        return {
            'total': result['total'],
            'items': [BankTransactionListResponse.model_validate(t) for t in result['items']],
            'skip': skip,
            'limit': limit
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/transactions/{transaction_id}', response_model=BankTransactionResponse, dependencies=[Depends(require_accountant)])
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get transaction details"""
    try:
        txn = BankService.get_transaction(db, transaction_id)
        return txn
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put('/reconcile/{transaction_id}', response_model=BankTransactionResponse, dependencies=[Depends(require_accountant)])
def reconcile_transaction(
    transaction_id: int,
    reconcile_data: BankReconcileRequest,
    db: Session = Depends(get_db)
):
    """Reconcile a transaction"""
    try:
        reconcile_data.transaction_id = transaction_id
        txn = BankService.reconcile_transaction(db, reconcile_data)
        return txn
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post('/transactions/{transaction_id}/unmatched', response_model=BankTransactionResponse, dependencies=[Depends(require_accountant)])
def mark_unmatched(transaction_id: int, db: Session = Depends(get_db)):
    """Mark transaction as unmatched"""
    try:
        txn = BankService.mark_as_unmatched(db, transaction_id)
        return txn
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/reconciliation', response_model=BankReconciliationSummary, dependencies=[Depends(require_accountant)])
def get_reconciliation_summary(db: Session = Depends(get_db)):
    """Get reconciliation summary"""
    try:
        summary = BankService.get_reconciliation_summary(db)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/cash-flow', response_model=BankCashFlowResponse, dependencies=[Depends(require_accountant)])
def get_cash_flow(db: Session = Depends(get_db)):
    """Get cash flow report by month"""
    try:
        cash_flow = BankService.get_cash_flow(db)
        return cash_flow
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
