from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Organization
    ORG_NAME: str = "นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์"
    ORG_ADDRESS: str = "369/664 หมู่ 1 ต.ดาสิทธิ์ อ.ปลวกแดง จ.ระยอง 21140"
    ORG_TAX_ID: str = "099-4-00275034-7"
    ORG_PHONE: Optional[str] = None
    PROMPTPAY_PHONE: str = "0655755867"

    # Database
    DATABASE_URL: str = "postgresql://wilairat:password@localhost:5432/wilairat_erp"
    DATABASE_MASTER_URL: str = "postgresql://wilairat:password@localhost:5432/wilairat_master"

    # JWT
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "no-reply@wilairat.local"

    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: str = "wilairat-uploads"
    AWS_REGION: str = "ap-southeast-1"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Super Admin
    SUPER_ADMIN_EMAIL: str = "chucheepruangchai@gmail.com"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
