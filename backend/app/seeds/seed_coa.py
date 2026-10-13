from sqlalchemy.orm import Session
from app.models.accounting import ChartOfAccounts


DEFAULT_CHART_OF_ACCOUNTS = [
    # ASSETS (1xxx)
    ('1000', 'สินทรัพย์รวม', 'Asset', 'Current Assets', 'Asset account'),
    ('1100', 'เงินสดและเงินฝากธนาคาร', 'Asset', 'Current Assets', 'Cash and bank accounts'),
    ('1110', 'เงินสด', 'Asset', 'Current Assets', 'Cash on hand'),
    ('1120', 'เงินฝากธนาคาร', 'Asset', 'Current Assets', 'Bank account'),
    ('1200', 'ลูกหนี้', 'Asset', 'Current Assets', 'Accounts receivable'),
    ('1210', 'ลูกหนี้จากสมาชิก', 'Asset', 'Current Assets', 'Member receivables'),
    ('1220', 'ลูกหนี้อื่น', 'Asset', 'Current Assets', 'Other receivables'),
    ('1300', 'สินทรัพย์ถาวร', 'Asset', 'Fixed Assets', 'Fixed assets'),
    ('1310', 'อาคารและสิ่งปลูกสร้าง', 'Asset', 'Fixed Assets', 'Building and structures'),
    ('1320', 'เครื่องมือและอุปกรณ์', 'Asset', 'Fixed Assets', 'Equipment'),

    # LIABILITIES (2xxx)
    ('2000', 'หนี้สินรวม', 'Liability', 'Current Liabilities', 'Liability account'),
    ('2100', 'เจ้าหนี้', 'Liability', 'Current Liabilities', 'Accounts payable'),
    ('2110', 'เจ้าหนี้ค่าซ่อม', 'Liability', 'Current Liabilities', 'Maintenance payable'),
    ('2120', 'เจ้าหนี้อื่น', 'Liability', 'Current Liabilities', 'Other payable'),
    ('2200', 'หนี้สินระยะยาว', 'Liability', 'Long-term Liabilities', 'Long-term liabilities'),

    # EQUITY (3xxx)
    ('3000', 'ทุนสัญชาติ', 'Equity', 'Equity', 'Capital'),
    ('3100', 'ทุนอุดหนุน', 'Equity', 'Equity', 'Contributed capital'),
    ('3200', 'กำไรขาดทุนสะสม', 'Equity', 'Equity', 'Retained earnings'),

    # REVENUE (4xxx)
    ('4000', 'รายได้รวม', 'Revenue', 'Revenue', 'Revenue account'),
    ('4100', 'ค่าสมาชิก', 'Revenue', 'Revenue', 'Member fees'),
    ('4110', 'ค่าสมาชิกประจำปี', 'Revenue', 'Revenue', 'Annual membership fee'),
    ('4120', 'ค่าสมาชิกเข้าใหม่', 'Revenue', 'Revenue', 'New membership fee'),
    ('4200', 'ค่าสาธารณูปโภค', 'Revenue', 'Revenue', 'Utility charges'),
    ('4210', 'ค่าไฟฟ้า', 'Revenue', 'Revenue', 'Electricity'),
    ('4220', 'ค่าน้ำ', 'Revenue', 'Revenue', 'Water'),
    ('4300', 'รายได้อื่น', 'Revenue', 'Revenue', 'Other income'),

    # EXPENSES (5xxx-6xxx)
    ('5000', 'ค่าใช้จ่ายรวม', 'Expense', 'Operating Expense', 'Expense account'),
    ('5100', 'ค่าซ่อมแซม', 'Expense', 'Operating Expense', 'Repairs and maintenance'),
    ('5110', 'ค่าซ่อมอาคาร', 'Expense', 'Operating Expense', 'Building repairs'),
    ('5120', 'ค่าซ่อมอุปกรณ์', 'Expense', 'Operating Expense', 'Equipment repairs'),
    ('5200', 'ค่าไฟฟ้า', 'Expense', 'Operating Expense', 'Electricity expense'),
    ('5300', 'ค่าน้ำ', 'Expense', 'Operating Expense', 'Water expense'),
    ('5400', 'ค่าแรงงาน', 'Expense', 'Operating Expense', 'Labor expense'),
    ('5410', 'เงินเดือนเจ้าหน้าที่', 'Expense', 'Operating Expense', 'Staff salary'),
    ('5420', 'ค่าจ้างผู้รับเหมา', 'Expense', 'Operating Expense', 'Contractor fee'),
    ('5500', 'ค่าใช้สำนักงาน', 'Expense', 'Operating Expense', 'Administrative expense'),
    ('5510', 'ค่าเอกสาร', 'Expense', 'Operating Expense', 'Document cost'),
    ('5520', 'ค่าวัสดุสำนักงาน', 'Expense', 'Operating Expense', 'Office supplies'),
    ('5600', 'ค่าธรรมเนียมและภาษี', 'Expense', 'Operating Expense', 'Fees and taxes'),
    ('5700', 'ค่าใช้จ่ายอื่น', 'Expense', 'Operating Expense', 'Other expenses'),
]


def seed_chart_of_accounts(db: Session):
    """Seed default Chart of Accounts"""
    # Check if already seeded
    existing = db.query(ChartOfAccounts).first()
    if existing:
        print("Chart of Accounts already seeded. Skipping...")
        return

    for account_code, account_name, account_type, category, description in DEFAULT_CHART_OF_ACCOUNTS:
        coa = ChartOfAccounts(
            account_code=account_code,
            account_name=account_name,
            account_type=account_type,
            category=category,
            description=description,
            is_active=True
        )
        db.add(coa)

    db.commit()
    print(f"Seeded {len(DEFAULT_CHART_OF_ACCOUNTS)} Chart of Accounts")
