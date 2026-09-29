from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.models.user import User
from app.core.database import get_db

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

    user_id: int = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user

def require_role(*roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {current_user.role} is not authorized"
            )
        return current_user
    return role_checker

# Convenience functions
async def require_admin(user: User = Depends(require_role("admin", "super_admin"))) -> User:
    return user

async def require_super_admin(user: User = Depends(require_role("super_admin"))) -> User:
    return user

async def require_ap_import(user: User = Depends(require_role("ap_import", "admin", "super_admin"))) -> User:
    return user

async def require_accountant(user: User = Depends(require_role("accountant", "admin", "super_admin"))) -> User:
    return user
