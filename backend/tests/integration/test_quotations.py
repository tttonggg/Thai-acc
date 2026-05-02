import pytest
from decimal import Decimal


class TestQuotations:
    def test_create_quotation(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
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
        assert data["quotation_number"].startswith("QT-2026-")
        assert Decimal(data["subtotal"]) == Decimal("1000.00")
        assert Decimal(data["vat_amount"]) == Decimal("70.00")
        assert Decimal(data["total_amount"]) == Decimal("1070.00")
        assert data["status"] == "draft"

    def test_create_quotation_with_project(self, client, test_contact, test_project, auth_headers):
        response = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "project_id": str(test_project.id),
                "items": [
                    {
                        "description": "บริการทดสอบ",
                        "quantity": 1,
                        "unit_price": "5000.00",
                        "discount_percent": "10",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["project_id"] == str(test_project.id)
        assert Decimal(data["subtotal"]) == Decimal("4500.00")  # 5000 * 0.9

    def test_list_quotations(self, client, test_contact, auth_headers):
        # Create two quotations
        for i in range(2):
            client.post(
                "/api/v1/quotations",
                headers=auth_headers,
                json={
                    "contact_id": str(test_contact.id),
                    "issue_date": "2026-04-30",
                    "items": [{"description": f"Item {i}", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
                },
            )
        
        response = client.get("/api/v1/quotations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_quotation_status_transition(self, client, test_contact, auth_headers):
        # Create quotation
        create_resp = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        quotation_id = create_resp.json()["id"]
        
        # draft -> sent
        response = client.put(
            f"/api/v1/quotations/{quotation_id}/status",
            headers=auth_headers,
            json={"status": "sent"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "sent"
        
        # sent -> accepted
        response = client.put(
            f"/api/v1/quotations/{quotation_id}/status",
            headers=auth_headers,
            json={"status": "accepted"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"
        
        # accepted -> converted
        response = client.put(
            f"/api/v1/quotations/{quotation_id}/status",
            headers=auth_headers,
            json={"status": "converted"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "converted"

    def test_invalid_status_transition(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        quotation_id = create_resp.json()["id"]
        
        # Cannot go from draft to accepted (must go through sent)
        response = client.put(
            f"/api/v1/quotations/{quotation_id}/status",
            headers=auth_headers,
            json={"status": "accepted"},
        )
        assert response.status_code == 400

    def test_delete_draft_quotation(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        quotation_id = create_resp.json()["id"]
        
        response = client.delete(f"/api/v1/quotations/{quotation_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_cannot_delete_sent_quotation(self, client, test_contact, auth_headers):
        create_resp = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "items": [{"description": "Test", "quantity": 1, "unit_price": "100", "discount_percent": "0"}],
            },
        )
        quotation_id = create_resp.json()["id"]
        
        # Send it
        client.put(f"/api/v1/quotations/{quotation_id}/status", headers=auth_headers, json={"status": "sent"})
        
        # Try to delete
        response = client.delete(f"/api/v1/quotations/{quotation_id}", headers=auth_headers)
        assert response.status_code == 400

    def test_vat_calculation(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "vat_rate": 7,
                "items": [
                    {"description": "Item 1", "quantity": 1, "unit_price": "1000.00", "discount_percent": "0"},
                    {"description": "Item 2", "quantity": 2, "unit_price": "500.00", "discount_percent": "10"},
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        # Subtotal: 1000 + (2 * 500 * 0.9) = 1000 + 900 = 1900
        assert Decimal(data["subtotal"]) == Decimal("1900.00")
        # VAT: 1900 * 0.07 = 133
        assert Decimal(data["vat_amount"]) == Decimal("133.00")
        # Total: 1900 + 133 = 2033
        assert Decimal(data["total_amount"]) == Decimal("2033.00")
