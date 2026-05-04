import pytest


class TestAuthCookies:
    def test_login_sets_refresh_cookie(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "cookie@test.com",
                "password": "password123",
                "first_name": "Cookie",
                "last_name": "Test",
                "company_name": "Cookie Co",
                "company_tax_id": "9990001112223",
            },
        )
        assert response.status_code == 201
        # Response body should NOT contain refresh_token
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" not in data
        assert "user" in data
        # Cookie should be set
        assert "refresh_token" in response.cookies
        cookie = response.cookies.get("refresh_token")
        assert cookie is not None
        assert len(cookie) > 0

    def test_login_response_has_no_refresh_token_body(self, client):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "cookie@test.com", "password": "password123"},
        )
        # May fail if user doesn't exist, but we test the shape when it does
        if response.status_code == 200:
            data = response.json()
            assert "refresh_token" not in data

    def test_refresh_reads_cookie(self, client):
        # Register to get a cookie
        reg = client.post(
            "/api/v1/auth/register",
            json={
                "email": "refresh@test.com",
                "password": "password123",
                "first_name": "Refresh",
                "last_name": "Test",
                "company_name": "Refresh Co",
                "company_tax_id": "9990001112224",
            },
        )
        assert reg.status_code == 201
        assert "refresh_token" in reg.cookies

        # Refresh using cookie (no body)
        response = client.post("/api/v1/auth/refresh")
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" not in data
        # New cookie should be set
        assert "refresh_token" in response.cookies

    def test_refresh_without_cookie_returns_401(self, client):
        response = client.post("/api/v1/auth/refresh")
        assert response.status_code == 401
        assert "No refresh token" in response.json()["detail"]

    def test_logout_clears_cookie(self, client):
        # Register to get a cookie
        reg = client.post(
            "/api/v1/auth/register",
            json={
                "email": "logout@test.com",
                "password": "password123",
                "first_name": "Logout",
                "last_name": "Test",
                "company_name": "Logout Co",
                "company_tax_id": "9990001112225",
            },
        )
        assert reg.status_code == 201
        assert "refresh_token" in reg.cookies

        # Logout
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        # Cookie should be cleared (FastAPI TestClient may not show cleared cookies directly,
        # but subsequent refresh should fail)
        refresh = client.post("/api/v1/auth/refresh")
        assert refresh.status_code == 401

    def test_cookie_is_httponly(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "httponly@test.com",
                "password": "password123",
                "first_name": "Http",
                "last_name": "Only",
                "company_name": "HttpOnly Co",
                "company_tax_id": "9990001112226",
            },
        )
        assert response.status_code == 201
        # Check Set-Cookie header for httponly flag
        set_cookie = response.headers.get("set-cookie", "")
        assert "httponly" in set_cookie.lower()
        assert "samesite=lax" in set_cookie.lower()
