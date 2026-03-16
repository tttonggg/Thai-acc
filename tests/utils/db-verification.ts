/**
 * Database Verification Utilities for E2E Testing
 *
 * Provides utilities to verify database state during and after E2E tests.
 * All functions use Prisma client for direct database access.
 */

import { PrismaClient } from '@prisma/client';

// Prisma client singleton for tests
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error']
    });
  }
  return prisma;
}

/**
 * Disconnect Prisma client (call this in test teardown)
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Verify the count of records in a model
 *
 * @param model - Prisma model name (e.g., 'user', 'customer', 'invoice')
 * @param expected - Expected count
 * @returns true if count matches, false otherwise
 */
export async function verifyRecordCount(
  model: string,
  expected: number
): Promise<boolean> {
  try {
    const prisma = getPrisma();
    const modelKey = model.charAt(0).toLowerCase() + model.slice(1) as keyof PrismaClient;
    const modelClient = (prisma as any)[modelKey];

    if (typeof modelClient?.count !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    const actual = await modelClient.count();
    return actual === expected;
  } catch (error) {
    console.error(`Error verifying record count for ${model}:`, error);
    return false;
  }
}

/**
 * Verify that a record exists
 *
 * @param model - Prisma model name
 * @param id - Record ID
 * @returns true if record exists, false otherwise
 */
export async function verifyRecordExists(
  model: string,
  id: string
): Promise<boolean> {
  try {
    const prisma = getPrisma();
    const modelKey = model.charAt(0).toLowerCase() + model.slice(1) as keyof PrismaClient;
    const modelClient = (prisma as any)[modelKey];

    if (typeof modelClient?.findUnique !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    const record = await modelClient.findUnique({
      where: { id }
    });

    return record !== null;
  } catch (error) {
    console.error(`Error verifying record exists for ${model}:`, error);
    return false;
  }
}

/**
 * Verify that a record has specific field values
 *
 * @param model - Prisma model name
 * @param id - Record ID
 * @param values - Object containing field names and expected values
 * @returns true if all values match, false otherwise
 */
export async function verifyRecordValues(
  model: string,
  id: string,
  values: Record<string, any>
): Promise<boolean> {
  try {
    const prisma = getPrisma();
    const modelKey = model.charAt(0).toLowerCase() + model.slice(1) as keyof PrismaClient;
    const modelClient = (prisma as any)[modelKey];

    if (typeof modelClient?.findUnique !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    const record = await modelClient.findUnique({
      where: { id }
    });

    if (!record) {
      return false;
    }

    for (const [field, expectedValue] of Object.entries(values)) {
      const actualValue = (record as any)[field];

      // Handle date comparison
      if (expectedValue instanceof Date) {
        if (!(actualValue instanceof Date) || actualValue.getTime() !== expectedValue.getTime()) {
          console.log(`Field ${field}: expected ${expectedValue}, got ${actualValue}`);
          return false;
        }
      }
      // Handle nested objects (JSON fields)
      else if (typeof expectedValue === 'object') {
        if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
          console.log(`Field ${field}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
          return false;
        }
      }
      // Handle direct comparison
      else {
        if (actualValue !== expectedValue) {
          console.log(`Field ${field}: expected ${expectedValue}, got ${actualValue}`);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error verifying record values for ${model}:`, error);
    return false;
  }
}

/**
 * Verify that a record was deleted
 *
 * @param model - Prisma model name
 * @param id - Record ID
 * @returns true if record does not exist, false otherwise
 */
export async function verifyRecordDeleted(
  model: string,
  id: string
): Promise<boolean> {
  const exists = await verifyRecordExists(model, id);
  return !exists;
}

/**
 * Get the count of records in a model
 *
 * @param model - Prisma model name
 * @returns Number of records
 */
export async function getRecordCount(model: string): Promise<number> {
  try {
    const prisma = getPrisma();
    const modelKey = model.charAt(0).toLowerCase() + model.slice(1) as keyof PrismaClient;
    const modelClient = (prisma as any)[modelKey];

    if (typeof modelClient?.count !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    return await modelClient.count();
  } catch (error) {
    console.error(`Error getting record count for ${model}:`, error);
    return 0;
  }
}

/**
 * Get all records from a model
 *
 * @param model - Prisma model name
 * @returns Array of records
 */
export async function getAllRecords(model: string): Promise<any[]> {
  try {
    const prisma = getPrisma();
    const modelKey = model.charAt(0).toLowerCase() + model.slice(1) as keyof PrismaClient;
    const modelClient = (prisma as any)[modelKey];

    if (typeof modelClient?.findMany !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    return await modelClient.findMany();
  } catch (error) {
    console.error(`Error getting all records for ${model}:`, error);
    return [];
  }
}

/**
 * Get a record by ID
 *
 * @param model - Prisma model name
 * @param id - Record ID
 * @returns Record object or null if not found
 */
export async function getRecordById(model: string, id: string): Promise<any> {
  try {
    const prisma = getPrisma();
    const modelKey = model.charAt(0).toLowerCase() + model.slice(1) as keyof PrismaClient;
    const modelClient = (prisma as any)[modelKey];

    if (typeof modelClient?.findUnique !== 'function') {
      throw new Error(`Invalid model: ${model}`);
    }

    return await modelClient.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error(`Error getting record by ID for ${model}:`, error);
    return null;
  }
}

/**
 * Verify that a journal entry was created for a document
 *
 * @param documentType - Type of document ('invoice', 'receipt', 'payment', etc.)
 * @param documentId - Document ID
 * @returns true if journal entry exists, false otherwise
 */
export async function verifyJournalEntry(
  documentType: string,
  documentId: string
): Promise<boolean> {
  try {
    const prisma = getPrisma();

    // Map document types to their foreign key fields
    const documentFieldMap: Record<string, string> = {
      invoice: 'invoiceId',
      receipt: 'receiptId',
      payment: 'paymentId',
      purchaseInvoice: 'purchaseInvoiceId',
      pettyCashVoucher: 'pettyCashVoucherId'
    };

    const field = documentFieldMap[documentType];
    if (!field) {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        [field]: documentId
      }
    });

    return journalEntry !== null;
  } catch (error) {
    console.error('Error verifying journal entry:', error);
    return false;
  }
}

/**
 * Verify that a journal entry balances (debits = credits)
 *
 * @param journalEntryId - Journal entry ID
 * @returns true if entry balances, false otherwise
 */
export async function verifyJournalEntryBalances(
  journalEntryId: string
): Promise<boolean> {
  try {
    const prisma = getPrisma();

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntryId
      }
    });

    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    // Allow small floating point differences
    const diff = Math.abs(totalDebit - totalCredit);
    return diff < 0.01;
  } catch (error) {
    console.error('Error verifying journal entry balances:', error);
    return false;
  }
}

/**
 * Verify stock movement for a product
 *
 * @param productId - Product ID
 * @param expectedQuantity - Expected quantity change
 * @param warehouseId - Optional warehouse ID
 * @returns true if stock movement matches, false otherwise
 */
export async function verifyStockMovement(
  productId: string,
  expectedQuantity: number,
  warehouseId?: string
): Promise<boolean> {
  try {
    const prisma = getPrisma();

    const where: any = {
      productId
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const movements = await prisma.stockMovement.findMany({
      where
    });

    const totalQuantity = movements.reduce((sum, m) => sum + m.quantity, 0);
    return totalQuantity === expectedQuantity;
  } catch (error) {
    console.error('Error verifying stock movement:', error);
    return false;
  }
}

/**
 * Get current stock balance for a product
 *
 * @param productId - Product ID
 * @param warehouseId - Optional warehouse ID
 * @returns Current stock balance
 */
export async function getStockBalance(
  productId: string,
  warehouseId?: string
): Promise<number> {
  try {
    const prisma = getPrisma();

    const where: any = {
      productId
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const balance = await prisma.stockBalance.findFirst({
      where
    });

    return balance?.quantity || 0;
  } catch (error) {
    console.error('Error getting stock balance:', error);
    return 0;
  }
}

/**
 * Clear all test data from database
 * WARNING: This will delete all data - use with caution
 */
export async function clearTestData(): Promise<void> {
  const prisma = getPrisma();

  // Delete in order of dependencies (child records first)
  await prisma.journalLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});

  await prisma.receipt.deleteMany({});

  await prisma.payment.deleteMany({});

  await prisma.invoice.deleteMany({});

  await prisma.purchaseInvoice.deleteMany({});

  await prisma.stockMovement.deleteMany({});
  await prisma.stockBalance.deleteMany({});
  await prisma.warehouse.deleteMany({});

  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.vendor.deleteMany({});

  // Keep accounts and users - they're seeded data
}

/**
 * Seed database with test data
 */
export async function seedTestData(): Promise<void> {
  const prisma = getPrisma();

  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      code: 'E2E-CUST',
      name: 'E2E Test Customer',
      taxId: '1234567890123',
      email: 'e2e@example.com',
      phone: '0812345678',
      address: '123 Test Street',
      province: 'Bangkok',
      postalCode: '10100',
      creditLimit: 50000,
      accountId: '1201' // Accounts Receivable
    }
  });

  // Create test vendor
  const vendor = await prisma.vendor.create({
    data: {
      code: 'E2E-VEND',
      name: 'E2E Test Vendor',
      taxId: '9876543210987',
      email: 'e2e-vendor@example.com',
      phone: '0898765432',
      address: '456 Vendor Road',
      province: 'Bangkok',
      postalCode: '10200',
      paymentTerms: 30,
      accountId: '2101' // Accounts Payable
    }
  });

  // Create test product
  const product = await prisma.product.create({
    data: {
      name: 'E2E Test Product',
      code: 'E2E-001',
      unit: 'pcs',
      salePrice: 1000,
      costPrice: 500,
      vatType: 'EXCLUSIVE',
      accountId: '4101', // Sales Revenue
      expenseAccountId: '5101', // Cost of Goods Sold
      assetAccountId: '1203' // Inventory
    }
  });

  // Create test warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'E2E Test Warehouse',
      code: 'E2E-WH',
      location: '789 Warehouse Lane',
      province: 'Bangkok',
      postalCode: '10300'
    }
  });

  console.log('Test data seeded successfully');
  console.log('Customer ID:', customer.id);
  console.log('Vendor ID:', vendor.id);
  console.log('Product ID:', product.id);
  console.log('Warehouse ID:', warehouse.id);
}

/**
 * Get test data IDs for use in tests
 */
export async function getTestDataIds(): Promise<{
  customerId: string;
  vendorId: string;
  productId: string;
  warehouseId: string;
  cashAccountId: string;
  bankAccountId: string;
  arAccountId: string;
  apAccountId: string;
}> {
  const prisma = getPrisma();

  const customer = await prisma.customer.findFirst({
    where: { name: { contains: 'E2E' } }
  });

  const vendor = await prisma.vendor.findFirst({
    where: { name: { contains: 'E2E' } }
  });

  const product = await prisma.product.findFirst({
    where: { code: 'E2E-001' }
  });

  const warehouse = await prisma.warehouse.findFirst({
    where: { code: 'E2E-WH' }
  });

  if (!customer || !vendor || !product || !warehouse) {
    throw new Error('Test data not found. Run seedTestData() first.');
  }

  return {
    customerId: customer.id,
    vendorId: vendor.id,
    productId: product.id,
    warehouseId: warehouse.id,
    cashAccountId: '1111', // Cash on Hand
    bankAccountId: '1112', // Cash in Bank
    arAccountId: '1201', // Accounts Receivable
    apAccountId: '2101' // Accounts Payable
  };
}

/**
 * Verify document status
 *
 * @param model - Document model name
 * @param id - Document ID
 * @param expectedStatus - Expected status
 * @returns true if status matches, false otherwise
 */
export async function verifyDocumentStatus(
  model: string,
  id: string,
  expectedStatus: string
): Promise<boolean> {
  return verifyRecordValues(model, id, { status: expectedStatus });
}

/**
 * Get account balance
 *
 * @param accountId - Account code
 * @returns Current balance
 */
export async function getAccountBalance(accountId: string): Promise<number> {
  try {
    const prisma = getPrisma();

    const account = await prisma.chartOfAccount.findUnique({
      where: { code: accountId },
      include: {
        journalLines: true
      }
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const debit = account.journalLines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const credit = account.journalLines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

    // For asset and expense accounts: balance = debit - credit
    // For liability, equity, and revenue accounts: balance = credit - debit
    const accountType = account.type;
    if (accountType === 'ASSET' || accountType === 'EXPENSE') {
      return debit - credit;
    } else {
      return credit - debit;
    }
  } catch (error) {
    console.error('Error getting account balance:', error);
    return 0;
  }
}
