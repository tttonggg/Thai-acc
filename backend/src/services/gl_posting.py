from decimal import Decimal
from sqlalchemy.orm import Session
from ..models.gl import JournalEntry, JournalEntryLine, ChartOfAccount
from ..models.invoice import Invoice, InvoiceItem
from ..models.purchase_invoice import PurchaseInvoice, PurchaseInvoiceItem
from ..models.product import Product
from ..models.inventory_batch import InventoryBatch
from ..models.receipt import Receipt
from ..models.expense_claim import ExpenseClaim


class GLPostingService:
    """Service for posting double-entry journal entries to the General Ledger."""
    
    def __init__(self, db: Session, company_id: str):
        self.db = db
        self.company_id = company_id
    
    def _get_account_by_code(self, code: str) -> ChartOfAccount | None:
        """Lookup GL account by code."""
        return self.db.query(ChartOfAccount).filter(
            ChartOfAccount.company_id == self.company_id,
            ChartOfAccount.code == code,
            ChartOfAccount.is_active == "Y",
        ).first()
    
    def _get_account_by_sub_type(self, account_type: str, sub_type: str) -> ChartOfAccount | None:
        """Lookup GL account by sub-type."""
        return self.db.query(ChartOfAccount).filter(
            ChartOfAccount.company_id == self.company_id,
            ChartOfAccount.account_type == account_type,
            ChartOfAccount.account_sub_type == sub_type,
            ChartOfAccount.is_active == "Y",
        ).first()
    
    def _create_journal_entry(self, entry_type: str, document_id, document_number: str,
                              entry_date, description: str, lines: list) -> JournalEntry | None:
        """Create a balanced journal entry."""
        total_debit = sum(line.get("debit", 0) for line in lines)
        total_credit = sum(line.get("credit", 0) for line in lines)
        
        if total_debit != total_credit:
            raise ValueError(f"Journal entry unbalanced: Dr {total_debit} != Cr {total_credit}")
        
        if total_debit == 0:
            return None  # No entry needed
        
        entry = JournalEntry(
            company_id=self.company_id,
            entry_type=entry_type,
            document_id=document_id,
            document_number=document_number,
            entry_date=entry_date,
            description=description,
            total_debit=total_debit,
            total_credit=total_credit,
        )
        self.db.add(entry)
        self.db.flush()
        
        for line in lines:
            self.db.add(JournalEntryLine(
                journal_entry_id=entry.id,
                account_id=line["account_id"],
                description=line.get("description", ""),
                debit_amount=line.get("debit", 0),
                credit_amount=line.get("credit", 0),
                contact_id=line.get("contact_id"),
                project_id=line.get("project_id"),
            ))
        
        return entry
    
    def post_invoice(self, invoice: Invoice) -> JournalEntry | None:
        """Post GL when invoice is created.
        
        Dr. Accounts Receivable (ลูกหนี้การค้า)     total_amount
            Cr. Sales Revenue (รายได้จากการขาย)     subtotal
            Cr. VAT Output (ภาษีมูลค่าเพิ่มขาย)      vat_amount
        """
        ar_account = self._get_account_by_code("11200")  # ลูกหนี้การค้า
        revenue_account = self._get_account_by_code("41000")  # รายได้จากการขาย
        vat_account = self._get_account_by_code("21100")  # ภาษีมูลค่าเพิ่มขาย
        
        if not all([ar_account, revenue_account, vat_account]):
            return None  # COA not seeded yet
        
        lines = []
        
        # Dr. Accounts Receivable
        lines.append({
            "account_id": ar_account.id,
            "debit": invoice.total_amount,
            "credit": 0,
            "description": f"ลูกหนี้จากใบแจ้งหนี้ {invoice.invoice_number}",
            "contact_id": invoice.contact_id,
            "project_id": invoice.project_id,
        })
        
        # Cr. Sales Revenue
        lines.append({
            "account_id": revenue_account.id,
            "debit": 0,
            "credit": invoice.subtotal,
            "description": f"รายได้จากการขาย {invoice.invoice_number}",
            "contact_id": invoice.contact_id,
            "project_id": invoice.project_id,
        })
        
        # Cr. VAT Output
        if invoice.vat_amount > 0:
            lines.append({
                "account_id": vat_account.id,
                "debit": 0,
                "credit": invoice.vat_amount,
                "description": f"ภาษีมูลค่าเพิ่มขาย {invoice.invoice_number}",
                "contact_id": invoice.contact_id,
                "project_id": invoice.project_id,
            })
        
        entry = self._create_journal_entry(
            entry_type="invoice",
            document_id=invoice.id,
            document_number=invoice.invoice_number,
            entry_date=invoice.issue_date,
            description=f"บันทึกบัญชีใบแจ้งหนี้ {invoice.invoice_number}",
            lines=lines,
        )

        # Post COGS for tracked inventory items
        self._post_invoice_cogs(invoice)

        return entry

    def _post_invoice_cogs(self, invoice: Invoice) -> JournalEntry | None:
        """Post COGS by consuming FIFO batches for invoice items."""
        items = (
            self.db.query(InvoiceItem)
            .filter(InvoiceItem.invoice_id == invoice.id)
            .all()
        )

        total_cogs = Decimal("0")
        for item in items:
            if not item.product_id:
                continue
            product = self.db.query(Product).filter(
                Product.id == item.product_id,
                Product.company_id == self.company_id,
            ).first()
            if not product or not product.track_inventory:
                continue
            qty = Decimal(str(item.quantity))
            if qty <= 0:
                continue
            total_cogs += self._consume_fifo(str(item.product_id), qty)

        if total_cogs <= 0:
            return None

        cogs_account = self._get_account_by_code("51000")  # ต้นทุนขาย
        inventory_account = self._get_account_by_code("11400")  # สินค้าคงเหลือ

        if not cogs_account or not inventory_account:
            return None

        return self._create_journal_entry(
            entry_type="cogs",
            document_id=invoice.id,
            document_number=invoice.invoice_number,
            entry_date=invoice.issue_date,
            description=f"ต้นทุนขายจากใบแจ้งหนี้ {invoice.invoice_number}",
            lines=[
                {
                    "account_id": cogs_account.id,
                    "debit": total_cogs,
                    "credit": 0,
                    "description": f"ต้นทุนขาย {invoice.invoice_number}",
                    "contact_id": invoice.contact_id,
                    "project_id": invoice.project_id,
                },
                {
                    "account_id": inventory_account.id,
                    "debit": 0,
                    "credit": total_cogs,
                    "description": f"ลดสินค้าคงเหลือ {invoice.invoice_number}",
                    "contact_id": invoice.contact_id,
                    "project_id": invoice.project_id,
                },
            ],
        )

    def post_purchase_invoice(self, purchase_invoice: PurchaseInvoice) -> JournalEntry | None:
        """Post GL when purchase invoice is created.
        
        Dr. Inventory/Expense (สินค้าคงเหลือ/ค่าใช้จ่าย)  subtotal
        Dr. VAT Input (ภาษีมูลค่าเพิ่มซื้อ)                  vat_amount
            Cr. Accounts Payable (เจ้าหนี้การค้า)            total_amount
        """
        inventory_account = self._get_account_by_code("11400")  # สินค้าคงเหลือ
        cogs_account = self._get_account_by_code("51000")  # ต้นทุนขาย
        vat_account = self._get_account_by_code("21200")  # ภาษีมูลค่าเพิ่มซื้อ
        ap_account = self._get_account_by_code("21000")  # เจ้าหนี้การค้า
        
        debit_account = inventory_account or cogs_account
        
        if not all([debit_account, vat_account, ap_account]):
            return None  # COA not seeded yet
        
        lines = []
        
        # Dr. Inventory/Expense
        lines.append({
            "account_id": debit_account.id,
            "debit": purchase_invoice.subtotal,
            "credit": 0,
            "description": f"สินค้า/ค่าใช้จ่ายจากใบแจ้งหนี้ซื้อ {purchase_invoice.bill_number}",
            "contact_id": purchase_invoice.contact_id,
            "project_id": purchase_invoice.project_id,
        })
        
        # Dr. VAT Input
        if purchase_invoice.vat_amount > 0:
            lines.append({
                "account_id": vat_account.id,
                "debit": purchase_invoice.vat_amount,
                "credit": 0,
                "description": f"ภาษีมูลค่าเพิ่มซื้อ {purchase_invoice.bill_number}",
                "contact_id": purchase_invoice.contact_id,
                "project_id": purchase_invoice.project_id,
            })
        
        # Cr. Accounts Payable
        lines.append({
            "account_id": ap_account.id,
            "debit": 0,
            "credit": purchase_invoice.total_amount,
            "description": f"เจ้าหนี้จากใบแจ้งหนี้ซื้อ {purchase_invoice.bill_number}",
            "contact_id": purchase_invoice.contact_id,
            "project_id": purchase_invoice.project_id,
        })
        
        entry = self._create_journal_entry(
            entry_type="purchase_invoice",
            document_id=purchase_invoice.id,
            document_number=purchase_invoice.bill_number,
            entry_date=purchase_invoice.bill_date,
            description=f"บันทึกบัญชีใบแจ้งหนี้ซื้อ {purchase_invoice.bill_number}",
            lines=lines,
        )

        # Create inventory batches for tracked products
        self._create_inventory_batches(purchase_invoice)

        return entry

    def _create_inventory_batches(self, purchase_invoice: PurchaseInvoice) -> None:
        """Create FIFO inventory batches from purchase invoice items."""
        items = (
            self.db.query(PurchaseInvoiceItem)
            .filter(PurchaseInvoiceItem.purchase_invoice_id == purchase_invoice.id)
            .all()
        )
        for item in items:
            if not item.product_id:
                continue
            product = self.db.query(Product).filter(
                Product.id == item.product_id,
                Product.company_id == self.company_id,
            ).first()
            if not product or not product.track_inventory:
                continue
            # Calculate unit cost (handle division by zero)
            qty = Decimal(str(item.quantity))
            if qty == 0:
                continue
            unit_cost = Decimal(str(item.amount)) / qty
            batch = InventoryBatch(
                company_id=self.company_id,
                product_id=item.product_id,
                quantity=qty,
                unit_cost=unit_cost,
                remaining_qty=qty,
                purchase_date=purchase_invoice.bill_date,
                purchase_invoice_id=purchase_invoice.id,
                is_active=True,
            )
            self.db.add(batch)
        self.db.flush()

    def _consume_fifo(self, product_id: str, quantity: Decimal) -> Decimal:
        """Consume inventory batches via FIFO and return total COGS."""
        batches = (
            self.db.query(InventoryBatch)
            .filter(
                InventoryBatch.company_id == self.company_id,
                InventoryBatch.product_id == product_id,
                InventoryBatch.remaining_qty > 0,
                InventoryBatch.is_active == True,
            )
            .order_by(InventoryBatch.purchase_date.asc(), InventoryBatch.created_at.asc())
            .all()
        )

        remaining = quantity
        total_cogs = Decimal("0")

        for batch in batches:
            if remaining <= 0:
                break
            consume = min(remaining, batch.remaining_qty)
            total_cogs += consume * batch.unit_cost
            batch.remaining_qty -= consume
            remaining -= consume
            if batch.remaining_qty <= 0:
                batch.is_active = False

        # If still remaining, fallback to product cost_price
        if remaining > 0:
            product = self.db.query(Product).filter(
                Product.id == product_id,
                Product.company_id == self.company_id,
            ).first()
            if product:
                total_cogs += remaining * Decimal(str(product.cost_price))

        self.db.flush()
        return total_cogs

    def post_receipt(self, receipt: Receipt) -> JournalEntry | None:
        """Post GL when receipt is created.
        
        Dr. Cash/Bank (เงินสด/ธนาคาร)              total_amount
        Dr. WHT Receivable (ลูกหนี้ภาษีหัก ณ ที่จ่าย)  wht_amount
            Cr. Accounts Receivable (ลูกหนี้การค้า)  amount + wht_amount
        """
        cash_account = self._get_account_by_code("11000")  # เงินสด (fallback)
        bank_account = self._get_account_by_code("11100")  # เงินฝากธนาคาร
        ar_account = self._get_account_by_code("11200")  # ลูกหนี้การค้า
        wht_account = self._get_account_by_code("11300")  # ลูกหนี้เงินสดนำส่ง
        
        if not all([ar_account]):
            return None
        
        # Use bank account for bank_transfer/cheque/credit_card, cash for others
        if receipt.payment_method in ["bank_transfer", "cheque", "credit_card"]:
            debit_account = bank_account or cash_account
        else:
            debit_account = cash_account or bank_account
        
        if not debit_account:
            return None
        
        lines = []
        
        # Dr. Cash/Bank
        lines.append({
            "account_id": debit_account.id,
            "debit": receipt.total_amount,
            "credit": 0,
            "description": f"รับเงินจากใบเสร็จ {receipt.receipt_number}",
            "contact_id": receipt.contact_id,
            "project_id": receipt.project_id,
        })
        
        # Dr. WHT Receivable (if any)
        if receipt.wht_amount > 0 and wht_account:
            lines.append({
                "account_id": wht_account.id,
                "debit": receipt.wht_amount,
                "credit": 0,
                "description": f"ภาษีหัก ณ ที่จ่าย {receipt.receipt_number}",
                "contact_id": receipt.contact_id,
                "project_id": receipt.project_id,
            })
        
        # Cr. Accounts Receivable
        total_cr = receipt.amount + receipt.wht_amount
        lines.append({
            "account_id": ar_account.id,
            "debit": 0,
            "credit": total_cr,
            "description": f"ลดลูกหนี้จากใบเสร็จ {receipt.receipt_number}",
            "contact_id": receipt.contact_id,
            "project_id": receipt.project_id,
        })
        
        return self._create_journal_entry(
            entry_type="receipt",
            document_id=receipt.id,
            document_number=receipt.receipt_number,
            entry_date=receipt.receipt_date,
            description=f"บันทึกบัญชีรับเงิน {receipt.receipt_number}",
            lines=lines,
        )
    
    def post_expense_claim(self, claim: ExpenseClaim) -> JournalEntry | None:
        """Post GL when expense claim is paid.

        Map category to expense account code:
        - travel → "52000" (Selling Expenses / ค่าใช้จ่ายในการขาย)
        - meal → "52000"
        - office → "52500" (Administrative Expenses / ค่าใช้จ่ายในการบริหาร)
        - supplies → "51000" (Cost of Goods Sold / ต้นทุนขาย)
        - transportation → "52000"
        - other → "52500"

        Dr. Expense account                    amount
        Dr. VAT Input (if vat_amount > 0)      vat_amount
            Cr. Cash/Bank (11000 or 11100)     total_amount
        """
        category_to_account = {
            "travel": "52000",
            "meal": "52000",
            "office": "52500",
            "supplies": "51000",
            "transportation": "52000",
            "other": "52500",
        }
        expense_code = category_to_account.get(claim.category, "52500")
        expense_account = self._get_account_by_code(expense_code)
        vat_account = self._get_account_by_code("11900")  # ภาษีซื้อ
        cash_account = self._get_account_by_code("11000")  # เงินสด
        bank_account = self._get_account_by_code("11100")  # เงินฝากธนาคาร

        if not expense_account:
            return None  # COA not seeded yet

        debit_account = bank_account or cash_account
        if not debit_account:
            return None

        lines = []

        # Dr. Expense account
        lines.append({
            "account_id": expense_account.id,
            "debit": claim.amount,
            "credit": 0,
            "description": f"ค่าใช้จ่าย {claim.claim_number}",
            "contact_id": claim.contact_id,
            "project_id": claim.project_id,
        })

        # Dr. VAT Input (if any)
        if claim.vat_amount > 0 and vat_account:
            lines.append({
                "account_id": vat_account.id,
                "debit": claim.vat_amount,
                "credit": 0,
                "description": f"ภาษีซื้อ {claim.claim_number}",
                "contact_id": claim.contact_id,
                "project_id": claim.project_id,
            })

        # Cr. Cash/Bank
        lines.append({
            "account_id": debit_account.id,
            "debit": 0,
            "credit": claim.total_amount,
            "description": f"จ่ายเงินค่าใช้จ่าย {claim.claim_number}",
            "contact_id": claim.contact_id,
            "project_id": claim.project_id,
        })

        return self._create_journal_entry(
            entry_type="expense_claim",
            document_id=claim.id,
            document_number=claim.claim_number,
            entry_date=claim.expense_date,
            description=f"บันทึกบัญชีจ่ายเงินเบิกค่าใช้จ่าย {claim.claim_number}",
            lines=lines,
        )

    def post_stock_adjustment(self, adjustment, user_id: str) -> JournalEntry | None:
        """Post GL for stock adjustment.

        Increase stock:
            Dr. Inventory (11400)     total_value
                Cr. Adjustment account (52900)  total_value

        Decrease stock:
            Dr. Adjustment account (52900)  total_value
                Cr. Inventory (11400)     total_value
        """
        from ..models.stock_adjustment import StockAdjustment
        if not isinstance(adjustment, StockAdjustment):
            return None

        inventory_account = self._get_account_by_code("11400")  # สินค้าคงเหลือ
        adjustment_account = self._get_account_by_code("52900")  # รายได้/ค่าใช้จ่ายอื่น

        if not inventory_account:
            return None

        # Fallback: if no adjustment account, use expense account
        if not adjustment_account:
            adjustment_account = self._get_account_by_code("52500")
        if not adjustment_account:
            return None

        lines = []
        if adjustment.quantity_change > 0:
            # Increase stock
            lines.append({
                "account_id": inventory_account.id,
                "debit": adjustment.total_value,
                "credit": 0,
                "description": f"ปรับเพิ่มสต็อก {adjustment.product.name if adjustment.product else ''}",
            })
            lines.append({
                "account_id": adjustment_account.id,
                "debit": 0,
                "credit": adjustment.total_value,
                "description": f"ปรับเพิ่มสต็อก {adjustment.adjustment_type}",
            })
        else:
            # Decrease stock
            lines.append({
                "account_id": adjustment_account.id,
                "debit": adjustment.total_value,
                "credit": 0,
                "description": f"ปรับลดสต็อก {adjustment.adjustment_type}",
            })
            lines.append({
                "account_id": inventory_account.id,
                "debit": 0,
                "credit": adjustment.total_value,
                "description": f"ปรับลดสต็อก {adjustment.product.name if adjustment.product else ''}",
            })

        return self._create_journal_entry(
            entry_type="stock_adjustment",
            document_id=adjustment.id,
            document_number=f"ADJ-{adjustment.id[:8]}",
            entry_date=adjustment.created_at.date() if adjustment.created_at else None,
            description=f"ปรับสต็อก {adjustment.adjustment_type} - {adjustment.product.name if adjustment.product else ''}",
            lines=lines,
        )

    def post_sales_credit_note(self, note) -> JournalEntry | None:
        """Post GL when sales credit note is confirmed.

        Dr. Sales Returns (รายได้ลด)          subtotal
        Dr. VAT Output (ภาษีขาย)              vat_amount (reverse)
            Cr. Accounts Receivable (ลูกหนี้)   total_amount
        """
        from ..models.credit_note import CreditNote
        if not isinstance(note, CreditNote):
            return None

        ar_account = self._get_account_by_code("11200")  # ลูกหนี้การค้า
        revenue_account = self._get_account_by_code("41000")  # รายได้จากการขาย
        vat_account = self._get_account_by_code("21100")  # ภาษีมูลค่าเพิ่มขาย

        if not all([ar_account, revenue_account, vat_account]):
            return None

        lines = []

        # Dr. Sales Returns (using same revenue account or a returns account)
        lines.append({
            "account_id": revenue_account.id,
            "debit": note.subtotal,
            "credit": 0,
            "description": f"ลดรายได้จากใบลดหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        # Dr. VAT Output (reverse)
        if note.vat_amount > 0:
            lines.append({
                "account_id": vat_account.id,
                "debit": note.vat_amount,
                "credit": 0,
                "description": f"ลดภาษีขายจากใบลดหนี้ {note.document_number}",
                "contact_id": note.contact_id,
            })

        # Cr. Accounts Receivable
        lines.append({
            "account_id": ar_account.id,
            "debit": 0,
            "credit": note.total_amount,
            "description": f"ลดลูกหนี้จากใบลดหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        return self._create_journal_entry(
            entry_type="sales_credit_note",
            document_id=note.id,
            document_number=note.document_number,
            entry_date=note.issue_date,
            description=f"บันทึกบัญชีใบลดหนี้ {note.document_number}",
            lines=lines,
        )

    def reverse_sales_credit_note(self, note) -> JournalEntry | None:
        """Reverse GL when sales credit note is cancelled."""
        from ..models.credit_note import CreditNote
        if not isinstance(note, CreditNote):
            return None

        ar_account = self._get_account_by_code("11200")
        revenue_account = self._get_account_by_code("41000")
        vat_account = self._get_account_by_code("21100")

        if not all([ar_account, revenue_account, vat_account]):
            return None

        lines = []

        # Reverse: Cr. Sales Returns
        lines.append({
            "account_id": revenue_account.id,
            "debit": 0,
            "credit": note.subtotal,
            "description": f"ยกเลิกใบลดหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        # Reverse: Cr. VAT Output
        if note.vat_amount > 0:
            lines.append({
                "account_id": vat_account.id,
                "debit": 0,
                "credit": note.vat_amount,
                "description": f"ยกเลิกใบลดหนี้ {note.document_number}",
                "contact_id": note.contact_id,
            })

        # Reverse: Dr. AR
        lines.append({
            "account_id": ar_account.id,
            "debit": note.total_amount,
            "credit": 0,
            "description": f"ยกเลิกใบลดหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        return self._create_journal_entry(
            entry_type="sales_credit_note_reversal",
            document_id=note.id,
            document_number=note.document_number,
            entry_date=note.issue_date,
            description=f"ยกเลิกใบลดหนี้ {note.document_number}",
            lines=lines,
        )

    def post_sales_debit_note(self, note) -> JournalEntry | None:
        """Post GL when sales debit note is confirmed.

        Dr. Accounts Receivable (ลูกหนี้)      total_amount
            Cr. Sales Revenue (รายได้)          subtotal
            Cr. VAT Output (ภาษีขาย)            vat_amount
        """
        from ..models.credit_note import CreditNote
        if not isinstance(note, CreditNote):
            return None

        ar_account = self._get_account_by_code("11200")
        revenue_account = self._get_account_by_code("41000")
        vat_account = self._get_account_by_code("21100")

        if not all([ar_account, revenue_account, vat_account]):
            return None

        lines = []

        # Dr. AR
        lines.append({
            "account_id": ar_account.id,
            "debit": note.total_amount,
            "credit": 0,
            "description": f"เพิ่มลูกหนี้จากใบเพิ่มหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        # Cr. Sales Revenue
        lines.append({
            "account_id": revenue_account.id,
            "debit": 0,
            "credit": note.subtotal,
            "description": f"รายได้จากใบเพิ่มหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        # Cr. VAT Output
        if note.vat_amount > 0:
            lines.append({
                "account_id": vat_account.id,
                "debit": 0,
                "credit": note.vat_amount,
                "description": f"ภาษีขายจากใบเพิ่มหนี้ {note.document_number}",
                "contact_id": note.contact_id,
            })

        return self._create_journal_entry(
            entry_type="sales_debit_note",
            document_id=note.id,
            document_number=note.document_number,
            entry_date=note.issue_date,
            description=f"บันทึกบัญชีใบเพิ่มหนี้ {note.document_number}",
            lines=lines,
        )

    def reverse_sales_debit_note(self, note) -> JournalEntry | None:
        """Reverse GL when sales debit note is cancelled."""
        from ..models.credit_note import CreditNote
        if not isinstance(note, CreditNote):
            return None

        ar_account = self._get_account_by_code("11200")
        revenue_account = self._get_account_by_code("41000")
        vat_account = self._get_account_by_code("21100")

        if not all([ar_account, revenue_account, vat_account]):
            return None

        lines = []

        # Reverse: Cr. AR
        lines.append({
            "account_id": ar_account.id,
            "debit": 0,
            "credit": note.total_amount,
            "description": f"ยกเลิกใบเพิ่มหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        # Reverse: Dr. Revenue
        lines.append({
            "account_id": revenue_account.id,
            "debit": note.subtotal,
            "credit": 0,
            "description": f"ยกเลิกใบเพิ่มหนี้ {note.document_number}",
            "contact_id": note.contact_id,
        })

        # Reverse: Dr. VAT
        if note.vat_amount > 0:
            lines.append({
                "account_id": vat_account.id,
                "debit": note.vat_amount,
                "credit": 0,
                "description": f"ยกเลิกใบเพิ่มหนี้ {note.document_number}",
                "contact_id": note.contact_id,
            })

        return self._create_journal_entry(
            entry_type="sales_debit_note_reversal",
            document_id=note.id,
            document_number=note.document_number,
            entry_date=note.issue_date,
            description=f"ยกเลิกใบเพิ่มหนี้ {note.document_number}",
            lines=lines,
        )

    def validate_balance(self, journal_entry: JournalEntry) -> bool:
        """Validate that a journal entry balances."""
        lines = journal_entry.lines.all()
        total_dr = sum(line.debit_amount for line in lines)
        total_cr = sum(line.credit_amount for line in lines)
        return total_dr == total_cr and total_dr > 0
