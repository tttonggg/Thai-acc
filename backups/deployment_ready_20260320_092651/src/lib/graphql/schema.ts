/**
 * GraphQL Schema for Thai Accounting ERP
 * Phase D: API Mastery - GraphQL Layer
 */

export const typeDefs = `#graphql
  # ============================================
  # Scalars
  # ============================================
  scalar DateTime
  scalar JSON
  scalar Decimal

  # ============================================
  # Enums
  # ============================================
  enum InvoiceStatus {
    DRAFT
    ISSUED
    PARTIAL
    PAID
    CANCELLED
  }

  enum InvoiceType {
    TAX_INVOICE
    RECEIPT
    DELIVERY_NOTE
    CREDIT_NOTE
    DEBIT_NOTE
  }

  enum EntryStatus {
    DRAFT
    POSTED
    REVERSED
  }

  enum AccountType {
    ASSET
    LIABILITY
    EQUITY
    REVENUE
    EXPENSE
  }

  enum PaymentMethod {
    CASH
    CHEQUE
    TRANSFER
    CREDIT
    OTHER
  }

  enum UserRole {
    ADMIN
    ACCOUNTANT
    USER
    VIEWER
  }

  enum ProductType {
    PRODUCT
    SERVICE
  }

  enum VatType {
    EXCLUSIVE
    INCLUSIVE
    NONE
  }

  # ============================================
  # Interfaces
  # ============================================
  interface Node {
    id: ID!
  }

  interface Timestamped {
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ============================================
  # Types
  # ============================================
  type Company implements Node & Timestamped {
    id: ID!
    name: String!
    nameEn: String
    taxId: String
    branchCode: String
    address: String
    phone: String
    email: String
    website: String
    fiscalYearStart: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ChartOfAccount implements Node & Timestamped {
    id: ID!
    code: String!
    name: String!
    nameEn: String
    type: AccountType!
    level: Int!
    parent: ChartOfAccount
    children: [ChartOfAccount!]!
    isDetail: Boolean!
    isSystem: Boolean!
    isActive: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    balance: Decimal
  }

  type JournalEntry implements Node & Timestamped {
    id: ID!
    entryNo: String!
    date: DateTime!
    description: String
    reference: String
    documentType: String
    documentId: String
    totalDebit: Int!
    totalCredit: Int!
    status: EntryStatus!
    isAdjustment: Boolean!
    isReversing: Boolean!
    lines: [JournalLine!]!
    createdById: String
    approvedById: String
    approvedAt: DateTime
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type JournalLine implements Node {
    id: ID!
    lineNo: Int!
    account: ChartOfAccount!
    description: String
    debit: Int!
    credit: Int!
    reference: String
  }

  type Customer implements Node & Timestamped {
    id: ID!
    code: String!
    name: String!
    nameEn: String
    taxId: String
    branchCode: String
    address: String
    phone: String
    email: String
    contactName: String
    creditLimit: Int!
    creditDays: Int!
    isActive: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    invoices: [Invoice!]!
    totalReceivables: Int!
  }

  type Vendor implements Node & Timestamped {
    id: ID!
    code: String!
    name: String!
    nameEn: String
    taxId: String
    branchCode: String
    address: String
    phone: String
    email: String
    contactName: String
    creditDays: Int!
    isActive: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    purchaseInvoices: [PurchaseInvoice!]!
    totalPayables: Int!
  }

  type Product implements Node & Timestamped {
    id: ID!
    code: String!
    name: String!
    nameEn: String
    description: String
    category: String
    unit: String!
    type: ProductType!
    salePrice: Int!
    costPrice: Int!
    vatRate: Float!
    vatType: VatType!
    isInventory: Boolean!
    quantity: Float!
    minQuantity: Float!
    isActive: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Invoice implements Node & Timestamped {
    id: ID!
    invoiceNo: String!
    invoiceDate: DateTime!
    dueDate: DateTime
    customer: Customer!
    type: InvoiceType!
    reference: String
    poNumber: String
    subtotal: Int!
    vatRate: Float!
    vatAmount: Int!
    totalAmount: Int!
    discountAmount: Int!
    discountPercent: Float!
    withholdingRate: Float!
    withholdingAmount: Int!
    netAmount: Int!
    paidAmount: Int!
    status: InvoiceStatus!
    notes: String
    internalNotes: String
    lines: [InvoiceLine!]!
    journalEntry: JournalEntry
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type InvoiceLine implements Node {
    id: ID!
    lineNo: Int!
    product: Product
    description: String!
    quantity: Float!
    unit: String!
    unitPrice: Int!
    discount: Int!
    amount: Int!
    vatRate: Float!
    vatAmount: Int!
  }

  type PurchaseInvoice implements Node & Timestamped {
    id: ID!
    invoiceNo: String!
    vendorInvoiceNo: String
    invoiceDate: DateTime!
    dueDate: DateTime
    vendor: Vendor!
    subtotal: Int!
    vatRate: Float!
    vatAmount: Int!
    totalAmount: Int!
    discountAmount: Int!
    withholdingRate: Float!
    withholdingAmount: Int!
    netAmount: Int!
    paidAmount: Int!
    status: InvoiceStatus!
    notes: String
    lines: [PurchaseInvoiceLine!]!
    journalEntry: JournalEntry
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PurchaseInvoiceLine implements Node {
    id: ID!
    lineNo: Int!
    product: Product
    description: String!
    quantity: Float!
    unit: String!
    unitPrice: Int!
    discount: Int!
    amount: Int!
    vatRate: Float!
    vatAmount: Int!
  }

  type Receipt implements Node & Timestamped {
    id: ID!
    receiptNo: String!
    receiptDate: DateTime!
    customer: Customer!
    paymentMethod: PaymentMethod!
    bankAccount: BankAccount
    chequeNo: String
    chequeDate: DateTime
    amount: Int!
    whtAmount: Int!
    unallocated: Int!
    status: String!
    notes: String
    allocations: [ReceiptAllocation!]!
    journalEntry: JournalEntry
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ReceiptAllocation implements Node {
    id: ID!
    invoice: Invoice!
    amount: Int!
    whtRate: Float!
    whtAmount: Int!
  }

  type Payment implements Node & Timestamped {
    id: ID!
    paymentNo: String!
    paymentDate: DateTime!
    vendor: Vendor!
    paymentMethod: PaymentMethod!
    bankAccount: BankAccount
    chequeNo: String
    chequeDate: DateTime
    amount: Int!
    whtAmount: Int!
    unallocated: Int!
    status: String!
    notes: String
    allocations: [PaymentAllocation!]!
    journalEntry: JournalEntry
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PaymentAllocation implements Node {
    id: ID!
    invoice: PurchaseInvoice!
    amount: Int!
    whtRate: Float!
    whtAmount: Int!
  }

  type BankAccount implements Node & Timestamped {
    id: ID!
    code: String!
    bankName: String!
    branchName: String!
    accountNumber: String!
    accountName: String!
    glAccountId: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Employee implements Node & Timestamped {
    id: ID!
    employeeCode: String!
    firstName: String!
    lastName: String!
    idCardNumber: String
    hireDate: DateTime!
    baseSalary: Int!
    position: String
    department: String
    socialSecurityNo: String
    taxId: String
    bankAccountNo: String
    bankName: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type User implements Node & Timestamped {
    id: ID!
    email: String!
    name: String
    role: UserRole!
    isActive: Boolean!
    lastLoginAt: DateTime
    mfaEnabled: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WebhookSubscription implements Node & Timestamped {
    id: ID!
    name: String!
    url: String!
    events: [String!]!
    isActive: Boolean!
    retryCount: Int!
    lastTriggered: DateTime
    lastError: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ApiAnalytics implements Node {
    id: ID!
    timestamp: DateTime!
    method: String!
    path: String!
    statusCode: Int!
    duration: Int!
    userId: String
    ipAddress: String!
    userAgent: String
  }

  # ============================================
  # Connection Types (for pagination)
  # ============================================
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalCount: Int!
  }

  type InvoiceConnection {
    edges: [InvoiceEdge!]!
    pageInfo: PageInfo!
  }

  type InvoiceEdge {
    node: Invoice!
    cursor: String!
  }

  type CustomerConnection {
    edges: [CustomerEdge!]!
    pageInfo: PageInfo!
  }

  type CustomerEdge {
    node: Customer!
    cursor: String!
  }

  type JournalEntryConnection {
    edges: [JournalEntryEdge!]!
    pageInfo: PageInfo!
  }

  type JournalEntryEdge {
    node: JournalEntry!
    cursor: String!
  }

  # ============================================
  # Input Types
  # ============================================
  input CreateInvoiceInput {
    customerId: ID!
    invoiceDate: DateTime!
    dueDate: DateTime
    reference: String
    poNumber: String
    notes: String
    internalNotes: String
    lines: [CreateInvoiceLineInput!]!
    vatRate: Float
    discountAmount: Int
    discountPercent: Float
  }

  input CreateInvoiceLineInput {
    productId: ID
    description: String!
    quantity: Float!
    unit: String
    unitPrice: Int!
    discount: Int
    vatRate: Float
  }

  input UpdateInvoiceInput {
    invoiceDate: DateTime
    dueDate: DateTime
    reference: String
    poNumber: String
    notes: String
    internalNotes: String
  }

  input CreateJournalEntryInput {
    date: DateTime!
    description: String
    reference: String
    lines: [CreateJournalLineInput!]!
  }

  input CreateJournalLineInput {
    accountId: ID!
    description: String
    debit: Int
    credit: Int
  }

  input CreateCustomerInput {
    code: String
    name: String!
    nameEn: String
    taxId: String
    branchCode: String
    address: String
    phone: String
    email: String
    contactName: String
    creditLimit: Int
    creditDays: Int
    notes: String
  }

  input CreateProductInput {
    code: String
    name: String!
    nameEn: String
    description: String
    category: String
    unit: String
    type: ProductType
    salePrice: Int
    costPrice: Int
    vatRate: Float
    vatType: VatType
    isInventory: Boolean
    minQuantity: Float
    notes: String
  }

  input CreateWebhookInput {
    name: String!
    url: String!
    events: [String!]!
    secret: String
  }

  input UpdateWebhookInput {
    name: String
    url: String
    events: [String!]
    isActive: Boolean
  }

  # ============================================
  # Query Complexity
  # ============================================
  enum Complexity {
    LOW
    MEDIUM
    HIGH
  }

  directive @complexity(value: Complexity!) on FIELD_DEFINITION

  # ============================================
  # Queries
  # ============================================
  type Query {
    # Node query for Relay-style fetching
    node(id: ID!): Node
    
    # Company
    company: Company
    
    # User
    me: User
    user(id: ID!): User
    users: [User!]!
    
    # Chart of Accounts
    accounts(type: AccountType, isActive: Boolean): [ChartOfAccount!]!
    account(id: ID!): ChartOfAccount
    accountByCode(code: String!): ChartOfAccount
    
    # Journal Entries
    journalEntries(
      page: Int = 1
      limit: Int = 20
      status: EntryStatus
      startDate: DateTime
      endDate: DateTime
    ): JournalEntryConnection! @complexity(value: MEDIUM)
    journalEntry(id: ID!): JournalEntry
    
    # Invoices
    invoices(
      page: Int = 1
      limit: Int = 20
      status: InvoiceStatus
      customerId: ID
      startDate: DateTime
      endDate: DateTime
    ): InvoiceConnection! @complexity(value: MEDIUM)
    invoice(id: ID!): Invoice
    invoiceByNumber(invoiceNo: String!): Invoice
    
    # Customers
    customers(
      page: Int = 1
      limit: Int = 20
      isActive: Boolean
    ): CustomerConnection! @complexity(value: LOW)
    customer(id: ID!): Customer
    customerByCode(code: String!): Customer
    
    # Vendors
    vendors(isActive: Boolean): [Vendor!]!
    vendor(id: ID!): Vendor
    
    # Products
    products(type: ProductType, isActive: Boolean): [Product!]!
    product(id: ID!): Product
    productByCode(code: String!): Product
    
    # Purchase Invoices
    purchaseInvoices(status: InvoiceStatus): [PurchaseInvoice!]!
    purchaseInvoice(id: ID!): PurchaseInvoice
    
    # Receipts
    receipts: [Receipt!]!
    receipt(id: ID!): Receipt
    
    # Payments
    payments: [Payment!]!
    payment(id: ID!): Payment
    
    # Bank Accounts
    bankAccounts: [BankAccount!]!
    bankAccount(id: ID!): BankAccount
    
    # Employees
    employees(isActive: Boolean): [Employee!]!
    employee(id: ID!): Employee
    
    # Webhooks
    webhooks: [WebhookSubscription!]!
    webhook(id: ID!): WebhookSubscription
    webhookEvents: [String!]!
    
    # Analytics
    apiAnalytics(
      startDate: DateTime!
      endDate: DateTime!
      path: String
    ): [ApiAnalytics!]! @complexity(value: HIGH)
    
    apiMetrics: ApiMetrics!
  }

  type ApiMetrics {
    totalRequests: Int!
    requestsPerMinute: Float!
    errorRate: Float!
    averageDuration: Float!
    p50: Float!
    p95: Float!
    p99: Float!
    topUsers: [UserMetric!]!
    topPaths: [PathMetric!]!
  }

  type UserMetric {
    userId: String
    userName: String
    requestCount: Int!
  }

  type PathMetric {
    path: String!
    requestCount: Int!
    averageDuration: Float!
  }

  # ============================================
  # Mutations
  # ============================================
  type Mutation {
    # Invoice mutations
    createInvoice(input: CreateInvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!
    issueInvoice(id: ID!): Invoice!
    voidInvoice(id: ID!, reason: String): Invoice!
    deleteInvoice(id: ID!): Boolean!
    
    # Journal Entry mutations
    createJournalEntry(input: CreateJournalEntryInput!): JournalEntry!
    postJournalEntry(id: ID!): JournalEntry!
    reverseJournalEntry(id: ID!, reason: String): JournalEntry!
    deleteJournalEntry(id: ID!): Boolean!
    
    # Customer mutations
    createCustomer(input: CreateCustomerInput!): Customer!
    updateCustomer(id: ID!, input: CreateCustomerInput!): Customer!
    deleteCustomer(id: ID!): Boolean!
    
    # Product mutations
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: CreateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # Webhook mutations
    createWebhook(input: CreateWebhookInput!): WebhookSubscription!
    updateWebhook(id: ID!, input: UpdateWebhookInput!): WebhookSubscription!
    deleteWebhook(id: ID!): Boolean!
    testWebhook(id: ID!): WebhookTestResult!
    
    # User mutations (Admin only)
    updateUserRole(id: ID!, role: UserRole!): User!
    deactivateUser(id: ID!): User!
  }

  type WebhookTestResult {
    success: Boolean!
    statusCode: Int
    responseTime: Int
    error: String
  }

  # ============================================
  # Subscriptions (for real-time updates)
  # ============================================
  type Subscription {
    invoiceCreated: Invoice!
    invoiceUpdated(id: ID!): Invoice!
    journalEntryPosted: JournalEntry!
    receiptCreated: Receipt!
    paymentCreated: Payment!
  }
`;
