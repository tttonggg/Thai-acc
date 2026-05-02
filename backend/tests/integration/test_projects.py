import pytest
from decimal import Decimal


class TestProjects:
    def test_create_project(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/projects",
            headers=auth_headers,
            json={
                "project_code": "PRJ-TEST-001",
                "name": "โครงการทดสอบ",
                "description": "รายละเอียดโครงการ",
                "budget_amount": 500000,
                "contact_id": str(test_contact.id),
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["project_code"] == "PRJ-TEST-001"
        assert data["name"] == "โครงการทดสอบ"
        assert Decimal(data["budget_amount"]) == Decimal("500000")
        assert data["status"] == "active"

    def test_duplicate_project_code(self, client, auth_headers):
        # Create first project
        client.post(
            "/api/v1/projects",
            headers=auth_headers,
            json={
                "project_code": "PRJ-DUP",
                "name": "Project 1",
                "budget_amount": 100000,
            },
        )
        
        # Try to create with same code
        response = client.post(
            "/api/v1/projects",
            headers=auth_headers,
            json={
                "project_code": "PRJ-DUP",
                "name": "Project 2",
                "budget_amount": 200000,
            },
        )
        assert response.status_code == 400

    def test_list_projects(self, client, auth_headers):
        # Create projects
        for i in range(3):
            client.post(
                "/api/v1/projects",
                headers=auth_headers,
                json={
                    "project_code": f"PRJ-{i}",
                    "name": f"Project {i}",
                    "budget_amount": 100000 * (i + 1),
                },
            )
        
        response = client.get("/api/v1/projects", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_filter_projects_by_status(self, client, auth_headers):
        # Create active and completed projects
        client.post(
            "/api/v1/projects",
            headers=auth_headers,
            json={"project_code": "PRJ-A", "name": "Active", "budget_amount": 100000},
        )
        
        resp = client.post(
            "/api/v1/projects",
            headers=auth_headers,
            json={"project_code": "PRJ-C", "name": "Completed", "budget_amount": 200000},
        )
        project_id = resp.json()["id"]
        
        # Mark as completed
        client.put(f"/api/v1/projects/{project_id}", headers=auth_headers, json={"status": "completed"})
        
        # Filter by status
        response = client.get("/api/v1/projects?status=active", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(p["status"] == "active" for p in data)
        assert len(data) == 1

    def test_update_project(self, client, auth_headers):
        resp = client.post(
            "/api/v1/projects",
            headers=auth_headers,
            json={"project_code": "PRJ-UPD", "name": "Old Name", "budget_amount": 100000},
        )
        project_id = resp.json()["id"]
        
        response = client.put(
            f"/api/v1/projects/{project_id}",
            headers=auth_headers,
            json={"name": "New Name", "budget_amount": 200000},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert Decimal(data["budget_amount"]) == Decimal("200000")

    def test_project_tagged_on_invoice(self, client, test_contact, test_project, auth_headers):
        # Create invoice with project
        response = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "project_id": str(test_project.id),
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["project_id"] == str(test_project.id)
        assert data["project_name"] == test_project.name

    def test_filter_invoices_by_project(self, client, test_contact, test_project, auth_headers):
        # Create invoice with project
        client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-04-30",
                "due_date": "2026-05-30",
                "project_id": str(test_project.id),
                "items": [{"description": "Test", "quantity": 1, "unit_price": "1000", "discount_percent": "0"}],
            },
        )
        
        # Filter by project
        response = client.get(f"/api/v1/invoices?project_id={test_project.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["project_id"] == str(test_project.id)
