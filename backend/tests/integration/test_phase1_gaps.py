import pytest
from decimal import Decimal


class TestExchangeRates:
    def test_create_exchange_rate(self, client, auth_headers):
        response = client.post(
            "/api/v1/exchange-rates",
            headers=auth_headers,
            json={
                "from_currency": "USD",
                "to_currency": "THB",
                "rate": "36.50",
                "effective_date": "2026-05-01",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "THB"
        assert Decimal(data["rate"]) == Decimal("36.50")
        assert data["source"] == "manual"

    def test_list_exchange_rates(self, client, auth_headers):
        # Create a rate first
        client.post(
            "/api/v1/exchange-rates",
            headers=auth_headers,
            json={
                "from_currency": "USD",
                "to_currency": "THB",
                "rate": "36.50",
                "effective_date": "2026-05-01",
            },
        )
        
        response = client.get("/api/v1/exchange-rates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["from_currency"] == "USD"

    def test_list_exchange_rates_with_filter(self, client, auth_headers):
        client.post(
            "/api/v1/exchange-rates",
            headers=auth_headers,
            json={
                "from_currency": "USD",
                "to_currency": "THB",
                "rate": "36.50",
                "effective_date": "2026-05-01",
            },
        )
        client.post(
            "/api/v1/exchange-rates",
            headers=auth_headers,
            json={
                "from_currency": "EUR",
                "to_currency": "THB",
                "rate": "39.50",
                "effective_date": "2026-05-01",
            },
        )
        
        response = client.get("/api/v1/exchange-rates?from_currency=USD", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(r["from_currency"] == "USD" for r in data)

    def test_get_latest_rate_exists(self, client, auth_headers):
        client.post(
            "/api/v1/exchange-rates",
            headers=auth_headers,
            json={
                "from_currency": "USD",
                "to_currency": "THB",
                "rate": "36.50",
                "effective_date": "2026-05-01",
            },
        )
        
        response = client.get("/api/v1/exchange-rates/latest/USD/THB", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "THB"
        assert Decimal(data["rate"]) == Decimal("36.50")
        assert data["source"] == "manual"

    def test_get_latest_rate_default_fallback(self, client, auth_headers):
        response = client.get("/api/v1/exchange-rates/latest/USD/THB", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "THB"
        assert Decimal(data["rate"]) > Decimal("0")
        assert data["source"] == "default"

    def test_get_latest_rate_not_found(self, client, auth_headers):
        response = client.get("/api/v1/exchange-rates/latest/THB/XYZ", headers=auth_headers)
        assert response.status_code == 404


class TestStockAdjustments:
    def test_create_initial_adjustment(self, client, test_product, auth_headers):
        response = client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "initial",
                "quantity_change": "100",
                "unit_cost": "50.00",
                "reason": "ยอดยกมา",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["adjustment_type"] == "initial"
        assert Decimal(data["quantity_change"]) == Decimal("100")
        assert Decimal(data["unit_cost"]) == Decimal("50.00")
        assert Decimal(data["total_value"]) == Decimal("5000.00")

    def test_create_loss_adjustment_reduces_stock(self, client, test_product, auth_headers):
        # First add stock
        client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "initial",
                "quantity_change": "100",
                "unit_cost": "50.00",
            },
        )
        
        # Then record loss
        response = client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "loss",
                "quantity_change": "10",
                "unit_cost": "50.00",
                "reason": "สูญหาย",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert Decimal(data["quantity_change"]) == Decimal("-10")

    def test_create_damage_adjustment(self, client, test_product, auth_headers):
        # First add stock
        client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "initial",
                "quantity_change": "100",
                "unit_cost": "50.00",
            },
        )
        
        response = client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "damage",
                "quantity_change": "5",
                "unit_cost": "50.00",
                "reason": "เสียหาย",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert Decimal(data["quantity_change"]) == Decimal("-5")

    def test_cannot_reduce_below_zero(self, client, test_product, auth_headers):
        response = client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "loss",
                "quantity_change": "10",
                "unit_cost": "50.00",
            },
        )
        assert response.status_code == 400
        assert "Cannot reduce stock below zero" in response.json()["detail"]

    def test_list_stock_adjustments(self, client, test_product, auth_headers):
        client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "initial",
                "quantity_change": "100",
                "unit_cost": "50.00",
            },
        )
        
        response = client.get("/api/v1/stock-adjustments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_list_stock_adjustments_with_filter(self, client, test_product, auth_headers):
        client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "initial",
                "quantity_change": "100",
                "unit_cost": "50.00",
            },
        )
        
        response = client.get("/api/v1/stock-adjustments?adjustment_type=initial", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(a["adjustment_type"] == "initial" for a in data)

    def test_get_stock_movements(self, client, test_product, auth_headers):
        client.post(
            "/api/v1/stock-adjustments",
            headers=auth_headers,
            json={
                "product_id": str(test_product.id),
                "adjustment_type": "initial",
                "quantity_change": "100",
                "unit_cost": "50.00",
            },
        )
        
        response = client.get(f"/api/v1/stock-adjustments/movements/{test_product.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["movement_type"] == "adjustment"
        assert Decimal(data[0]["quantity_change"]) == Decimal("100")


class TestFifoLayers:
    def test_fifo_layers_created_from_purchase_invoice(self, client, test_contact, test_product, auth_headers):
        # Create purchase invoice with inventory
        response = client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {
                        "product_id": str(test_product.id),
                        "description": "สินค้าทดสอบ",
                        "quantity": "50",
                        "unit_price": "40.00",
                    }
                ],
            },
        )
        assert response.status_code == 201
        
        # Check FIFO layers
        response = client.get(f"/api/v1/products/{test_product.id}/fifo-layers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert Decimal(data[0]["quantity"]) == Decimal("50")
        assert Decimal(data[0]["unit_cost"]) == Decimal("40.00")

    def test_fifo_layers_remaining_quantity(self, client, test_contact, test_product, auth_headers):
        # Create purchase invoice
        client.post(
            "/api/v1/purchase-invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "bill_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {
                        "product_id": str(test_product.id),
                        "description": "สินค้าทดสอบ",
                        "quantity": "100",
                        "unit_price": "40.00",
                    }
                ],
            },
        )
        
        # Create sales invoice to consume some
        client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "due_date": "2026-06-01",
                "items": [
                    {
                        "product_id": str(test_product.id),
                        "description": "สินค้าทดสอบ",
                        "quantity": "30",
                        "unit_price": "100.00",
                    }
                ],
            },
        )
        
        # Check FIFO layers
        response = client.get(f"/api/v1/products/{test_product.id}/fifo-layers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        # Remaining should be 70
        assert Decimal(data[0]["remaining_qty"]) == Decimal("70")


class TestMultiCurrencyInvoices:
    def test_create_invoice_in_usd(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "due_date": "2026-06-01",
                "currency_code": "USD",
                "exchange_rate": "36.50",
                "items": [
                    {
                        "description": "สินค้า USD",
                        "quantity": "10",
                        "unit_price": "100.00",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["currency_code"] == "USD"
        assert Decimal(data["exchange_rate"]) == Decimal("36.50")
        assert Decimal(data["subtotal"]) == Decimal("1000.00")
        assert Decimal(data["total_amount"]) == Decimal("1070.00")

    def test_create_invoice_in_eur(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/invoices",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "due_date": "2026-06-01",
                "currency_code": "EUR",
                "exchange_rate": "39.50",
                "items": [
                    {
                        "description": "สินค้า EUR",
                        "quantity": "5",
                        "unit_price": "200.00",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["currency_code"] == "EUR"
        assert Decimal(data["exchange_rate"]) == Decimal("39.50")

    def test_create_quotation_with_default_currency(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/quotations",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "issue_date": "2026-05-01",
                "items": [
                    {
                        "description": "เสนอราคา",
                        "quantity": "10",
                        "unit_price": "50.00",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["currency_code"] == "THB"
        assert Decimal(data["exchange_rate"]) == Decimal("1")

    def test_create_purchase_order_with_default_currency(self, client, test_contact, auth_headers):
        response = client.post(
            "/api/v1/purchase-orders",
            headers=auth_headers,
            json={
                "contact_id": str(test_contact.id),
                "order_date": "2026-05-01",
                "items": [
                    {
                        "description": "สั่งซื้อ",
                        "quantity": "20",
                        "unit_price": "25.00",
                    }
                ],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["currency_code"] == "THB"
        assert Decimal(data["exchange_rate"]) == Decimal("1")
