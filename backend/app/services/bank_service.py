from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from decimal import Decimal
from app.models.bank import BankTransaction, BankStatementImport, BankTransactionType, BankTransactionStatus
from app.schemas.bank import BankReconcileRequest, BankImportRequest


class BankService:
    @staticmethod
    def import_transactions(db: Session, import_data: BankImportRequest, user_id: int) -> BankStatementImport:
        """Import bank statement transactions"""
        # Create import record
        statement_import = BankStatementImport(
            import_date=datetime.utcnow(),
            statement_period_start=import_data.statement_period_start,
            statement_period_end=import_data.statement_period_end,
            total_transactions=len(import_data.transactions),
            total_amount=sum(Decimal(str(t.get('amount', 0))) for t in import_data.transactions),
            import_notes=import_data.notes,
            imported_by=user_id
        )

        db.add(statement_import)
        db.flush()

        # Create transactions
        for txn_data in import_data.transactions:
            amount = Decimal(str(txn_data['amount']))
            txn_type = BankTransactionType.INCOME if amount > 0 else BankTransactionType.EXPENSE

            transaction = BankTransaction(
                transaction_date=datetime.fromisoformat(txn_data['date']) if isinstance(txn_data['date'], str) else txn_data['date'],
                description=txn_data['description'],
                amount=abs(amount),
                type=txn_type,
                status=BankTransactionStatus.PENDING,
                reference_number=txn_data.get('reference_number'),
                is_internal_transfer=txn_data.get('is_internal_transfer', False),
                notes=txn_data.get('notes')
            )
            db.add(transaction)

        db.commit()
        db.refresh(statement_import)
        return statement_import

    @staticmethod
    def list_transactions(db: Session, status: str = None, skip: int = 0, limit: int = 50):
        """List bank transactions with optional status filter"""
        query = db.query(BankTransaction)

        if status:
            query = query.filter(BankTransaction.status == status)

        total = query.count()
        transactions = query.order_by(BankTransaction.transaction_date.desc()).offset(skip).limit(limit).all()

        return {'total': total, 'items': transactions}

    @staticmethod
    def reconcile_transaction(db: Session, reconcile_data: BankReconcileRequest) -> BankTransaction:
        """Reconcile a transaction to a PV or AR receipt"""
        transaction = db.query(BankTransaction).filter(BankTransaction.id == reconcile_data.transaction_id).first()
        if not transaction:
            raise ValueError(f"Transaction not found: {reconcile_data.transaction_id}")

        transaction.status = BankTransactionStatus.RECONCILED
        transaction.matched_to = reconcile_data.matched_to
        transaction.pv_id = reconcile_data.pv_id
        transaction.ar_receipt_id = reconcile_data.ar_receipt_id

        db.commit()
        db.refresh(transaction)
        return transaction

    @staticmethod
    def get_reconciliation_summary(db: Session) -> dict:
        """Get reconciliation summary"""
        transactions = db.query(BankTransaction).all()

        total_income = sum(t.amount for t in transactions if t.type == BankTransactionType.INCOME)
        total_expense = sum(t.amount for t in transactions if t.type == BankTransactionType.EXPENSE)

        return {
            'total_transactions': len(transactions),
            'pending_count': len([t for t in transactions if t.status == BankTransactionStatus.PENDING]),
            'matched_count': len([t for t in transactions if t.status == BankTransactionStatus.MATCHED]),
            'reconciled_count': len([t for t in transactions if t.status == BankTransactionStatus.RECONCILED]),
            'unmatched_count': len([t for t in transactions if t.status == BankTransactionStatus.UNMATCHED]),
            'total_income': total_income,
            'total_expense': total_expense,
            'net_amount': total_income - total_expense
        }

    @staticmethod
    def get_cash_flow(db: Session) -> dict:
        """Get cash flow by month"""
        transactions = db.query(BankTransaction).all()

        # Group by month
        cash_flow = {}
        for txn in transactions:
            month_year = txn.transaction_date.strftime('%Y%m')
            if month_year not in cash_flow:
                cash_flow[month_year] = {
                    'income': Decimal(0),
                    'expense': Decimal(0)
                }

            if txn.type == BankTransactionType.INCOME:
                cash_flow[month_year]['income'] += txn.amount
            else:
                cash_flow[month_year]['expense'] += txn.amount

        # Sort by month
        items = []
        total_income = Decimal(0)
        total_expense = Decimal(0)

        for month_year in sorted(cash_flow.keys()):
            item = cash_flow[month_year]
            net = item['income'] - item['expense']
            items.append({
                'month_year': month_year,
                'income': item['income'],
                'expense': item['expense'],
                'net': net
            })
            total_income += item['income']
            total_expense += item['expense']

        return {
            'items': items,
            'total_income': total_income,
            'total_expense': total_expense,
            'net_total': total_income - total_expense
        }

    @staticmethod
    def get_transaction(db: Session, transaction_id: int) -> BankTransaction:
        """Get a specific transaction"""
        txn = db.query(BankTransaction).filter(BankTransaction.id == transaction_id).first()
        if not txn:
            raise ValueError(f"Transaction not found: {transaction_id}")
        return txn

    @staticmethod
    def mark_as_unmatched(db: Session, transaction_id: int) -> BankTransaction:
        """Mark transaction as unmatched"""
        transaction = BankService.get_transaction(db, transaction_id)

        transaction.status = BankTransactionStatus.UNMATCHED
        transaction.matched_to = None
        transaction.pv_id = None
        transaction.ar_receipt_id = None

        db.commit()
        db.refresh(transaction)
        return transaction
