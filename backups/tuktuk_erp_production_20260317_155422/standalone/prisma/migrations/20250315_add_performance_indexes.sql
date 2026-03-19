-- Thai Accounting ERP - Performance Optimization Migration
-- Date: 2025-03-15
-- Purpose: Add indexes for improved query performance and prevent DoS attacks

-- Add single-column indexes for common filter criteria
CREATE INDEX IF NOT EXISTS "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate" DESC);
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");

CREATE INDEX IF NOT EXISTS "JournalEntry_date_idx" ON "JournalEntry"("date" DESC);
CREATE INDEX IF NOT EXISTS "JournalEntry_status_idx" ON "JournalEntry"("status");
CREATE INDEX IF NOT EXISTS "JournalEntry_entryNo_idx" ON "JournalEntry"("entryNo");

CREATE INDEX IF NOT EXISTS "Receipt_receiptDate_idx" ON "Receipt"("receiptDate" DESC);
CREATE INDEX IF NOT EXISTS "Receipt_status_idx" ON "Receipt"("status");
CREATE INDEX IF NOT EXISTS "Receipt_customerId_idx" ON "Receipt"("customerId");

CREATE INDEX IF NOT EXISTS "Payment_paymentDate_idx" ON "Payment"("paymentDate" DESC);
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_vendorId_idx" ON "Payment"("vendorId");

CREATE INDEX IF NOT EXISTS "Customer_code_idx" ON "Customer"("code");
CREATE INDEX IF NOT EXISTS "Customer_isActive_idx" ON "Customer"("isActive");

CREATE INDEX IF NOT EXISTS "Vendor_code_idx" ON "Vendor"("code");
CREATE INDEX IF NOT EXISTS "Vendor_isActive_idx" ON "Vendor"("isActive");

CREATE INDEX IF NOT EXISTS "Product_code_idx" ON "Product"("code");
CREATE INDEX IF NOT EXISTS "Product_isActive_idx" ON "Product"("isActive");

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "Invoice_customer_status_idx" ON "Invoice"("customerId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_date_status_idx" ON "Invoice"("invoiceDate" DESC, "status");

CREATE INDEX IF NOT EXISTS "JournalEntry_date_status_idx" ON "JournalEntry"("date" DESC, "status");
CREATE INDEX IF NOT EXISTS "JournalEntry_createdAt_idx" ON "JournalEntry"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Receipt_customer_status_idx" ON "Receipt"("customerId", "status");
CREATE INDEX IF NOT EXISTS "Receipt_date_status_idx" ON "Receipt"("receiptDate" DESC, "status");

CREATE INDEX IF NOT EXISTS "Payment_vendor_status_idx" ON "Payment"("vendorId", "status");
CREATE INDEX IF NOT EXISTS "Payment_date_status_idx" ON "Payment"("paymentDate" DESC, "status");

-- Add indexes for chart of accounts queries
CREATE INDEX IF NOT EXISTS "ChartOfAccount_code_idx" ON "ChartOfAccount"("code");
CREATE INDEX IF NOT EXISTS "ChartOfAccount_type_idx" ON "ChartOfAccount"("type");
CREATE INDEX IF NOT EXISTS "ChartOfAccount_parentId_idx" ON "ChartOfAccount"("parentId");
CREATE INDEX IF NOT EXISTS "ChartOfAccount_isActive_idx" ON "ChartOfAccount"("isActive");

-- Add indexes for stock movements
CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_date_idx" ON "StockMovement"("date" DESC);
CREATE INDEX IF NOT EXISTS "StockMovement_warehouseId_idx" ON "StockMovement"("warehouseId");

-- Add indexes for audit trail
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("createdById");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_idx" ON "ActivityLog"("action");

-- Add indexes for document tracking
CREATE INDEX IF NOT EXISTS "DocumentNumber_type_idx" ON "DocumentNumber"("type");
CREATE INDEX IF NOT EXISTS "DocumentNumber_prefix_idx" ON "DocumentNumber"("prefix");

-- Analyze tables to update statistics
ANALYZE "Invoice";
ANALYZE "JournalEntry";
ANALYZE "Receipt";
ANALYZE "Payment";
ANALYZE "Customer";
ANALYZE "Vendor";
ANALYZE "ChartOfAccount";
ANALYZE "Product";
ANALYZE "StockMovement";
ANALYZE "ActivityLog";
ANALYZE "DocumentNumber";
