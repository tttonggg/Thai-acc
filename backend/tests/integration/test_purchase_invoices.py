import pytest
from decimal import Decimal


class TestPurchaseInvoices:
    def test_create_purchase_invoice(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-04-30",
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
        assert data["bill_number"].startswith("EX-2026-")
        assert Decimal(data["subtotal"]) == Decimal("1000.00")
        assert Decimal(data["vat_amount"]) == Decimal("70.00")
        assert Decimal(data["total_amount"]) == Decimal("1070.00")
        assert data["status"] == "draft"

    def test_purchase_invoice_status_transitions(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        pi_id = create_resp.json()["id"]

        # draft -> received
        response = client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "received"})
        assert response.status_code == 200
        assert response.json()["status"] == "received"

        # received -> approved
        response = client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "approved"})
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    def test_list_purchase_invoices_with_filters(self, client, test_contact, auth_headers):
        for status in ["draft", "received"]:
            resp = client.post(
                "/api/v1/purchase-invoices",
                headers=auth_headers,
                json={
                    "contact_id": str(test_contact.id),
                    "bill_date": "2026-04-30",
                    "due_date": "2026-05-30",
                    "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
                },
            )
            pi_id = resp.json()["id"]
            if status == "received":
                client.put(f"/api/v1/purchase-invoices/{pi_id}/status", headers=auth_headers, json={"status": "received"})

        response = client.get("/api/v1/purchase-invoices?status=received", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(pi["status"] == "received" for pi in data)

    def test_purchase_invoice_calculations(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-04-30",
                "due_date": "2026-05-30",
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
