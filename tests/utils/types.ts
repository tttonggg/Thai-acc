/**
 * TypeScript Types for E2E Test Utilities
 *
 * Provides type definitions for test utilities to ensure type safety
 * and better IDE autocomplete support.
 */

import type { Page, Locator } from '@playwright/test';
import type { PrismaClient } from '@prisma/client';

// ============================================================================
// User Role Types
// ============================================================================

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER';

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
}

export interface TestUsers {
  ADMIN: TestUser;
  ACCOUNTANT: TestUser;
  USER: TestUser;
  VIEWER: TestUser;
}

// ============================================================================
// Test Context Types
// ============================================================================

export interface TestContext {
  page: Page;
  cleanup: () => Promise<void>;
}

export interface TestContextWithDb extends TestContext {
  testIds: TestDataIds;
}

// ============================================================================
// Test Data Types
// ============================================================================

export interface TestDataIds {
  customerId: string;
  vendorId: string;
  productId: string;
  warehouseId: string;
  cashAccountId: string;
  bankAccountId: string;
  arAccountId: string;
  apAccountId: string;
}

export interface CustomerOverrides {
  id?: string;
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  province?: string;
  postcode?: string;
  country?: string;
  creditLimit?: number;
  paymentTerms?: number;
  accountId?: string;
  active?: boolean;
}

export interface VendorOverrides {
  id?: string;
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  province?: string;
  postcode?: string;
  country?: string;
  paymentTerms?: number;
  accountId?: string;
  active?: boolean;
}

export interface ProductOverrides {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  cost?: number;
  vatType?: 'EXCLUSIVE' | 'INCLUSIVE' | 'NONE' | 'ZERO';
  accountId?: string;
  expenseAccountId?: string;
  assetAccountId?: string;
  incomeType?: string | null;
  whtRate?: number | null;
  active?: boolean;
}

export interface InvoiceItemOverrides {
  productId?: string;
  quantity?: number;
  price?: number;
  discount?: number;
  vatRate?: number;
  vatAmount?: number;
  total?: number;
  description?: string;
}

export interface InvoiceOverrides {
  id?: string;
  customerId?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  subtotal?: number;
  discountAmount?: number;
  vatAmount?: number;
  total?: number;
  status?: string;
  notes?: string;
  journalEntryId?: string | null;
  items?: InvoiceItemOverrides[];
}

export interface ReceiptItemOverrides {
  invoiceId?: string | null;
  amount?: number;
  discountAmount?: number;
}

export interface ReceiptOverrides {
  id?: string;
  receiptNumber?: string;
  receiptDate?: Date;
  customerId?: string;
  amount?: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT_CARD';
  bankAccount?: string | null;
  chequeNumber?: string | null;
  chequeDate?: Date | null;
  reference?: string;
  notes?: string;
  journalEntryId?: string | null;
  items?: ReceiptItemOverrides[];
}

export interface PaymentItemOverrides {
  purchaseInvoiceId?: string | null;
  amount?: number;
  discountAmount?: number;
}

export interface PaymentOverrides {
  id?: string;
  paymentNumber?: string;
  paymentDate?: Date;
  vendorId?: string;
  amount?: number;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  bankAccount?: string | null;
  chequeNumber?: string | null;
  chequeDate?: Date | null;
  reference?: string;
  notes?: string;
  journalEntryId?: string | null;
  whtAmount?: number;
  whtBase?: number;
  items?: PaymentItemOverrides[];
}

export interface WarehouseOverrides {
  id?: string;
  name?: string;
  code?: string;
  address?: string;
  district?: string;
  province?: string;
  postcode?: string;
  active?: boolean;
}

export interface PettyCashFundOverrides {
  id?: string;
  fundCode?: string;
  name?: string;
  custodian?: string;
  balance?: number;
  maxBalance?: number;
  replenishLevel?: number;
  bankAccountId?: string;
  active?: boolean;
}

export interface TestScenario {
  customer: any;
  vendor: any;
  products: any[];
  warehouse: any;
  invoice: any;
  receipt: any;
  payment: any;
}

// ============================================================================
// Database Verification Types
// ============================================================================

export type ModelName =
  | 'user'
  | 'customer'
  | 'vendor'
  | 'product'
  | 'warehouse'
  | 'invoice'
  | 'invoiceItem'
  | 'receipt'
  | 'receiptItem'
  | 'payment'
  | 'paymentItem'
  | 'purchaseInvoice'
  | 'purchaseInvoiceItem'
  | 'journalEntry'
  | 'journalLine'
  | 'chartOfAccount'
  | 'stockMovement'
  | 'stockBalance'
  | 'pettyCashFund'
  | 'pettyCashVoucher'
  | 'bankAccount'
  | 'cheque'
  | 'asset'
  | 'depreciationSchedule'
  | 'employee'
  | 'payrollRun'
  | 'payroll';

export type DocumentType =
  | 'invoice'
  | 'receipt'
  | 'payment'
  | 'purchaseInvoice'
  | 'pettyCashVoucher';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type DocumentStatus = 'DRAFT' | 'ISSUED' | 'POSTED' | 'PAID' | 'CANCELLED' | 'REVERSED';

// ============================================================================
// Form Field Types
// ============================================================================

export interface FormFieldData {
  [label: string]: string | number | boolean | undefined;
}

export interface FormFillOptions {
  timeout?: number;
  clearFirst?: boolean;
}

// ============================================================================
// Table Types
// ============================================================================

export interface TableRowData {
  [columnName: string]: string;
}

export interface TableFindOptions {
  exactMatch?: boolean;
  caseSensitive?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// UI Interaction Types
// ============================================================================

export interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  modifiers?: {
    alt?: boolean;
    control?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
  };
}

export interface FillOptions {
  timeout?: number;
  clearFirst?: boolean;
}

export interface WaitForOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}

// ============================================================================
// Toast Notification Types
// ============================================================================

export interface ToastMessage {
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

// ============================================================================
// Setup Options Types
// ============================================================================

export interface SetupTestOptions {
  bypassRateLimit?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  storageState?: string;
}

// ============================================================================
// Retry Options Types
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
  exponential?: boolean;
}

// ============================================================================
// Screenshot Options Types
// ============================================================================

export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  type?: 'png' | 'jpeg';
  quality?: number;
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  timeout?: number;
}

// ============================================================================
// Test Helper Return Types
// ============================================================================

export type WaitForApiResponseResult<T = any> = Promise<T>;

export type VerifyResult = Promise<boolean>;

export type RecordCount = Promise<number>;

export type RecordData<T = any> = Promise<T | null>;

export type AllRecords<T = any> = Promise<T[]>;

// ============================================================================
// Utility Function Types
// ============================================================================

export type SleepFunction = (ms: number) => Promise<void>;

export type RetryFunction<T = any> = (
  fn: () => Promise<T>,
  maxRetries?: number,
  delay?: number
) => Promise<T>;

export type FormatDateFunction = (date: Date) => string;

export type FormatCurrencyFunction = (amount: number) => string;

// ============================================================================
// Test Module Types
// ============================================================================

export interface TestModule {
  name: string;
  path: string;
  permissions: UserRole[];
}

export const TEST_MODULES: TestModule[] = [
  { name: 'Dashboard', path: '/', permissions: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] },
  { name: 'Accounts', path: '/accounts', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Journal', path: '/journal', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Invoices', path: '/invoices', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Receipts', path: '/receipts', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Payments', path: '/payments', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Customers', path: '/customers', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Vendors', path: '/vendors', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Products', path: '/products', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'VAT', path: '/vat', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'WHT', path: '/wht', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Inventory', path: '/inventory', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Banking', path: '/banking', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Assets', path: '/assets', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Payroll', path: '/payroll', permissions: ['ADMIN', 'ACCOUNTANT'] },
  { name: 'Petty Cash', path: '/petty-cash', permissions: ['ADMIN', 'ACCOUNTANT', 'USER'] },
  { name: 'Reports', path: '/reports', permissions: ['ADMIN', 'ACCOUNTANT', 'VIEWER'] },
  { name: 'Settings', path: '/settings', permissions: ['ADMIN'] },
  { name: 'Users', path: '/users', permissions: ['ADMIN'] },
];

// ============================================================================
// Assertion Helper Types
// ============================================================================

export interface AssertionOptions {
  timeout?: number;
  message?: string;
}

export interface VerifyTextOptions extends AssertionOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface VerifyCountOptions extends AssertionOptions {
  greaterThan?: number;
  lessThan?: number;
  greaterThanOrEqual?: number;
  lessThanOrEqual?: number;
}

// ============================================================================
// Performance Measurement Types
// ============================================================================

export interface PerformanceMetric {
  name: string;
  duration: number;
  threshold?: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  totalDuration: number;
  passed: boolean;
}

// ============================================================================
// Debug Types
// ============================================================================

export interface DebugInfo {
  url: string;
  timestamp: string;
  screenshot?: string;
  consoleLogs?: string[];
  networkRequests?: string[];
}

// ============================================================================
// Export All Types
// ============================================================================

export type { Page, Locator, PrismaClient };
