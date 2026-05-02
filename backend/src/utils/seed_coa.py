"""Seed standard Thai Chart of Accounts (TFRS for NPAEs compatible).

Run with: python -m backend.src.utils.seed_coa
"""
from sqlalchemy.orm import Session
from ..core.database import SessionLocal, init_db
from ..models.gl import ChartOfAccount
from ..models.company import Company


# Standard Thai Chart of Accounts (simplified for SMEs)
# Based on Thai Revenue Department and TFRS for NPAEs standards
STANDARD_COA = [
    # Assets (1xxxx)
    {"code": "11000", "name": "เงินสด", "name_en": "Cash", "account_type": "asset", "account_sub_type": "current_asset"},
    {"code": "11100", "name": "เงินฝากธนาคาร", "name_en": "Bank Deposits", "account_type": "asset", "account_sub_type": "current_asset"},
    {"code": "11200", "name": "ลูกหนี้การค้า", "name_en": "Accounts Receivable", "account_type": "asset", "account_sub_type": "current_asset"},
    {"code": "11300", "name": "ลูกหนี้เงินสดนำส่ง", "name_en": "WHT Receivable", "account_type": "asset", "account_sub_type": "current_asset"},
    {"code": "11400", "name": "สินค้าคงเหลือ", "name_en": "Inventory", "account_type": "asset", "account_sub_type": "current_asset"},
    {"code": "11500", "name": "ค่าใช้จ่ายล่วงหน้า", "name_en": "Prepaid Expenses", "account_type": "asset", "account_sub_type": "current_asset"},
    {"code": "12000", "name": "ที่ดิน อาคาร และอุปกรณ์", "name_en": "Property, Plant & Equipment", "account_type": "asset", "account_sub_type": "fixed_asset"},
    {"code": "12100", "name": "ค่าเสื่อมราคาสะสม", "name_en": "Accumulated Depreciation", "account_type": "asset", "account_sub_type": "fixed_asset_contra"},
    {"code": "13000", "name": "สินทรัพย์ไม่มีตัวตน", "name_en": "Intangible Assets", "account_type": "asset", "account_sub_type": "intangible_asset"},
    
    # Liabilities (2xxxx)
    {"code": "21000", "name": "เจ้าหนี้การค้า", "name_en": "Accounts Payable", "account_type": "liability", "account_sub_type": "current_liability"},
    {"code": "21100", "name": "ภาษีมูลค่าเพิ่มขาย", "name_en": "VAT Output", "account_type": "liability", "account_sub_type": "current_liability"},
    {"code": "21200", "name": "ภาษีมูลค่าเพิ่มซื้อ", "name_en": "VAT Input", "account_type": "liability", "account_sub_type": "current_liability"},
    {"code": "21300", "name": "ภาษีเงินได้หัก ณ ที่จ่าย", "name_en": "WHT Payable", "account_type": "liability", "account_sub_type": "current_liability"},
    {"code": "21400", "name": "เงินกู้ระยะสั้น", "name_en": "Short-term Loans", "account_type": "liability", "account_sub_type": "current_liability"},
    {"code": "22000", "name": "เงินกู้ระยะยาว", "name_en": "Long-term Loans", "account_type": "liability", "account_sub_type": "long_term_liability"},
    
    # Equity (3xxxx)
    {"code": "31000", "name": "ทุนจดทะเบียน", "name_en": "Share Capital", "account_type": "equity", "account_sub_type": "equity"},
    {"code": "31100", "name": "กำไร (ขาดทุน) สะสม", "name_en": "Retained Earnings", "account_type": "equity", "account_sub_type": "equity"},
    {"code": "32000", "name": "รายได้สะสม", "name_en": "Income Summary", "account_type": "equity", "account_sub_type": "equity"},
    
    # Revenue (4xxxx)
    {"code": "41000", "name": "รายได้จากการขาย", "name_en": "Sales Revenue", "account_type": "revenue", "account_sub_type": "operating_revenue"},
    {"code": "41100", "name": "รายได้จากการให้บริการ", "name_en": "Service Revenue", "account_type": "revenue", "account_sub_type": "operating_revenue"},
    {"code": "42000", "name": "ส่วนลดจ่าย", "name_en": "Sales Discounts", "account_type": "revenue", "account_sub_type": "revenue_contra"},
    {"code": "43000", "name": "รายได้อื่น", "name_en": "Other Income", "account_type": "revenue", "account_sub_type": "other_income"},
    
    # Expenses (5xxxx)
    {"code": "51000", "name": "ต้นทุนขาย", "name_en": "Cost of Goods Sold", "account_type": "expense", "account_sub_type": "cost_of_sales"},
    {"code": "52000", "name": "ค่าใช้จ่ายในการขาย", "name_en": "Selling Expenses", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "52100", "name": "ค่าเช่าอาคาร", "name_en": "Rent Expense", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "52200", "name": "ค่าจ้างพนักงาน", "name_en": "Salaries & Wages", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "52300", "name": "ค่าสาธารณูปโภค", "name_en": "Utilities", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "52400", "name": "ค่าโฆษณา", "name_en": "Advertising", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "52500", "name": "ค่าใช้จ่ายในการบริหาร", "name_en": "Administrative Expenses", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "53000", "name": "ค่าเสื่อมราคา", "name_en": "Depreciation Expense", "account_type": "expense", "account_sub_type": "operating_expense"},
    {"code": "54000", "name": "ดอกเบี้ยจ่าย", "name_en": "Interest Expense", "account_type": "expense", "account_sub_type": "financial_expense"},
    {"code": "55000", "name": "ภาษีเงินได้", "name_en": "Income Tax", "account_type": "expense", "account_sub_type": "tax_expense"},
]


def seed_coa_for_company(db: Session, company_id: str) -> None:
    """Seed standard Chart of Accounts for a company."""
    existing = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == company_id
    ).first()
    
    if existing:
        print(f"COA already exists for company {company_id}, skipping...")
        return
    
    accounts = []
    for acc_data in STANDARD_COA:
        accounts.append(ChartOfAccount(
            company_id=company_id,
            code=acc_data["code"],
            name=acc_data["name"],
            name_en=acc_data["name_en"],
            account_type=acc_data["account_type"],
            account_sub_type=acc_data["account_sub_type"],
        ))
    
    db.add_all(accounts)
    db.commit()
    print(f"Seeded {len(accounts)} COA accounts for company {company_id}")


def seed_all_companies():
    """Seed COA for all existing companies."""
    init_db()
    db = SessionLocal()
    try:
        companies = db.query(Company).filter(Company.deleted_at.is_(None)).all()
        for company in companies:
            seed_coa_for_company(db, str(company.id))
        if not companies:
            print("No companies found. Create a company first.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all_companies()
