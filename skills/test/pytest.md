# Skill: Pytest Testing

## Description
Write comprehensive pytest tests for FastAPI backends including unit tests, integration tests, and fixtures for Thai accounting scenarios.

## Trigger
Use when:
- New API endpoints are implemented
- Business logic needs validation
- Regression testing is needed
- Before code review submission

## Assigned Model
`opencode-go/deepseek-4-pro` (cheap batch processing for test generation)

## Detailed Instruction / SOP

### Step 1: Test Structure
```
backend/tests/
  conftest.py              # Shared fixtures
  unit/
    test_quotation_service.py
    test_vat_calculation.py
    test_fifo_costing.py
  integration/
    test_quotation_api.py
    test_invoice_workflow.py
  fixtures/
    companies.py
    contacts.py
    products.py
```

### Step 2: Fixtures
```python
# conftest.py
import pytest
from decimal import Decimal

@pytest.fixture
def test_company(db):
    company = Company(name="Test Co Ltd", tax_id="1234567890123")
    db.add(company)
    db.commit()
    return company

@pytest.fixture
def test_contact(db, test_company):
    contact = Contact(
        company_id=test_company.id,
        name="บริษัท ลูกค้า จำกัด",
        type="customer",
        tax_id="9876543210987"
    )
    db.add(contact)
    db.commit()
    return contact

@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}
```

### Step 3: Unit Test Pattern
```python
# test_quotation_service.py
class TestQuotationService:
    def test_create_quotation(self, db, test_company, test_contact):
        service = QuotationService(db, test_company.id)
        data = QuotationCreate(
            contact_id=str(test_contact.id),
            issue_date=date(2026, 4, 30),
            items=[
                QuotationItemCreate(
                    product_id=str(uuid4()),
                    quantity=Decimal("10"),
                    unit_price=Decimal("100.00")
                )
            ]
        )
        result = service.create(data)
        assert result.quotation_number.startswith("QT-2026-")
        assert result.subtotal == Decimal("1000.00")
        assert result.vat_amount == Decimal("70.00")
        assert result.total_amount == Decimal("1070.00")

    def test_invalid_status_transition(self, db, test_company):
        service = QuotationService(db, test_company.id)
        quotation = create_quotation(status="sent")
        with pytest.raises(InvalidStatusTransition):
            service.update_status(quotation.id, "draft")  # Can't go back
```

### Step 4: Integration Test Pattern
```python
# test_quotation_api.py
class TestQuotationAPI:
    def test_create_quotation_endpoint(self, client, auth_headers, test_contact):
        response = client.post(
            "/api/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "items": [
                    {
                        "product_id": str(uuid4()),
                        "quantity": 10,
                        "unit_price": "100.00"
                    }
                ]
            }
        )
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["quotation_number"].startswith("QT-")
        assert Decimal(data["total_amount"]) == Decimal("1070.00")

    def test_unauthorized_access(self, client):
        response = client.get("/api/quotations")
        assert response.status_code == 401
```

### Step 5: Edge Cases
- Empty items list
- Zero quantity
- Negative price
- Very large amounts
- Invalid tax ID format
- Date in future/past
- Unicode Thai characters

## Coverage Targets
- Unit tests: >= 80% coverage
- Integration tests: All API endpoints
- Business logic: 100% (tax, FIFO, GL posting)

## Output Format
Save to: `/backend/tests/...`
