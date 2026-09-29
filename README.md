# 🏘️ Wilairat ERP - นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์

**ERP System for Housing Community Juristic Person Management**

## 📋 Project Overview

A comprehensive web application for managing a housing community (นิติบุคคล) with 233 member houses. The system handles financial records, member management, billing, utilities tracking, and reporting.

**Organization:** นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์
- **Address:** 369/664 หมู่ 1 ต.ดาสิทธิ์ อ.ปลวกแดง จ.ระยอง 21140
- **Tax ID:** 099-4-00275034-7
- **Members:** 233 houses

---

## 🎯 Key Features

### Phase 1 (Foundation) ✅ In Progress
- ✅ **Authentication** - JWT-based login with role-based access control
- ✅ **Members Management** - Manage 233 house owners, track outstanding balances
- ✅ **Settings** - Organization configuration, user management, backup

### Phase 2 (Accounting) 📅 Planned
- Payment Vouchers (AP) - Record and approve expense vouchers
- Accounts Receivable (AR) - Billing and debt tracking
- Bank Transactions - Record and reconcile bank statements
- Financial Reports - Summary, aging, audit logs

### Phase 3 (Operations) 📅 Planned
- Utility Readings - Track electricity and water meters
- Document Storage - Manage contracts and receipts
- Excel Import - Bulk data import from various sources

---

## 🏗️ Architecture

### Modular Design
Each feature is a standalone module that can be enabled/disabled independently:

```
Wilairat ERP
├── Core Infrastructure
│   ├── Authentication & JWT
│   ├── Database (PostgreSQL)
│   └── API Routing
│
├── Feature Modules
│   ├── Members (Manage 233 houses)
│   ├── AP (Payment Vouchers)
│   ├── AR (Receivables/Billing)
│   ├── Utilities (Meter readings)
│   ├── Bank (Bank transactions)
│   ├── Documents (File storage)
│   ├── Reports (Analytics)
│   ├── Import (Excel upload)
│   └── Settings (Configuration)
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | FastAPI (Python 3.11) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Database** | PostgreSQL 15 |
| **Authentication** | JWT (python-jose) |
| **Deployment** | Cloudflare Workers (Dev) |
| **Styling** | TailwindCSS |

---

## 📁 Project Structure

```
wilairat-erp/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Environment configuration
│   │   │   ├── database.py        # SQLAlchemy setup
│   │   │   └── security.py        # JWT & password hashing
│   │   ├── models/
│   │   │   ├── base.py            # Base model with timestamps
│   │   │   ├── user.py            # User model (roles: admin, ap_import, accountant)
│   │   │   └── member.py          # Member model (233 houses)
│   │   ├── schemas/
│   │   │   ├── auth.py            # Login, token, user schemas
│   │   │   └── member.py          # Member CRUD schemas
│   │   ├── routers/
│   │   │   ├── auth.py            # Authentication endpoints
│   │   │   └── members.py         # Member CRUD endpoints
│   │   ├── services/
│   │   │   ├── auth_service.py    # Authentication logic
│   │   │   └── member_service.py  # Member operations
│   │   ├── utils/
│   │   │   ├── auth.py            # JWT & role-based access control
│   │   │   └── thai_date.py       # Thai date formatting
│   │   └── main.py                # FastAPI application
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Container configuration
│   └── .env.example                # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts          # Axios HTTP client with JWT
│   │   ├── hooks/
│   │   │   └── useAuth.ts         # Authentication state management
│   │   ├── pages/
│   │   │   ├── Login.tsx          # Login page
│   │   │   ├── Members.tsx        # Member list & CRUD
│   │   │   └── Settings.tsx       # Organization settings
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Main layout with sidebar
│   │   │   ├── RequireAuth.tsx    # Protected routes
│   │   │   └── ModuleNav.tsx      # Module navigation
│   │   ├── utils/
│   │   │   ├── format.ts          # Thai date & currency formatting
│   │   │   └── http.ts            # HTTP error handling
│   │   ├── App.tsx                # Routes setup
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.ts             # Vite configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   └── tsconfig.json              # TypeScript config
│
├── docker-compose.yml             # PostgreSQL + containers
├── .env.example                   # Environment variables
├── wrangler.toml                  # Cloudflare Workers config
└── README.md                      # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Backend:** Python 3.11+, PostgreSQL 15
- **Frontend:** Node.js 18+, npm/yarn
- **Database:** PostgreSQL running on localhost:5432

### Backend Setup

```bash
# 1. Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment
cp ../.env.example ../.env
# Edit ../.env with your settings

# 4. Initialize database
python -m alembic upgrade head

# 5. Run development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`
**API Documentation:** `http://localhost:8000/docs`

### Frontend Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Run development server
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

---

## 🔐 Default Users

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| chucheepruangchai@gmail.com | (set on first run) | super_admin | Super Administrator |
| poonyanuch09@gmail.com | (create via Settings) | ap_import | AP Import Officer |
| vilairat.juristic@gmail.com | (create via Settings) | accountant | Accountant |

---

## 📚 API Endpoints (Phase 1)

### Authentication
```
POST   /api/auth/login          # Login with email/password
GET    /api/auth/me             # Get current user info
POST   /api/auth/logout         # Logout
```

### Members
```
GET    /api/members             # List all members (with search/filter)
GET    /api/members/summary     # Get summary statistics
GET    /api/members/{id}        # Get member details
POST   /api/members             # Create new member (admin only)
PUT    /api/members/{id}        # Update member (admin only)
DELETE /api/members/{id}        # Delete/deactivate member (admin only)
```

---

## 🔑 User Roles & Permissions

| Role | Auth | Members | Settings | AP | AR | Reports |
|------|------|---------|----------|----|----|---------|
| **super_admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ap_import** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **accountant** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## 📊 Database Schema (Phase 1)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,     -- super_admin, admin, ap_import, accountant
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Members Table
```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  house_no VARCHAR UNIQUE NOT NULL,  -- e.g., "369/001"
  name VARCHAR NOT NULL,
  phone VARCHAR,
  email VARCHAR,
  outstanding_balance FLOAT DEFAULT 0,
  status VARCHAR DEFAULT 'active',   -- active, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Settings Table
```sql
CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value TEXT,
  category VARCHAR,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🌐 Deployment to Cloudflare (Development)

### Option 1: Cloudflare Workers

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Deploy
wrangler deploy

# 4. Access at: https://wilairat-erp.your-account.workers.dev
```

### Option 2: Docker + Cloudflare Tunnel

```bash
# 1. Install Cloudflare Tunnel
# (See: https://developers.cloudflare.com/cloudflare-one/downloads/)

# 2. Create tunnel
cloudflared tunnel create wilairat-erp

# 3. Route traffic
cloudflared tunnel route dns wilairat-erp your-domain.com

# 4. Run tunnel
cloudflared tunnel run wilairat-erp

# 5. Start Docker
docker-compose up -d
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 📝 Environment Variables (.env)

```bash
# Organization
ORG_NAME=นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์
ORG_ADDRESS=369/664 หมู่ 1 ต.ดาสิทธิ์ อ.ปลวกแดง จ.ระยอง 21140
ORG_TAX_ID=099-4-00275034-7
PROMPTPAY_PHONE=0655755867

# Database
DATABASE_URL=postgresql://wilairat:password@localhost:5432/wilairat_erp

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=development
DEBUG=true
```

---

## 📞 Support & Issues

For issues or feature requests, please refer to the plan file:
- **Plan Location:** `/root/.claude/plans/abundant-dreaming-dusk.md`

---

## 📄 License

MIT License - Open source for community use

---

## 🙏 Acknowledgments

Built with ❤️ for นิติบุคคลหมู่บ้านจัดสรร บ้านวิไลรัตน์

**Version:** 1.0.0 (Phase 1: Auth + Members + Settings)  
**Last Updated:** 2024-09-29
