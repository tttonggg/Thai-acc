import pytest
from decimal import Decimal


class TestVATPP30:
    def test_vat_pp30_basic(self, client, test_contact, auth_headers):
        # Create invoice with VAT
        client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {"description": "สินค้า", "quantity": "10", "unit_price": "100.00"}
                ],
            },
        )
        # Update status to sent
        inv_list = client.get("/api/v1/invoices", headers=auth_headers).json()
        inv_id = inv_list[0]["id"]
        client.put(f"/api/v1/invoices/{inv_id}/status", headers=auth_headers, json={"status": "sent"})

        # Create purchase invoice with VAT
        client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {"description": "สินค้า", "quantity": "5", "unit_price": "100.00"}
                ],
            },
        )
        # Update PI status to received
        pi_list = client.get("/api/v1/purchase-invoices", headers=auth_headers).json()
        pi_id = pi_list[0]["id"]
        client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "received"})

        # Query P.P.30 for May 2569 (Buddhist year)
        response = client.get("/api/v1/accounting/reports/vat-pp30?year=2569&month=5", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["year"] == 2569
        assert data["month"] == 5
        assert data["period_label"] == "พฤษภาคม 2569"

        # Output VAT: 10 * 100 = 1000 + 70 VAT
        assert Decimal(data["output_vat"]["taxable_sales_amount"]) == Decimal("1000.00")
        assert Decimal(data["output_vat"]["output_vat_amount"]) == Decimal("70.00")

        # Input VAT: 5 * 100 = 500 + 35 VAT
        assert Decimal(data["input_vat"]["taxable_purchases_amount"]) == Decimal("500.00")
        assert Decimal(data["input_vat"]["input_vat_amount"]) == Decimal("35.00")

        # Net: 70 - 35 = 35 payable
        assert Decimal(data["net_vat"]) == Decimal("35.00")
        assert Decimal(data["vat_payable"]) == Decimal("35.00")
        assert Decimal(data["vat_credit"]) == Decimal("0.00")

    def test_vat_pp30_excludes_draft_invoices(self, client, test_contact, auth_headers):
        # Create draft invoice (should not appear)
        client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {"description": "สินค้า", "quantity": "10", "unit_price": "100.00"}
                ],
            },
        )

        response = client.get("/api/v1/accounting/reports/vat-pp30?year=2569&month=5", headers=auth_headers)
        data = response.json()
        # Draft invoices excluded, so output VAT should be 0
        assert Decimal(data["output_vat"]["output_vat_amount"]) == Decimal("0")

    def test_vat_pp30_different_month(self, client, test_contact, auth_headers):
        # Create invoice in April
        client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-01",
                "due_date": "2026-05-01",
                "items": [
                    {"description": "สินค้า", "quantity": "10", "unit_price": "100.00"}
                ],
            },
        )
        inv_list = client.get("/api/v1/invoices", headers=auth_headers).json()
        inv_id = inv_list[0]["id"]
        client.put(f"/api/v1/invoices/{inv_id}/status", headers=auth_headers, json={"status": "sent"})

        # Query May — should not include April invoice
        response = client.get("/api/v1/accounting/reports/vat-pp30?year=2569&month=5", headers=auth_headers)
        data = response.json()
        assert Decimal(data["output_vat"]["output_vat_amount"]) == Decimal("0")

        # Query April — should include
        response = client.get("/api/v1/accounting/reports/vat-pp30?year=2569&month=4", headers=auth_headers)
        data = response.json()
        assert Decimal(data["output_vat"]["output_vat_amount"]) == Decimal("70.00")

    def test_vat_pp30_invalid_month(self, client, auth_headers):
        response = client.get("/api/v1/accounting/reports/vat-pp30?year=2569&month=13", headers=auth_headers)
        assert response.status_code == 400

    def test_vat_pp30_vat_credit(self, client, test_contact, auth_headers):
        # Create large purchase invoice (input > output)
        client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {"description": "สินค้า", "quantity": "100", "unit_price": "100.00"}
                ],
            },
        )
        pi_list = client.get("/api/v1/purchase-invoices", headers=auth_headers).json()
        pi_id = pi_list[0]["id"]
        client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "received"})

        # Small invoice
        client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {"description": "สินค้า", "quantity": "1", "unit_price": "100.00"}
                ],
            },
        )
        inv_list = client.get("/api/v1/invoices", headers=auth_headers).json()
        inv_id = inv_list[0]["id"]
        client.put(f"/api/v1/invoices/{inv_id}/status", headers=auth_headers, json={"status": "sent"})

        response = client.get("/api/v1/accounting/reports/vat-pp30?year=2569&month=5", headers=auth_headers)
        data = response.json()

        # Output: 7, Input: 700 -> Credit: 693
        assert Decimal(data["vat_payable"]) == Decimal("0")
        assert Decimal(data["vat_credit"]) == Decimal("693.00")
