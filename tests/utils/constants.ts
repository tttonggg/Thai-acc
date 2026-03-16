/**
 * Test constants for E2E testing
 * Provides centralized configuration for test credentials, URLs, timeouts, and selectors
 */

/**
 * Test user credentials
 */
export const TEST_USERS = {
  ADMIN: {
    email: 'admin@thaiaccounting.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  ACCOUNTANT: {
    email: 'accountant@thaiaccounting.com',
    password: 'acc123',
    role: 'ACCOUNTANT'
  },
  USER: {
    email: 'user@thaiaccounting.com',
    password: 'user123',
    role: 'USER'
  },
  VIEWER: {
    email: 'viewer@thaiaccounting.com',
    password: 'viewer123',
    role: 'VIEWER'
  }
} as const;

/**
 * Application URLs
 */
export const URLs = {
  BASE: 'http://localhost:3000',

  // Auth
  LOGIN: '/login',
  LOGOUT: '/api/auth/signout',

  // Main pages
  DASHBOARD: '/',

  // Accounting modules
  ACCOUNTS: '/accounts',
  JOURNAL: '/journal',
  INVOICES: '/invoices',
  RECEIPTS: '/receipts',
  PAYMENTS: '/payments',

  // Master data
  CUSTOMERS: '/customers',
  VENDORS: '/vendors',
  PRODUCTS: '/products',

  // Tax modules
  VAT: '/vat',
  WHT: '/wht',

  // Expansion modules
  INVENTORY: '/inventory',
  BANKING: '/banking',
  ASSETS: '/assets',
  PAYROLL: '/payroll',
  PETTY_CASH: '/petty-cash',

  // Reports
  REPORTS: '/reports',

  // Settings
  SETTINGS: '/settings',
  USERS: '/users'
} as const;

/**
 * Test timeouts in milliseconds
 */
export const TIMEOUTS = {
  SHORT: 1000,      // 1 second - quick operations
  MEDIUM: 5000,     // 5 seconds - normal operations
  LONG: 10000,      // 10 seconds - slow operations
  XLONG: 30000,     // 30 seconds - very slow operations
  DB_OPERATION: 5000, // Database operations
  NAVIGATION: 5000,   // Page navigation
  TOAST: 3000,        // Toast notifications
  NETWORK: 10000      // Network requests
} as const;

/**
 * Common CSS selectors
 */
export const SELECTORS = {
  // Common UI elements
  TOAST: '[data-sonner-toast]',
  TOAST_TITLE: '[data-sonner-toast] [data-title]',
  TOAST_MESSAGE: '[data-sonner-toast] [data-description]',
  BUTTON: 'button',
  INPUT: 'input',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  TABLE: 'table',
  TABLE_BODY: 'tbody',
  TABLE_ROW: 'tr',
  TABLE_CELL: 'td',
  DIALOG: '[role="dialog"]',
  DIALOG_TITLE: '[role="dialog"] [data-dialog-title]',
  SIDEBAR: '[data-sidebar]',
  HEADER: 'header',

  // Forms
  FORM: 'form',
  LABEL: 'label',
  SUBMIT_BUTTON: 'button[type="submit"]',
  CANCEL_BUTTON: 'button[form="novalidate"]',

  // Navigation
  NAV_LINK: 'a[href]',
  SIDEBAR_ITEM: '[data-sidebar-item]',

  // Data display
  CARD: '[data-card]',
  BADGE: '[data-badge]',
  STATUS: '[data-status]',

  // Specific module selectors
  DATA_TABLE: '[data-table]',
  DATA_TABLE_ROW: '[data-table-row]',
  DATA_TABLE_CELL: '[data-table-cell]',

  // Loading states
  LOADING: '[data-loading]',
  SPINNER: '[data-spinner]',

  // Empty states
  EMPTY_STATE: '[data-empty-state]',
  NO_DATA: '[data-no-data]'
} as const;

/**
 * Test data constants
 */
export const TEST_DATA = {
  // Account types
  ACCOUNT_TYPES: {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE'
  },

  // Document statuses
  DOCUMENT_STATUS: {
    DRAFT: 'DRAFT',
    ISSUED: 'ISSUED',
    POSTED: 'POSTED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    REVERSED: 'REVERSED'
  },

  // VAT rates
  VAT_RATE: 0.07,

  // WHT rates
  WHT_RATES: {
    PND3: [0, 5, 10, 15, 20, 25, 30, 35],
    PND53: {
      service: 3,
      rent: 5,
      professional: 3,
      contract: 1,
      advertising: 2
    }
  },

  // SSC rates
  SSC_RATE: 0.05,
  SSC_MAX: 750,

  // Test amounts
  AMOUNTS: {
    SMALL: 1000,
    MEDIUM: 10000,
    LARGE: 100000,
    XLARGE: 1000000
  }
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  UNAUTHORIZED: 'คุณไม่มีสิทธิ์เข้าถึง',
  SESSION_EXPIRED: 'เซสชันหมดอายุ',

  // Validation
  REQUIRED_FIELD: 'กรุณากรอกข้อมูล',
  INVALID_FORMAT: 'รูปแบบไม่ถูกต้อง',
  INVALID_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',

  // Business logic
  INSUFFICIENT_STOCK: 'สต็อกไม่เพียงพอ',
  INSUFFICIENT_BALANCE: 'ยอดเงินไม่เพียงพอ',
  ALREADY_EXISTS: 'ข้อมูลนี้มีอยู่แล้ว',
  NOT_FOUND: 'ไม่พบข้อมูล',

  // Database
  RECORD_NOT_FOUND: 'ไม่พบข้อมูลที่ค้นหา',
  DUPLICATE_RECORD: 'ข้อมูลซ้ำ'
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'สร้างสำเร็จ',
  UPDATED: 'อัปเดตสำเร็จ',
  DELETED: 'ลบสำเร็จ',
  POSTED: 'ลงบัญชีแล้ว',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธแล้ว'
} as const;

/**
 * Sample test data
 */
export const SAMPLE_DATA = {
  customer: {
    name: 'Test Customer',
    taxId: '1234567890123',
    email: 'test@example.com',
    phone: '0812345678',
    address: '123 Test Street',
    province: 'Bangkok',
    postcode: '10100',
    creditLimit: 50000
  },

  vendor: {
    name: 'Test Vendor',
    taxId: '9876543210987',
    email: 'vendor@example.com',
    phone: '0898765432',
    address: '456 Vendor Road',
    province: 'Bangkok',
    postcode: '10200',
    paymentTerms: 30
  },

  product: {
    name: 'Test Product',
    code: 'TEST001',
    unit: 'pcs',
    price: 1000,
    cost: 500,
    vatType: 'EXCLUSIVE'
  },

  invoice: {
    customerId: null, // To be filled
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{
      productId: null, // To be filled
      quantity: 10,
      price: 1000
    }]
  }
} as const;
