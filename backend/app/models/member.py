from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin

class Member(Base, TimestampMixin):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    house_no = Column(String, unique=True, nullable=False, index=True)  # e.g., "369/001"
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    outstanding_balance = Column(Float, default=0.0, nullable=False)  # ยอดค้างชำระ
    status = Column(String, default="active", nullable=False)  # active, inactive

    def __repr__(self):
        return f"<Member {self.house_no} - {self.name} (Balance: {self.outstanding_balance})>"
