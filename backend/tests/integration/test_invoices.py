import pytest
from decimal import Decimal


class TestInvoices:
    def test_create_invoice(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ",
                        "quantity": 10,
                        "unit_price": "100.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"].startswith("IV-2026-")
        assert Decimal(data["subtotal"]) == Decimal("1000.00")
        assert Decimal(data["vat_amount"]) == Decimal("70.00")
        assert Decimal(data["total_amount"]) == Decimal("1070.00")
        assert data["status"] == "draft"

    def test_create_invoice_from_quotation(self, client, test_contact, auth_headers):
        # First create a quotation
        quotation_resp = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        quotation_id = quotation_resp.json()["id"]
        
        # Accept the quotation
        client.put(f"/api/v1/quotations/{quotation_id}/status", headers=auth_headers, json={"status": "accepted"})
        
        # Create invoice from quotation
        response = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "quotation_id": quotation_id,
                "issue_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["quotation_id"] == quotation_id

    def test_invoice_status_transitions(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        invoice_id = create_resp.json()["id"]
        
        # draft -> sent
        response = client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        assert response.status_code == 200
        assert response.json()["status"] == "sent"
        
        # sent -> cancelled
        response = client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "cancelled"})
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

    def test_list_invoices_with_filters(self, client, test_contact, auth_headers):
        # Create invoices
        for status in ["draft", "sent"]:
            resp = client.post(
                "/api/v1/invoices",
                headers=auth_headers,
                json={
                    "contact_id": str(test_contact.id),
                    "issue_date": "2026-04-30",
                    "due_date": "2026-05-30",
                    "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
                },
            )
            inv_id = resp.json()["id"]
            if status == "sent":
                client.put(f"/api/v1/invoices/{inv_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Filter by status
        response = client.get("/api/v1/invoices?status=sent", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(inv["status"] == "sent" for inv in data)

    def test_invoice_calculations(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "vat_rate": 7,
                "discount_amount": 100,
                "items": [
                    {"description": "Item 1", "quantity": 10, "unit_price": "100.00", "discount_percent": "5"},
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        # Subtotal: 10 * 100 * 0.95 = 950
        assert Decimal(data["subtotal"]) == Decimal("950.00")
        # VAT: 950 * 0.07 = 66.50
        assert Decimal(data["vat_amount"]) == Decimal("66.50")
        # Total: 950 + 66.50 - 100 = 916.50
        assert Decimal(data["total_amount"]) == Decimal("916.50")

    def test_cannot_update_paid_invoice(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        invoice_id = create_resp.json()["id"]
        
        # Mark as paid
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "paid"})
        
        # Try to update
        response = client.put(
            f"/api/v1/invoices/{invoice_id}",
            headers=auth_headers,
            json={"notes": "Updated notes"},
        )
        assert response.status_code == 400
