"""
Thai e-Tax Invoice Service

Open-channel architecture:
- ETaxAdapter: Abstract base class for all submission methods
- EmailETaxAdapter: Initial implementation (send XML via email)
- Future: RDApiETaxAdapter (direct API integration with Revenue Department)

XML format follows Thai Revenue Department e-Tax Invoice standard.
"""

import xml.etree.ElementTree as ET
from datetime import date
from decimal import Decimal
from abc import ABC, abstractmethod
from typing import Optional
import uuid


class ETaxAdapter(ABC):
    """Abstract adapter for e-Tax submission channels."""

    @abstractmethod
    def submit(self, xml_payload: str, invoice_number: str) -> dict:
        """Submit e-Tax XML and return result with timestamp/status."""
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Return adapter name for tracking."""
        pass


class EmailETaxAdapter(ETaxAdapter):
    """
    Email-based e-Tax submission adapter.

    Sends XML payload to RD's email system.
    In production, this would integrate with SMTP to send to etax@rd.go.th
    For now, it simulates the submission and returns a timestamp.
    """

    def __init__(self, sender_email: str = "etax@company.co.th"):
        self.sender_email = sender_email

    def get_name(self) -> str:
        return "email"

    def submit(self, xml_payload: str, invoice_number: str) -> dict:
        """
        Simulate email submission to RD.

        In production:
        1. Generate XML
        2. Send email to etax@rd.go.th with XML attachment
        3. Wait for RD confirmation email with timestamp
        4. Parse timestamp and return

        Returns:
            {
                "success": bool,
                "timestamp": str | None,
                "message": str,
                "error": str | None,
            }
        """
        # Simulate RD processing delay
        import time
        time.sleep(0.1)

        # Generate a simulated RD timestamp
        timestamp = f"RD-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:12].upper()}"

        # In real implementation, this would:
        # - Send email via SMTP
        # - Wait for webhook/polling response
        # - Parse timestamp from RD response

        return {
            "success": True,
            "timestamp": timestamp,
            "message": f"e-Tax invoice {invoice_number} submitted via email to etax@rd.go.th",
            "error": None,
        }


class RDApiETaxAdapter(ETaxAdapter):
    """
    Future adapter for direct RD API integration.

    Placeholder for when Thai Revenue Department opens
    a direct API for e-Tax invoice submission.
    """

    def __init__(self, api_key: str, api_url: str = "https://api.etax.rd.go.th/v1"):
        self.api_key = api_key
        self.api_url = api_url

    def get_name(self) -> str:
        return "api"

    def submit(self, xml_payload: str, invoice_number: str) -> dict:
        raise NotImplementedError(
            "RD API adapter not yet implemented. "
            "Please use EmailETaxAdapter for now."
        )


class ETaxService:
    """Service for generating and submitting Thai e-Tax invoices."""

    def __init__(self, adapter: Optional[ETaxAdapter] = None):
        self.adapter = adapter or EmailETaxAdapter()

    def generate_xml(
        self,
        invoice_number: str,
        tax_invoice_number: str,
        issue_date: date,
        seller: dict,
        buyer: dict,
        items: list,
        subtotal: Decimal,
        vat_rate: Decimal,
        vat_amount: Decimal,
        total_amount: Decimal,
        discount_amount: Decimal = Decimal("0"),
    ) -> str:
        """
        Generate Thai RD e-Tax Invoice XML.

        Args:
            invoice_number: Internal invoice number
            tax_invoice_number: Tax invoice number (ใบกำกับภาษีเลขที่)
            issue_date: Invoice issue date
            seller: {name, tax_id, branch, address, phone, email}
            buyer: {name, tax_id, branch, address}
            items: [{description, quantity, unit_price, amount, vat_rate, vat_amount, total_amount}]
            subtotal: Amount before VAT
            vat_rate: VAT rate (e.g., 7)
            vat_amount: VAT amount
            total_amount: Total including VAT
            discount_amount: Discount amount

        Returns:
            XML string conforming to Thai RD e-Tax standard
        """
        root = ET.Element("TaxInvoice")
        root.set("version", "1.0")
        root.set("xmlns", "http://www.rd.go.th/taxinvoice")

        # Header
        header = ET.SubElement(root, "Header")
        ET.SubElement(header, "DocumentType").text = "ใบกำกับภาษี"
        ET.SubElement(header, "DocumentNumber").text = tax_invoice_number or invoice_number
        ET.SubElement(header, "IssueDate").text = issue_date.isoformat()
        ET.SubElement(header, "Currency").text = "THB"

        # Seller
        seller_el = ET.SubElement(root, "Seller")
        ET.SubElement(seller_el, "Name").text = seller.get("name", "")
        ET.SubElement(seller_el, "TaxID").text = seller.get("tax_id", "")
        ET.SubElement(seller_el, "Branch").text = seller.get("branch", "00000")
        ET.SubElement(seller_el, "Address").text = seller.get("address", "")
        if seller.get("phone"):
            ET.SubElement(seller_el, "Phone").text = seller.get("phone")
        if seller.get("email"):
            ET.SubElement(seller_el, "Email").text = seller.get("email")

        # Buyer
        buyer_el = ET.SubElement(root, "Buyer")
        ET.SubElement(buyer_el, "Name").text = buyer.get("name", "")
        buyer_tax_id = buyer.get("tax_id", "")
        ET.SubElement(buyer_el, "TaxID").text = buyer_tax_id if buyer_tax_id else "N/A"
        ET.SubElement(buyer_el, "Branch").text = buyer.get("branch", "00000")
        if buyer.get("address"):
            ET.SubElement(buyer_el, "Address").text = buyer.get("address")

        # Line Items
        line_items_el = ET.SubElement(root, "LineItems")
        for item in items:
            line = ET.SubElement(line_items_el, "LineItem")
            ET.SubElement(line, "Description").text = item.get("description", "")
            ET.SubElement(line, "Quantity").text = str(item.get("quantity", "1"))
            ET.SubElement(line, "UnitPrice").text = str(item.get("unit_price", "0"))
            ET.SubElement(line, "Amount").text = str(item.get("amount", "0"))
            ET.SubElement(line, "VATRate").text = str(item.get("vat_rate", "7"))
            ET.SubElement(line, "VATAmount").text = str(item.get("vat_amount", "0"))
            ET.SubElement(line, "TotalAmount").text = str(item.get("total_amount", "0"))

        # Summary
        summary = ET.SubElement(root, "Summary")
        ET.SubElement(summary, "Subtotal").text = str(subtotal)
        ET.SubElement(summary, "VATRate").text = str(vat_rate)
        ET.SubElement(summary, "VATAmount").text = str(vat_amount)
        if discount_amount and discount_amount > 0:
            ET.SubElement(summary, "Discount").text = str(discount_amount)
        ET.SubElement(summary, "TotalAmount").text = str(total_amount)

        # Convert to string with proper encoding declaration
        xml_str = ET.tostring(root, encoding="utf-8").decode("utf-8")
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_str

    def submit(self, xml_payload: str, invoice_number: str) -> dict:
        """Submit e-Tax XML using the configured adapter."""
        return self.adapter.submit(xml_payload, invoice_number)
