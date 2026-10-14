from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import declared_attr
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # super_admin, admin, ap_import, accountant
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
