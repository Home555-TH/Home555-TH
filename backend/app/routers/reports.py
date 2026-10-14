from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from app.core.database import get_db
from app.utils.auth import require_accountant
from app.models.accounting import ChartOfAccounts
from app.models.pv import PaymentVoucher, PVStatus
from app.models.ar import ARInvoice, ARInvoiceStatus
from app.models.bank import BankTransaction, BankTransactionType

router = APIRouter(prefix='/api/v1/reports', tags=['Reports'])


def get_gl_entries(db: Session, account_id: int):
    """Get all GL entries for an account (from PV, AR, Bank)"""
    entries = []

    # Simplified: Show account balance based on transactions
    # In full implementation, would join journal_entries table

    account = db.query(ChartOfAccounts).filter(ChartOfAccounts.id == account_id).first()
    if not account:
        raise ValueError(f"Account not found: {account_id}")

    return {
        'account_code': account.account_code,
        'account_name': account.account_name,
        'account_type': account.account_type,
        'entries': []
    }


@router.get('/income-statement')
def get_income_statement(
    date_from: str = Query(''),
    date_to: str = Query(''),
    db: Session = Depends(get_db)
):
    """Generate Income Statement (งบกำไรขาดทุน) in Thai format"""
    try:
        # Get revenue (account type = Revenue)
        revenue_accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_type == 'Revenue',
            ChartOfAccounts.is_active == True
        ).all()

        # Get expense accounts
        expense_accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_type.in_(['Expense']),
            ChartOfAccounts.is_active == True
        ).all()

        # Calculate totals from AR invoices (revenue)
        ar_invoices = db.query(ARInvoice).filter(ARInvoice.status == ARInvoiceStatus.PAID).all()
        total_revenue = sum(inv.amount for inv in ar_invoices)

        # Calculate totals from PV (expenses)
        pv_invoices = db.query(PaymentVoucher).filter(PaymentVoucher.status == PVStatus.PAID).all()
        total_expense = sum(pv.net_amount for pv in pv_invoices)

        net_profit = total_revenue - total_expense

        return {
            'statement_date': datetime.utcnow().isoformat(),
            'revenue_accounts': [{'code': a.account_code, 'name': a.account_name} for a in revenue_accounts],
            'total_revenue': total_revenue,
            'expense_accounts': [{'code': a.account_code, 'name': a.account_name} for a in expense_accounts],
            'total_expense': total_expense,
            'net_profit': net_profit,
            'organization': 'นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์',
            'currency': 'THB'
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/balance-sheet')
def get_balance_sheet(db: Session = Depends(get_db)):
    """Generate Balance Sheet (งบดุล) in Thai format"""
    try:
        # Get account totals
        asset_accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_type == 'Asset',
            ChartOfAccounts.is_active == True
        ).all()

        liability_accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_type == 'Liability',
            ChartOfAccounts.is_active == True
        ).all()

        equity_accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_type == 'Equity',
            ChartOfAccounts.is_active == True
        ).all()

        # Simplified: Would calculate from actual transactions
        total_assets = Decimal(0)
        total_liabilities = Decimal(0)
        total_equity = Decimal(0)

        return {
            'statement_date': datetime.utcnow().isoformat(),
            'assets': {
                'accounts': [{'code': a.account_code, 'name': a.account_name} for a in asset_accounts],
                'total': total_assets
            },
            'liabilities': {
                'accounts': [{'code': a.account_code, 'name': a.account_name} for a in liability_accounts],
                'total': total_liabilities
            },
            'equity': {
                'accounts': [{'code': a.account_code, 'name': a.account_name} for a in equity_accounts],
                'total': total_equity
            },
            'total_liabilities_equity': total_liabilities + total_equity,
            'organization': 'นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์'
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/trial-balance')
def get_trial_balance(db: Session = Depends(get_db)):
    """Generate Trial Balance (งบทดลอง) in Thai format"""
    try:
        accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.is_active == True
        ).order_by(ChartOfAccounts.account_code).all()

        trial_balance = []
        total_debit = Decimal(0)
        total_credit = Decimal(0)

        for acc in accounts:
            # Simplified: Would calculate from journal_entries
            debit = Decimal(0)
            credit = Decimal(0)

            trial_balance.append({
                'account_code': acc.account_code,
                'account_name': acc.account_name,
                'debit': debit,
                'credit': credit
            })

            total_debit += debit
            total_credit += credit

        return {
            'statement_date': datetime.utcnow().isoformat(),
            'accounts': trial_balance,
            'total_debit': total_debit,
            'total_credit': total_credit,
            'is_balanced': total_debit == total_credit,
            'organization': 'นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์'
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/tax-summary')
def get_tax_summary(db: Session = Depends(get_db)):
    """Generate Tax Summary (สรุปภาษี) including VAT and WHT"""
    try:
        # Get all PVs for WHT and VAT calculation
        pvs = db.query(PaymentVoucher).filter(PaymentVoucher.status != PVStatus.VOID).all()

        total_pv_amount = sum(pv.amount for pv in pvs)
        total_vat = sum(pv.vat_amount for pv in pvs)
        total_wht = sum(pv.wht_amount for pv in pvs)

        # Get all AR invoices for revenue
        ar_invoices = db.query(ARInvoice).filter(ARInvoice.status == ARInvoiceStatus.PAID).all()
        total_revenue = sum(inv.amount for inv in ar_invoices)

        return {
            'statement_date': datetime.utcnow().isoformat(),
            'payment_vouchers': {
                'count': len(pvs),
                'total_amount': total_pv_amount,
                'vat_7_percent': total_vat,
                'withholding_tax_3_percent': total_wht
            },
            'revenue': {
                'count': len(ar_invoices),
                'total': total_revenue
            },
            'tax_summary': {
                'vat_payable': total_vat,
                'wht_deductible': total_wht,
                'net_tax': total_vat - total_wht
            },
            'organization': 'นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์',
            'currency': 'THB'
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/gl/{account_id}')
def get_general_ledger(
    account_id: int,
    date_from: str = Query(''),
    date_to: str = Query(''),
    db: Session = Depends(get_db)
):
    """Get General Ledger entries for a specific account"""
    try:
        gl = get_gl_entries(db, account_id)
        return gl
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
