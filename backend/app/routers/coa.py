from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.accounting import ChartOfAccounts
from pydantic import BaseModel

router = APIRouter(prefix='/api/v1/coa', tags=['Chart of Accounts'])


class COAResponse(BaseModel):
    id: int
    account_code: str
    account_name: str
    account_type: str
    category: str
    is_active: bool
    description: str

    class Config:
        from_attributes = True


@router.get('', response_model=list[COAResponse])
def list_coa(
    account_type: str = Query(None),
    is_active: bool = Query(True),
    db: Session = Depends(get_db)
):
    """List Chart of Accounts"""
    query = db.query(ChartOfAccounts).filter(ChartOfAccounts.is_active == is_active)

    if account_type:
        query = query.filter(ChartOfAccounts.account_type == account_type)

    accounts = query.order_by(ChartOfAccounts.account_code).all()
    return accounts


@router.get('/{account_id}', response_model=COAResponse)
def get_coa(account_id: int, db: Session = Depends(get_db)):
    """Get Chart of Account by ID"""
    account = db.query(ChartOfAccounts).filter(ChartOfAccounts.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account
