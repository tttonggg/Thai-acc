import pytest
from decimal import Decimal


class TestAccounting:
    # ============================================================
    # Chart of Accounts
    # ============================================================

    def test_list_coa(self, client, auth_headers):
        response = client.get("/api/v1/accounting/chart-of-accounts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # COA is auto-seeded on company creation (32 accounts)
        assert len(data) == 32
        # Check standard accounts exist
        codes = [a["code"] for a in data]
        assert "11000" in codes  # Cash
        assert "41000" in codes  # Sales Revenue
        assert "51000" in codes  # COGS

    def test_filter_coa_by_type(self, client, auth_headers):
        response = client.get("/api/v1/accounting/chart-of-accounts?account_type=asset", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(a["account_type"] == "asset" for a in data)
        assert len(data) >= 1  # Multiple asset accounts in standard COA

    def test_search_coa(self, client, auth_headers):
        response = client.get("/api/v1/accounting/chart-of-accounts?search=เงินสด", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(a["code"] == "11000" for a in data)

    def test_create_coa(self, client, auth_headers):
        response = client.post(
            "/api/v1/accounting/chart-of-accounts",
            headers=auth_headers,
            json={
                "code": "99999",
                "name": "บัญชีทดสอบ",
                "account_type": "expense",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "99999"
        assert data["name"] == "บัญชีทดสอบ"
        assert data["account_type"] == "expense"

    def test_cannot_create_duplicate_coa_code(self, client, auth_headers):
        # First create
        client.post(
            "/api/v1/accounting/chart-of-accounts",
            headers=auth_headers,
            json={
                "code": "88888",
                "name": "บัญชี A",
                "account_type": "expense",
            },
        )
        # Try duplicate
        response = client.post(
            "/api/v1/accounting/chart-of-accounts",
            headers=auth_headers,
            json={
                "code": "88888",
                "name": "บัญชี B",
                "account_type": "revenue",
            },
        )
        assert response.status_code == 400

    def test_get_coa(self, client, test_coa_account, auth_headers):
        response = client.get(f"/api/v1/accounting/chart-of-accounts/{test_coa_account.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_coa_account.id)

    def test_update_coa(self, client, test_coa_account, auth_headers):
        response = client.put(
            f"/api/v1/accounting/chart-of-accounts/{test_coa_account.id}",
            headers=auth_headers,
            json={"name": "ชื่อใหม่", "is_active": "N"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "ชื่อใหม่"
        assert data["is_active"] == "N"

    # ============================================================
    # Journal Entries
    # ============================================================

    def test_create_journal_entry(self, client, test_cash_account, test_ar_account, auth_headers):
        response = client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "reference": "ADJ-001",
                "description": "ปรับปรุงบัญชี",
                "lines": [
                    {
                        "account_id": str(test_ar_account.id),
                        "description": "เพิ่มลูกหนี้",
                        "debit_amount": "1000.00",
                        "credit_amount": "0",
                    },
                    {
                        "account_id": str(test_cash_account.id),
                        "description": "ลดเงินสด",
                        "debit_amount": "0",
                        "credit_amount": "1000.00",
                    },
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["entry_type"] == "adjustment"
        assert Decimal(data["total_debit"]) == Decimal("1000.00")
        assert Decimal(data["total_credit"]) == Decimal("1000.00")
        assert len(data["lines"]) == 2

    def test_journal_entry_must_balance(self, client, test_cash_account, test_ar_account, auth_headers):
        response = client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "lines": [
                    {
                        "account_id": str(test_ar_account.id),
                        "debit_amount": "1000.00",
                        "credit_amount": "0",
                    },
                    {
                        "account_id": str(test_cash_account.id),
                        "debit_amount": "0",
                        "credit_amount": "500.00",
                    },
                ],
            },
        )
        assert response.status_code == 400

    def test_journal_entry_must_be_nonzero(self, client, test_cash_account, test_ar_account, auth_headers):
        response = client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "lines": [
                    {
                        "account_id": str(test_ar_account.id),
                        "debit_amount": "0",
                        "credit_amount": "0",
                    },
                    {
                        "account_id": str(test_cash_account.id),
                        "debit_amount": "0",
                        "credit_amount": "0",
                    },
                ],
            },
        )
        assert response.status_code == 400

    def test_list_journal_entries(self, client, test_cash_account, test_ar_account, auth_headers):
        for i in range(3):
            client.post(
                "/api/v1/accounting/journal-entries",
                headers=auth_headers,
                json={
                    "entry_date": "2026-04-30",
                    "reference": f"ADJ-{i}",
                    "lines": [
                        {
                            "account_id": str(test_ar_account.id),
                            "debit_amount": "100.00",
                            "credit_amount": "0",
                        },
                        {
                            "account_id": str(test_cash_account.id),
                            "debit_amount": "0",
                            "credit_amount": "100.00",
                        },
                    ],
                },
            )

        response = client.get("/api/v1/accounting/journal-entries", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_journal_entry(self, client, test_cash_account, test_ar_account, auth_headers):
        resp = client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "reference": "ADJ-DETAIL",
                "description": "ทดสอบรายละเอียด",
                "lines": [
                    {
                        "account_id": str(test_ar_account.id),
                        "debit_amount": "500.00",
                        "credit_amount": "0",
                    },
                    {
                        "account_id": str(test_cash_account.id),
                        "debit_amount": "0",
                        "credit_amount": "500.00",
                    },
                ],
            },
        )
        entry_id = resp.json()["id"]

        response = client.get(f"/api/v1/accounting/journal-entries/{entry_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == entry_id
        assert data["reference"] == "ADJ-DETAIL"
        assert len(data["lines"]) == 2

    def test_filter_journal_entries_by_date(self, client, test_cash_account, test_ar_account, auth_headers):
        client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-01-15",
                "lines": [
                    {"account_id": str(test_ar_account.id), "debit_amount": "100.00", "credit_amount": "0"},
                    {"account_id": str(test_cash_account.id), "debit_amount": "0", "credit_amount": "100.00"},
                ],
            },
        )
        client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-03-20",
                "lines": [
                    {"account_id": str(test_ar_account.id), "debit_amount": "200.00", "credit_amount": "0"},
                    {"account_id": str(test_cash_account.id), "debit_amount": "0", "credit_amount": "200.00"},
                ],
            },
        )

        response = client.get("/api/v1/accounting/journal-entries?from_date=2026-02-01&to_date=2026-12-31", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["entry_date"] == "2026-03-20"

    # ============================================================
    # Reports
    # ============================================================

    def test_trial_balance(self, client, test_cash_account, test_ar_account, auth_headers):
        # Create a journal entry to generate some activity
        client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "lines": [
                    {"account_id": str(test_ar_account.id), "debit_amount": "1000.00", "credit_amount": "0"},
                    {"account_id": str(test_cash_account.id), "debit_amount": "0", "credit_amount": "1000.00"},
                ],
            },
        )

        response = client.get("/api/v1/accounting/reports/trial-balance", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "grand_total_debit" in data
        assert "grand_total_credit" in data
        assert Decimal(data["grand_total_debit"]) == Decimal(data["grand_total_credit"])
        # Grand totals should include our 1000 debit/credit
        assert Decimal(data["grand_total_debit"]) >= Decimal("1000.00")

    def test_income_statement(self, client, test_cash_account, auth_headers):
        response = client.get(
            "/api/v1/accounting/reports/income-statement?from_date=2026-01-01&to_date=2026-12-31",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "revenue_items" in data
        assert "expense_items" in data
        assert "total_revenue" in data
        assert "total_expenses" in data
        assert "net_income" in data
        assert Decimal(data["net_income"]) == Decimal(data["total_revenue"]) - Decimal(data["total_expenses"])

    def test_balance_sheet(self, client, auth_headers):
        response = client.get("/api/v1/accounting/reports/balance-sheet?as_of=2026-12-31", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "asset_items" in data
        assert "liability_items" in data
        assert "equity_items" in data
        assert "total_assets" in data
        assert "total_liabilities" in data
        assert "total_equity" in data
        assert Decimal(data["liabilities_plus_equity"]) == Decimal(data["total_liabilities"]) + Decimal(data["total_equity"])

    def test_ar_aging(self, client, test_contact, auth_headers):
        # Create an invoice that's overdue
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-01-01",
                "due_date": "2026-01-15",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "5000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})

        response = client.get("/api/v1/accounting/reports/ar-aging?as_of=2026-05-01", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "grand_total" in data
        # The invoice should show up in aging
        assert len(data["items"]) >= 1
        contact_names = [i["contact_name"] for i in data["items"]]
        assert test_contact.name in contact_names

    def test_ap_aging(self, client, test_contact, auth_headers):
        # Create a purchase invoice that's overdue
        pi_resp = client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-01-01",
                "due_date": "2026-01-15",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "3000", "discount_percent": "0"}],
            },
        )
        pi_id = pi_resp.json()["id"]
        client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "received"})
        client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "approved"})

        response = client.get("/api/v1/accounting/reports/ap-aging?as_of=2026-05-01", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "grand_total" in data
        assert len(data["items"]) >= 1
