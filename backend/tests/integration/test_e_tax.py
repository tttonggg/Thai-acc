import pytest
from decimal import Decimal


class TestETax:
    def test_generate_e_tax_xml(self, client, test_contact, auth_headers):
        # Create invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ e-Tax",
                        "quantity": 1,
                        "unit_price": "10000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        # Generate e-Tax XML
        response = client.post(f"/api/v1/invoices/{invoice_id}/e-tax/generate", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["e_tax_status"] == "generated"
        assert "xml_payload" in data
        assert len(data["xml_payload"]) > 0
        assert "<?xml" in data["xml_payload"]

    def test_cannot_generate_e_tax_for_nonexistent_invoice(self, client, auth_headers):
        response = client.post("/api/v1/invoices/00000000-0000-0000-0000-000000000000/e-tax/generate", headers=auth_headers)
        assert response.status_code == 404

    def test_submit_e_tax(self, client, test_contact, auth_headers):
        # Create invoice
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ e-Tax",
                        "quantity": 1,
                        "unit_price": "5000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        # Generate first
        client.post(f"/api/v1/invoices/{invoice_id}/e-tax/generate", headers=auth_headers)

        # Submit
        response = client.post(f"/api/v1/invoices/{invoice_id}/e-tax/submit", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["invoice_id"] == invoice_id
        assert data["e_tax_status"] in ["submitted", "failed"]
        assert "message" in data

    def test_cannot_submit_without_generating_first(self, client, test_contact, auth_headers):
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ",
                        "quantity": 1,
                        "unit_price": "1000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        response = client.post(f"/api/v1/invoices/{invoice_id}/e-tax/submit", headers=auth_headers)
        assert response.status_code == 400

    def test_download_e_tax_xml(self, client, test_contact, auth_headers):
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ",
                        "quantity": 1,
                        "unit_price": "1000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        # Generate first
        client.post(f"/api/v1/invoices/{invoice_id}/e-tax/generate", headers=auth_headers)

        # Download
        response = client.get(f"/api/v1/invoices/{invoice_id}/e-tax/xml", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/xml"
        assert "xml" in response.text.lower() or "<?xml" in response.text

    def test_cannot_download_without_generating(self, client, test_contact, auth_headers):
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ",
                        "quantity": 1,
                        "unit_price": "1000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        response = client.get(f"/api/v1/invoices/{invoice_id}/e-tax/xml", headers=auth_headers)
        assert response.status_code == 404

    def test_e_tax_history(self, client, test_contact, auth_headers):
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ",
                        "quantity": 1,
                        "unit_price": "1000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        # Generate and submit to create history
        client.post(f"/api/v1/invoices/{invoice_id}/e-tax/generate", headers=auth_headers)
        client.post(f"/api/v1/invoices/{invoice_id}/e-tax/submit", headers=auth_headers)

        response = client.get(f"/api/v1/invoices/{invoice_id}/e-tax/history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert "submission_type" in data[0]
        assert "status" in data[0]

    def test_invoice_e_tax_status_fields(self, client, test_contact, auth_headers):
        invoice_resp = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "items": [
                    {
                        "description": "สินค้าทดสอบ",
                        "quantity": 1,
                        "unit_price": "1000.00",
                        "discount_percent": "0",
                    }
                ],
            },
        )
        invoice_id = invoice_resp.json()["id"]

        # Before generate: pending
        response = client.get(f"/api/v1/invoices/{invoice_id}", headers=auth_headers)
        assert response.json()["e_tax_status"] == "pending"

        # After generate: generated
        client.post(f"/api/v1/invoices/{invoice_id}/e-tax/generate", headers=auth_headers)
        response = client.get(f"/api/v1/invoices/{invoice_id}", headers=auth_headers)
        assert response.json()["e_tax_status"] == "generated"
