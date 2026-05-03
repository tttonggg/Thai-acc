import pytest
from decimal import Decimal


class TestReceipts:
    def test_create_receipt(self, client, test_contact, auth_headers):
        # First create an invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        
        # Send the invoice
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Create receipt
        response = client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-01",
                "amount": 1000,
                "payment_method": "cash",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["receipt_number"].startswith("RE-2026-")
        assert Decimal(data["amount"]) == Decimal("1000")
        assert data["invoice_id"] == invoice_id

    def test_receipt_updates_invoice_status(self, client, test_contact, auth_headers):
        # Create invoice for 1000
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        total = Decimal(invoice_resp.json()["total_amount"])
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Pay partial amount
        client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-01",
                "amount": float(total / 2),
                "payment_method": "bank_transfer",
            },
        )
        
        # Check invoice is partially paid
        response = client.get(f"/api/v1/invoices/{invoice_id}", headers=auth_headers)
        assert response.json()["status"] == "partially_paid"
        
        # Pay remaining
        client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-02",
                "amount": float(total / 2),
                "payment_method": "cash",
            },
        )
        
        # Check invoice is fully paid
        response = client.get(f"/api/v1/invoices/{invoice_id}", headers=auth_headers)
        assert response.json()["status"] == "paid"

    def test_receipt_exceeds_remaining(self, client, test_contact, auth_headers):
        # Create invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Try to pay more than total
        response = client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-01",
                "amount": 9999,
                "payment_method": "cash",
            },
        )
        assert response.status_code == 400

    def test_receipt_with_wht(self, client, test_contact, auth_headers):
        # Create invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "บริการ", "quantity": 1, "unit_price": "10000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Create receipt with 3% WHT
        response = client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-01",
                "amount": 10000,
                "payment_method": "bank_transfer",
                "wht_amount": 300,
                "wht_rate": 3,
            },
        )
        assert response.status_code == 201
        data = response.json()
        # Total received = amount - wht = 10000 - 300 = 9700
        assert Decimal(data["total_amount"]) == Decimal("9700")

    def test_update_receipt(self, client, test_contact, auth_headers):
        # Create invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        total = Decimal(invoice_resp.json()["total_amount"])
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Create receipt
        receipt_resp = client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-01",
                "amount": float(total),
                "payment_method": "cash",
            },
        )
        receipt_id = receipt_resp.json()["id"]
        
        # Update receipt
        response = client.put(
            f"/api/v1/receipts/{receipt_id}",
            headers=auth_headers,
            json={
                "receipt_date": "2026-05-02",
                "payment_method": "bank_transfer",
                "payment_reference": "REF-12345",
                "notes": "Updated note",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["receipt_date"] == "2026-05-02"
        assert data["payment_method"] == "bank_transfer"
        assert data["payment_reference"] == "REF-12345"
        assert data["notes"] == "Updated note"

    def test_delete_receipt_reverses_invoice(self, client, test_contact, auth_headers):
        # Create invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        invoice_id = invoice_resp.json()["id"]
        total = Decimal(invoice_resp.json()["total_amount"])
        client.put(f"/api/v1/invoices/{invoice_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Create receipt
        receipt_resp = client.post(
            "/api/v1/receipts",
            headers=auth_headers,
            json={
                "invoice_id": invoice_id,
                "receipt_date": "2026-05-01",
                "amount": float(total),
                "payment_method": "cash",
            },
        )
        receipt_id = receipt_resp.json()["id"]
        
        # Delete receipt
        response = client.delete(f"/api/v1/receipts/{receipt_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Check invoice is back to sent
        invoice_resp = client.get(f"/api/v1/invoices/{invoice_id}", headers=auth_headers)
        assert invoice_resp.json()["status"] == "sent"
        assert Decimal(invoice_resp.json()["paid_amount"]) == Decimal("0")
