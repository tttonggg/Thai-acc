import pytest
from decimal import Decimal


class TestPurchaseOrders:
    def test_create_purchase_order(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/purchase-orders",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "order_date": "2026-04-30",
                "expected_date": "2026-05-15",
                "items": [
                    {
                        "description": "วัสดุทดสอบ",
                        "quantity": 10,
                        "unit_price": "50.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["po_number"].startswith("PO-2026-")
        assert Decimal(data["subtotal"]) == Decimal("500.00")
        assert Decimal(data["vat_amount"]) == Decimal("35.00")
        assert Decimal(data["total_amount"]) == Decimal("535.00")
        assert data["status"] == "draft"

    def test_purchase_order_status_transitions(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/purchase-orders",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "order_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        po_id = create_resp.json()["id"]

        # draft -> sent
        response = client.put(f"/api/v1/purchase-orders/{po_id}/status", headers=auth_headers, json={"status": "sent"})
        assert response.status_code == 200
        assert response.json()["status"] == "sent"

        # sent -> confirmed
        response = client.put(f"/api/v1/purchase-orders/{po_id}/status", headers=auth_headers, json={"status": "confirmed"})
        assert response.status_code == 200
        assert response.json()["status"] == "confirmed"

    def test_convert_purchase_order_to_purchase_invoice(self, client, test_contact, auth_headers):
        # Create PO
        po_resp = client.post(
            "/api/v1/purchase-orders",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "order_date": "2026-04-30",
                "items": [{"description": "Test Item", "quantity": 5, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        po_id = po_resp.json()["id"]

        # Transition through required statuses: draft → sent → confirmed → received
        for status in ["sent", "confirmed", "received"]:
            resp = client.put(f"/api/v1/purchase-orders/{po_id}/status", headers=auth_headers, json={"status": status})
            assert resp.status_code == 200

        # Convert to purchase invoice
        response = client.post(f"/api/v1/purchase-orders/{po_id}/convert", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "billed"
        assert Decimal(data["total_amount"]) == Decimal("535.00")  # 500 + 35 VAT
        assert data["converted_to_purchase_invoice_id"] is not None

        # Verify purchase invoice was created
        pi_resp = client.get(f"/api/v1/purchase-invoices/{data['converted_to_purchase_invoice_id']}", headers=auth_headers)
        assert pi_resp.status_code == 200
        pi_data = pi_resp.json()
        assert pi_data["bill_number"].startswith("PI-2026-")
        assert pi_data["purchase_order_id"] == po_id

    def test_list_purchase_orders_with_filters(self, client, test_contact, auth_headers):
        for status in ["draft", "sent"]:
            resp = client.post(
                "/api/v1/purchase-orders",
                headers=auth_headers,
                json={
                    "contact_id": str(test_contact.id),
                    "order_date": "2026-04-30",
                    "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
                },
            )
            po_id = resp.json()["id"]
            if status == "sent":
                client.put(f"/api/v1/purchase-orders/{po_id}/status", headers=auth_headers, json={"status": "sent"})

        response = client.get("/api/v1/purchase-orders?status=sent", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(po["status"] == "sent" for po in data)

    def test_purchase_order_calculations(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/purchase-orders",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "order_date": "2026-04-30",
                "discount_amount": 50,
                "items": [
                    {"description": "Item 1", "quantity": 10, "unit_price": "100.00", "discount_percent": "10"},
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        # Subtotal: 10 * 100 * 0.9 = 900
        assert Decimal(data["subtotal"]) == Decimal("900.00")
        # VAT: 900 * 0.07 = 63
        assert Decimal(data["vat_amount"]) == Decimal("63.00")
        # Total: 900 + 63 - 50 = 913
        assert Decimal(data["total_amount"]) == Decimal("913.00")
