import pytest
from decimal import Decimal


class TestExpenseClaims:
    def test_create_expense_claim(self, client, auth_headers):
        response = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "สมชาย ใจดี",
                "expense_date": "2026-04-30",
                "category": "travel",
                "description": "ค่าเดินทางไปประชุม",
                "amount": "5000.00",
                "vat_amount": "350.00",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["claim_number"].startswith("EX-2026-")
        assert Decimal(data["amount"]) == Decimal("5000.00")
        assert Decimal(data["vat_amount"]) == Decimal("350.00")
        assert Decimal(data["total_amount"]) == Decimal("5350.00")
        assert data["status"] == "draft"
        assert data["employee_name"] == "สมชาย ใจดี"
        assert data["category"] == "travel"

    def test_create_expense_claim_with_contact_and_project(self, client, test_contact, test_project, auth_headers):
        response = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "project_id": str(test_project.id),
                "employee_name": "สมหญิง รักงาน",
                "expense_date": "2026-04-30",
                "category": "office",
                "description": "ค่าอุปกรณ์สำนักงาน",
                "amount": "2000.00",
                "vat_amount": "140.00",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["contact_id"] == str(test_contact.id)
        assert data["project_id"] == str(test_project.id)
        assert data["contact_name"] == test_contact.name
        assert data["project_name"] == test_project.name

    def test_list_expense_claims(self, client, auth_headers):
        for i in range(3):
            client.post(
                "/api/v1/expense-claims",
                headers=auth_headers,
                json={
                    "employee_name": f"พนักงาน {i}",
                    "expense_date": "2026-04-30",
                    "category": "meal" if i == 0 else "travel",
                    "description": f"รายการ {i}",
                    "amount": "1000.00",
                    "vat_amount": "70.00",
                },
            )

        response = client.get("/api/v1/expense-claims", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_filter_expense_claims_by_category(self, client, auth_headers):
        client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "อาหารกลางวัน",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "B",
                "expense_date": "2026-04-30",
                "category": "travel",
                "description": "ค่าแท็กซี่",
                "amount": "300.00",
                "vat_amount": "21.00",
            },
        )

        response = client.get("/api/v1/expense-claims?category=meal", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"] == "meal"

    def test_filter_expense_claims_by_status(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]

        # Submit it
        client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "submitted"})

        response = client.get("/api/v1/expense-claims?status=submitted", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "submitted"

    def test_expense_claim_status_transitions(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]

        # draft -> submitted
        response = client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "submitted"})
        assert response.status_code == 200
        assert response.json()["status"] == "submitted"

        # submitted -> approved
        response = client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "approved"})
        assert response.status_code == 200
        assert response.json()["status"] == "approved"
        assert response.json()["approved_by"] is not None

    def test_invalid_status_transition(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]

        # Cannot go from draft to approved (must go through submitted)
        response = client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "approved"})
        assert response.status_code == 400

    def test_update_draft_expense_claim(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]

        response = client.put(
            f"/api/v1/expense-claims/{claim_id}",
            headers=auth_headers,
            json={"amount": "1000.00", "vat_amount": "70.00"},
        )
        assert response.status_code == 200
        data = response.json()
        assert Decimal(data["amount"]) == Decimal("1000.00")
        assert Decimal(data["vat_amount"]) == Decimal("70.00")
        assert Decimal(data["total_amount"]) == Decimal("1070.00")

    def test_cannot_update_approved_claim(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]
        client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "submitted"})
        client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "approved"})

        response = client.put(
            f"/api/v1/expense-claims/{claim_id}",
            headers=auth_headers,
            json={"amount": "1000.00"},
        )
        assert response.status_code == 400

    def test_delete_draft_expense_claim(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]

        response = client.delete(f"/api/v1/expense-claims/{claim_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_cannot_delete_approved_claim(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]
        client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "submitted"})
        client.put(f"/api/v1/expense-claims/{claim_id}/status", headers=auth_headers, json={"status": "approved"})

        response = client.delete(f"/api/v1/expense-claims/{claim_id}", headers=auth_headers)
        assert response.status_code == 400

    def test_search_expense_claims(self, client, auth_headers):
        client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "สมชาย ใจดี",
                "expense_date": "2026-04-30",
                "category": "travel",
                "description": "ค่าเดินทางไปเชียงใหม่",
                "amount": "5000.00",
                "vat_amount": "350.00",
            },
        )

        response = client.get("/api/v1/expense-claims?search=สมชาย", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "สมชาย" in data[0]["employee_name"]

    def test_get_expense_claim_detail(self, client, auth_headers):
        resp = client.post(
            "/api/v1/expense-claims",
            headers=auth_headers,
            json={
                "employee_name": "A",
                "expense_date": "2026-04-30",
                "category": "meal",
                "description": "Test detail",
                "amount": "500.00",
                "vat_amount": "35.00",
            },
        )
        claim_id = resp.json()["id"]

        response = client.get(f"/api/v1/expense-claims/{claim_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == claim_id
        assert data["description"] == "Test detail"
