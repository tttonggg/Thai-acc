import pytest
from decimal import Decimal


class TestPaymentVouchers:
    def test_create_payment_voucher(self, client, test_contact, test_purchase_invoice, auth_headers):
        response = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "payment_method": "bank_transfer",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "1000.00",
                        "discount_taken": "0",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "draft"
        assert Decimal(data["total_amount"]) == Decimal("1000.00")
        assert data["voucher_number"].startswith("PV-")
        assert len(data["lines"]) == 1

    def test_list_payment_vouchers(self, client, test_contact, test_purchase_invoice, auth_headers):
        # Create first
        client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "1000.00",
                    }
                ],
            },
        )
        response = client.get("/api/v1/payment-vouchers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_post_payment_voucher(self, client, test_contact, test_purchase_invoice, auth_headers):
        # Create
        create_resp = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "500.00",
                    }
                ],
            },
        )
        voucher_id = create_resp.json()["id"]

        # Post
        response = client.post(f"/api/v1/payment-vouchers/{voucher_id}/post", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "posted"

        # Check PI status updated
        pi_resp = client.get(f"/api/v1/purchase-invoices/{test_purchase_invoice["id"]}", headers=auth_headers)
        pi_data = pi_resp.json()
        assert Decimal(pi_data["paid_amount"]) == Decimal("500.00")

    def test_cancel_payment_voucher(self, client, test_contact, test_purchase_invoice, auth_headers):
        # Create and post
        create_resp = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "500.00",
                    }
                ],
            },
        )
        voucher_id = create_resp.json()["id"]
        client.post(f"/api/v1/payment-vouchers/{voucher_id}/post", headers=auth_headers)

        # Cancel
        response = client.post(f"/api/v1/payment-vouchers/{voucher_id}/cancel", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"

        # Check PI paid_amount restored
        pi_resp = client.get(f"/api/v1/purchase-invoices/{test_purchase_invoice["id"]}", headers=auth_headers)
        pi_data = pi_resp.json()
        assert Decimal(pi_data["paid_amount"]) == Decimal("0")

    def test_cannot_post_twice(self, client, test_contact, test_purchase_invoice, auth_headers):
        create_resp = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "100.00",
                    }
                ],
            },
        )
        voucher_id = create_resp.json()["id"]
        client.post(f"/api/v1/payment-vouchers/{voucher_id}/post", headers=auth_headers)

        response = client.post(f"/api/v1/payment-vouchers/{voucher_id}/post", headers=auth_headers)
        assert response.status_code == 400

    def test_amount_exceeds_unpaid_balance(self, client, test_contact, test_purchase_invoice, auth_headers):
        response = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "999999.00",
                    }
                ],
            },
        )
        assert response.status_code == 400
        assert "exceeds" in response.json()["detail"].lower()

    def test_delete_draft_voucher(self, client, test_contact, test_purchase_invoice, auth_headers):
        create_resp = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "100.00",
                    }
                ],
            },
        )
        voucher_id = create_resp.json()["id"]

        response = client.delete(f"/api/v1/payment-vouchers/{voucher_id}", headers=auth_headers)
        assert response.status_code == 200

    def test_gl_posting_on_post(self, client, test_contact, test_purchase_invoice, auth_headers):
        create_resp = client.post(
            "/api/v1/payment-vouchers",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "payment_date": "2026-05-01",
                "wht_amount": "30.00",
                "lines": [
                    {
                        "purchase_invoice_id": str(test_purchase_invoice["id"]),
                        "amount": "1000.00",
                    }
                ],
            },
        )
        voucher_id = create_resp.json()["id"]

        # Post
        client.post(f"/api/v1/payment-vouchers/{voucher_id}/post", headers=auth_headers)

        # Check GL
        je_resp = client.get("/api/v1/accounting/journal-entries", headers=auth_headers)
        je_data = je_resp.json()
        pv_entries = [je for je in je_data if je["entry_type"] == "payment_voucher"]
        assert len(pv_entries) >= 1
        # Verify balanced: Dr AP = Cr Cash + Cr WHT
        entry = pv_entries[0]
        total_dr = sum(Decimal(line["debit_amount"]) for line in entry["lines"])
        total_cr = sum(Decimal(line["credit_amount"]) for line in entry["lines"])
        assert total_dr == total_cr
