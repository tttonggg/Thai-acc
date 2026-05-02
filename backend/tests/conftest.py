import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.core.database import Base, get_db
from src.main import app
from src.core.security import get_password_hash
from src.models.company import Company
from src.models.user import User
from src.models.contact import Contact
from src.models.product import Product
from src.models.project import Project
from src.models.gl import ChartOfAccount
from src.utils.seed_coa import seed_coa_for_company

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_company(db):
    """Create a test company with seeded COA."""
    company = Company(
        name="บริษัท ทดสอบ จำกัด",
        tax_id="1234567890123",
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    # Seed standard Chart of Accounts for test company
    seed_coa_for_company(db, str(company.id))
    return company


@pytest.fixture
def test_user(db, test_company):
    """Create a test user."""
    user = User(
        company_id=test_company.id,
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        first_name="ทดสอบ",
        last_name="ผู้ใช้",
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_contact(db, test_company):
    """Create a test contact (customer)."""
    contact = Contact(
        company_id=test_company.id,
        type="customer",
        name="ลูกค้า เอ",
        tax_id="9876543210987",
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@pytest.fixture
def test_product(db, test_company):
    """Create a test product."""
    product = Product(
        company_id=test_company.id,
        sku="SKU-001",
        name="สินค้าทดสอบ",
        unit_price=100.00,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def test_project(db, test_company, test_contact):
    """Create a test project."""
    project = Project(
        company_id=test_company.id,
        project_code="PRJ-001",
        name="โครงการทดสอบ",
        budget_amount=100000,
        contact_id=test_contact.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@pytest.fixture
def test_coa_account(db, test_company):
    """Get first COA account for the test company."""
    account = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == test_company.id,
    ).first()
    return account


@pytest.fixture
def test_cash_account(db, test_company):
    """Get cash asset COA account for the test company."""
    account = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == test_company.id,
        ChartOfAccount.code == "11000",
    ).first()
    return account


@pytest.fixture
def test_ar_account(db, test_company):
    """Get AR COA account for the test company."""
    account = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == test_company.id,
        ChartOfAccount.code == "11200",
    ).first()
    return account


@pytest.fixture
def client(db, test_user):
    """Create a test client with auth override."""
    from fastapi.testclient import TestClient
    
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Override auth dependency in all routers
    from src.core.security import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(test_user):
    """Generate auth headers for test user."""
    from src.core.security import create_access_token
    token = create_access_token({"sub": str(test_user.id), "company_id": str(test_user.company_id)})
    return {"Authorization": f"Bearer {token}"}
