-- Performance Index Migration
-- Created: 2026-03-17
-- Purpose: Add indexes for common query patterns to improve performance

-- Journal Entries indexes
CREATE INDEX IF NOT EXISTS "JournalEntry.date_idx" ON "JournalEntry"(date);
CREATE INDEX IF NOT EXISTS "JournalEntry.company_idx" ON "JournalEntry"("companyId");
CREATE INDEX IF NOT EXISTS "JournalEntry.date_company_idx" ON "JournalEntry"(date, "companyId");

-- Invoices indexes
CREATE INDEX IF NOT EXISTS "Invoice.customer_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice.status_idx" ON "Invoice"(status);
CREATE INDEX IF NOT EXISTS "Invoice.date_idx" ON "Invoice"("invoiceDate");
CREATE INDEX IF NOT EXISTS "Invoice.customer_status_idx" ON "Invoice"("customerId", status);
CREATE INDEX IF NOT EXISTS "Invoice.date_status_idx" ON "Invoice"("invoiceDate", status);

-- Receipts indexes
CREATE INDEX IF NOT EXISTS "Receipt.customer_idx" ON "Receipt"("customerId");
CREATE INDEX IF NOT EXISTS "Receipt.date_idx" ON "Receipt"("receiptDate");
CREATE INDEX IF NOT EXISTS "Receipt.customer_date_idx" ON "Receipt"("customerId", "receiptDate");

-- Payments indexes
CREATE INDEX IF NOT EXISTS "Payment.vendor_idx" ON "Payment"("vendorId");
CREATE INDEX IF NOT EXISTS "Payment.date_idx" ON "Payment"("paymentDate");
CREATE INDEX IF NOT EXISTS "Payment.vendor_date_idx" ON "Payment"("vendorId", "paymentDate");

-- VAT Records indexes
CREATE INDEX IF NOT EXISTS "VatRecord.taxYear_idx" ON "VatRecord"("taxYear");
CREATE INDEX IF NOT EXISTS "VatRecord.taxYear_month_idx" ON "VatRecord"("taxYear", "taxMonth");
CREATE INDEX IF NOT EXISTS "VatRecord.type_idx" ON "VatRecord"(type);
CREATE INDEX IF NOT EXISTS "VatRecord.year_type_idx" ON "VatRecord"("taxYear", type);

-- Chart of Accounts indexes
CREATE INDEX IF NOT EXISTS "ChartOfAccount.type_idx" ON "ChartOfAccount"(type);
CREATE INDEX IF NOT EXISTS "ChartOfAccount.parent_idx" ON "ChartOfAccount"("parentId");
CREATE INDEX IF NOT EXISTS "ChartOfAccount.active_idx" ON "ChartOfAccount"("isActive");
CREATE INDEX IF NOT EXISTS "ChartOfAccount.type_active_idx" ON "ChartOfAccount"(type, "isActive");

-- Customers indexes
CREATE INDEX IF NOT EXISTS "Customer.company_idx" ON "Customer"("companyId");
CREATE INDEX IF NOT EXISTS "Customer.active_idx" ON "Customer"("isActive");
CREATE INDEX IF NOT EXISTS "Customer.company_active_idx" ON "Customer"("companyId", "isActive");

-- Vendors indexes
CREATE INDEX IF NOT EXISTS "Vendor.company_idx" ON "Vendor"("companyId");
CREATE INDEX IF NOT EXISTS "Vendor.active_idx" ON "Vendor"("isActive");
CREATE INDEX IF NOT EXISTS "Vendor.company_active_idx" ON "Vendor"("companyId", "isActive");

-- Stock Balances indexes
CREATE INDEX IF NOT EXISTS "StockBalance.product_idx" ON "StockBalance"("productId");
CREATE INDEX IF NOT EXISTS "StockBalance.warehouse_idx" ON "StockBalance"("warehouseId");
CREATE INDEX IF NOT EXISTS "StockBalance.product_warehouse_idx" ON "StockBalance"("productId", "warehouseId");

-- Stock Movements indexes
CREATE INDEX IF NOT EXISTS "StockMovement.product_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement.date_idx" ON "StockMovement"(date);
CREATE INDEX IF NOT EXISTS "StockMovement.type_idx" ON "StockMovement"(type);
CREATE INDEX IF NOT EXISTS "StockMovement.product_date_idx" ON "StockMovement"("productId", date);

-- Employees indexes
CREATE INDEX IF NOT EXISTS "Employee.company_idx" ON "Employee"("companyId");
CREATE INDEX IF NOT EXISTS "Employee.active_idx" ON "Employee"("isActive");
CREATE INDEX IF NOT EXISTS "Employee.company_active_idx" ON "Employee"("companyId", "isActive");

-- Assets indexes
CREATE INDEX IF NOT EXISTS "Asset.company_idx" ON "Asset"("companyId");
CREATE INDEX IF NOT EXISTS "Asset.active_idx" ON "Asset"("isActive");
CREATE INDEX IF NOT EXISTS "Asset.company_active_idx" ON "Asset"("companyId", "isActive");

-- Petty Cash indexes
CREATE INDEX IF NOT EXISTS "PettyCashFund.company_idx" ON "PettyCashFund"("companyId");
CREATE INDEX IF NOT EXISTS "PettyCashVoucher.fund_idx" ON "PettyCashVoucher"("fundId");
CREATE INDEX IF NOT EXISTS "PettyCashVoucher.date_idx" ON "PettyCashVoucher"(date);

-- Bank Accounts indexes
CREATE INDEX IF NOT EXISTS "BankAccount.company_idx" ON "BankAccount"("companyId");
CREATE INDEX IF NOT EXISTS "Cheque.bankAccount_idx" ON "Cheque"("bankAccountId");
CREATE INDEX IF NOT EXISTS "Cheque.status_idx" ON "Cheque"(status);
CREATE INDEX IF NOT EXISTS "Cheque.dueDate_idx" ON "Cheque"(dueDate);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS "PayrollRun.company_idx" ON "PayrollRun"("companyId");
CREATE INDEX IF NOT EXISTS "PayrollRun.date_idx" ON "PayrollRun"("paymentDate");
CREATE INDEX IF NOT EXISTS "Payroll.employee_idx" ON "Payroll"("employeeId");
CREATE INDEX IF NOT EXISTS "Payroll.run_idx" ON "Payroll"("runId");

-- Journal Lines indexes
CREATE INDEX IF NOT EXISTS "JournalLine.entry_idx" ON "JournalLine"("entryId");
CREATE INDEX IF NOT EXISTS "JournalLine.account_idx" ON "JournalLine"("accountId");

-- Invoice Line Items indexes
CREATE INDEX IF NOT EXISTS "InvoiceLine.invoice_idx" ON "InvoiceLine"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceLine.product_idx" ON "InvoiceLine"("productId");

-- Purchase Line Items indexes
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceLine.purchase_idx" ON "PurchaseInvoiceLine"("purchaseInvoiceId");
CREATE INDEX IF NOT EXISTS "PurchaseInvoiceLine.product_idx" ON "PurchaseInvoiceLine"("productId");

-- Withholding Tax indexes
CREATE INDEX IF NOT EXISTS "WithholdingTax.company_idx" ON "WithholdingTax"("companyId");
CREATE INDEX IF NOT EXISTS "WithholdingTax.pndType_idx" ON "WithholdingTax"(type);
CREATE INDEX IF NOT EXISTS "WithholdingTax.taxYear_idx" ON "WithholdingTax"(taxYear);
CREATE INDEX IF NOT EXISTS "WithholdingTax.year_type_idx" ON "WithholdingTax"(taxYear, type);

-- User indexes
CREATE INDEX IF NOT EXISTS "User.email_idx" ON "User"(email);
CREATE INDEX IF NOT EXISTS "User.role_idx" ON "User"(role);

-- Activity Log indexes
CREATE INDEX IF NOT EXISTS "ActivityLog.user_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog.action_idx" ON "ActivityLog"(action);
CREATE INDEX IF NOT EXISTS "ActivityLog.timestamp_idx" ON "ActivityLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog.user_action_idx" ON "ActivityLog"("userId", action);
