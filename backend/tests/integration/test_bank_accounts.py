import pytest
from decimal import Decimal
from io import BytesIO


class TestBankAccounts:
    def test_create_bank_account(self, client, auth_headers):
        response = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={
                "name": "บัญชีกสิกรไทย",
                "account_number": "123-4-56789-0",
                "bank_name": "กสิกรไทย",
                "account_type": "bank",
                "opening_balance": "100000.00",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "บัญชีกสิกรไทย"
        assert data["account_number"] == "123-4-56789-0"
        assert data["bank_name"] == "กสิกรไทย"
        assert data["account_type"] == "bank"
        assert Decimal(data["opening_balance"]) == Decimal("100000.00")
        assert Decimal(data["current_balance"]) == Decimal("100000.00")
        assert data["is_active"] == "Y"

    def test_create_bank_account_with_gl_link(self, client, test_cash_account, auth_headers):
        response = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={
                "name": "เงินสดหน้าร้าน",
                "account_type": "cash",
                "opening_balance": "5000.00",
                "gl_account_id": str(test_cash_account.id),
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["gl_account_id"] == str(test_cash_account.id)
        assert data["gl_account_name"] == test_cash_account.name

    def test_list_bank_accounts(self, client, auth_headers):
        for i in range(3):
            client.post(
                "/api/v1/bank-accounts",
                headers=auth_headers,
                json={
                    "name": f"บัญชี {i}",
                    "account_type": "bank",
                    "opening_balance": "1000.00",
                },
            )

        response = client.get("/api/v1/bank-accounts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_filter_bank_accounts_by_type(self, client, auth_headers):
        client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "เงินสด", "account_type": "cash", "opening_balance": "1000.00"},
        )
        client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "ธนาคาร", "account_type": "bank", "opening_balance": "5000.00"},
        )

        response = client.get("/api/v1/bank-accounts?account_type=cash", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["account_type"] == "cash"

    def test_get_bank_account(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีทดสอบ", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        response = client.get(f"/api/v1/bank-accounts/{account_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == account_id
        assert data["name"] == "บัญชีทดสอบ"

    def test_update_bank_account(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "ชื่อเก่า", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        response = client.put(
            f"/api/v1/bank-accounts/{account_id}",
            headers=auth_headers,
            json={"name": "ชื่อใหม่", "current_balance": "2000.00"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "ชื่อใหม่"
        assert Decimal(data["current_balance"]) == Decimal("2000.00")

    def test_delete_bank_account(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีลบ", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        response = client.delete(f"/api/v1/bank-accounts/{account_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify it's marked inactive
        get_resp = client.get(f"/api/v1/bank-accounts/{account_id}", headers=auth_headers)
        assert get_resp.json()["is_active"] == "N"


class TestBankReconciliation:
    def test_list_transactions_no_gl_link(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีไม่มี GL", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        response = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data == []

    def test_list_transactions_with_gl_link(self, client, test_cash_account, test_ar_account, auth_headers):
        # Create bank account linked to cash GL account
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={
                "name": "เงินสด",
                "account_type": "cash",
                "opening_balance": "10000.00",
                "gl_account_id": str(test_cash_account.id),
            },
        )
        account_id = resp.json()["id"]

        # Create a journal entry that hits the cash account
        client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "lines": [
                    {"account_id": str(test_ar_account.id), "debit_amount": "5000.00", "credit_amount": "0"},
                    {"account_id": str(test_cash_account.id), "debit_amount": "0", "credit_amount": "5000.00"},
                ],
            },
        )

        response = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert Decimal(data[0]["credit_amount"]) == Decimal("5000.00")

    def test_reconcile_transaction(self, client, test_cash_account, test_ar_account, auth_headers):
        # Create bank account linked to cash GL
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={
                "name": "เงินสด",
                "account_type": "cash",
                "opening_balance": "10000.00",
                "gl_account_id": str(test_cash_account.id),
            },
        )
        account_id = resp.json()["id"]

        # Create JE
        je_resp = client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "lines": [
                    {"account_id": str(test_ar_account.id), "debit_amount": "3000.00", "credit_amount": "0"},
                    {"account_id": str(test_cash_account.id), "debit_amount": "0", "credit_amount": "3000.00"},
                ],
            },
        )

        # Get transaction lines
        tx_resp = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        line_id = tx_resp.json()[0]["id"]
        assert tx_resp.json()[0]["is_reconciled"] == "N"

        # Reconcile
        response = client.post(
            f"/api/v1/bank-accounts/{account_id}/reconcile",
            headers=auth_headers,
            json={"line_ids": [str(line_id)], "reconcile": True},
        )
        assert response.status_code == 200
        assert response.json()["reconciled"] == 1

        # Verify reconciled
        tx_resp = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        assert tx_resp.json()[0]["is_reconciled"] == "Y"

    def test_unreconcile_transaction(self, client, test_cash_account, test_ar_account, auth_headers):
        # Create bank account linked to cash GL
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={
                "name": "เงินสด",
                "account_type": "cash",
                "opening_balance": "10000.00",
                "gl_account_id": str(test_cash_account.id),
            },
        )
        account_id = resp.json()["id"]

        # Create JE
        client.post(
            "/api/v1/accounting/journal-entries",
            headers=auth_headers,
            json={
                "entry_date": "2026-04-30",
                "lines": [
                    {"account_id": str(test_ar_account.id), "debit_amount": "2000.00", "credit_amount": "0"},
                    {"account_id": str(test_cash_account.id), "debit_amount": "0", "credit_amount": "2000.00"},
                ],
            },
        )

        tx_resp = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        line_id = tx_resp.json()[0]["id"]

        # Reconcile then unreconcile
        client.post(
            f"/api/v1/bank-accounts/{account_id}/reconcile",
            headers=auth_headers,
            json={"line_ids": [str(line_id)], "reconcile": True},
        )
        response = client.post(
            f"/api/v1/bank-accounts/{account_id}/reconcile",
            headers=auth_headers,
            json={"line_ids": [str(line_id)], "reconcile": False},
        )
        assert response.status_code == 200
        assert response.json()["reconciled"] == 1

        tx_resp = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        assert tx_resp.json()[0]["is_reconciled"] == "N"

    def test_filter_reconciled_transactions(self, client, test_cash_account, test_ar_account, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={
                "name": "เงินสด",
                "account_type": "cash",
                "opening_balance": "10000.00",
                "gl_account_id": str(test_cash_account.id),
            },
        )
        account_id = resp.json()["id"]

        # Create 2 JEs
        for i in range(2):
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

        tx_resp = client.get(f"/api/v1/bank-accounts/{account_id}/transactions", headers=auth_headers)
        line_ids = [t["id"] for t in tx_resp.json()]

        # Reconcile only first
        client.post(
            f"/api/v1/bank-accounts/{account_id}/reconcile",
            headers=auth_headers,
            json={"line_ids": [line_ids[0]], "reconcile": True},
        )

        # Filter reconciled
        response = client.get(f"/api/v1/bank-accounts/{account_id}/transactions?is_reconciled=Y", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_reconciled"] == "Y"


class TestBankStatementImport:
    def test_import_statement(self, client, auth_headers):
        # Create bank account first
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีนำเข้า", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        # Create a simple CSV
        csv_content = b"Date,Description,Debit,Credit\n2026-04-01,Test deposit,0,5000\n2026-04-02,Test withdrawal,1000,0\n"

        response = client.post(
            f"/api/v1/bank-accounts/{account_id}/statements/import",
            headers=auth_headers,
            files={"file": ("statement.csv", BytesIO(csv_content), "text/csv")},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["file_name"] == "statement.csv"
        assert data["status"] == "completed"
        assert data["line_count"] == 2

    def test_list_statement_imports(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีนำเข้า", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        csv_content = b"Date,Description,Debit,Credit\n2026-04-01,Test,0,5000\n"
        client.post(
            f"/api/v1/bank-accounts/{account_id}/statements/import",
            headers=auth_headers,
            files={"file": ("statement.csv", BytesIO(csv_content), "text/csv")},
        )

        response = client.get(f"/api/v1/bank-accounts/{account_id}/statements", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["file_name"] == "statement.csv"

    def test_get_statement_lines(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีนำเข้า", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        csv_content = b"Date,Description,Debit,Credit\n2026-04-01,Deposit,0,5000\n2026-04-02,Withdrawal,1000,0\n"
        import_resp = client.post(
            f"/api/v1/bank-accounts/{account_id}/statements/import",
            headers=auth_headers,
            files={"file": ("statement.csv", BytesIO(csv_content), "text/csv")},
        )
        import_id = import_resp.json()["id"]

        response = client.get(f"/api/v1/bank-accounts/{account_id}/statements/{import_id}/lines", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Lines ordered by date desc
        credit_line = next((l for l in data if Decimal(l["credit_amount"]) > 0), None)
        debit_line = next((l for l in data if Decimal(l["debit_amount"]) > 0), None)
        assert credit_line is not None
        assert debit_line is not None
        assert Decimal(credit_line["credit_amount"]) == Decimal("5000")
        assert Decimal(debit_line["debit_amount"]) == Decimal("1000")

    def test_delete_statement_import(self, client, auth_headers):
        resp = client.post(
            "/api/v1/bank-accounts",
            headers=auth_headers,
            json={"name": "บัญชีนำเข้า", "account_type": "bank", "opening_balance": "1000.00"},
        )
        account_id = resp.json()["id"]

        csv_content = b"Date,Description,Debit,Credit\n2026-04-01,Test,0,5000\n"
        import_resp = client.post(
            f"/api/v1/bank-accounts/{account_id}/statements/import",
            headers=auth_headers,
            files={"file": ("statement.csv", BytesIO(csv_content), "text/csv")},
        )
        import_id = import_resp.json()["id"]

        response = client.delete(f"/api/v1/bank-accounts/{account_id}/statements/{import_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify deleted
        list_resp = client.get(f"/api/v1/bank-accounts/{account_id}/statements", headers=auth_headers)
        assert len(list_resp.json()) == 0
