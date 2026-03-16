/**
 * Test Data Factory for E2E Testing
 *
 * Provides factory functions to create test data for E2E tests.
 * All functions create records in the database via Prisma.
 */

import { PrismaClient } from '@prisma/client';
import type {
  Customer,
  Vendor,
  Product,
  Invoice,
  InvoiceItem,
  Receipt,
  ReceiptItem,
  Payment,
  PaymentItem,
  Warehouse,
  PettyCashFund
} from '@prisma/client';

// Prisma client singleton
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
 * Generate a unique test ID
 */
function generateTestId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get next document number
 */
async function getNextDocumentNumber(type: string): Promise<string> {
  const prisma = getPrisma();
  const year = new Date().getFullYear();

  const docNumber = await prisma.documentNumber.findUnique({
    where: { type_year: { type, year } }
  });

  if (!docNumber) {
    await prisma.documentNumber.create({
      data: {
        type,
        year,
        lastNumber: 1,
        prefix: `${type.substring(0, 3).toUpperCase()}-${year}`
      }
    });
    return `${type.substring(0, 3).toUpperCase()}-${year}-0001`;
  }

  const nextNumber = docNumber.lastNumber + 1;
  await prisma.documentNumber.update({
    where: { id: docNumber.id },
    data: { lastNumber: nextNumber }
  });

  return `${docNumber.prefix}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Create a test customer
 *
 * @param overrides - Optional field overrides
 * @returns Created customer record
 */
export async function createTestCustomer(
  overrides: Partial<Customer> = {}
): Promise<Customer> {
  const prisma = getPrisma();

  const id = generateTestId('cust');

  const data = {
    id,
    code: `CUST-${id}`,
    name: `Test Customer ${id}`,
    taxId: `${Math.floor(Math.random() * 1000000000000)}`,
    email: `customer-${id}@example.com`,
    phone: '0812345678',
    address: '123 Test Street',
    district: 'Test District',
    province: 'Bangkok',
    postalCode: '10100',
    country: 'Thailand',
    creditLimit: 50000,
    paymentTerms: 30,
    accountId: '1201', // Accounts Receivable
    ...overrides
  };

  return await prisma.customer.create({ data });
}

/**
 * Create a test vendor
 *
 * @param overrides - Optional field overrides
 * @returns Created vendor record
 */
export async function createTestVendor(
  overrides: Partial<Vendor> = {}
): Promise<Vendor> {
  const prisma = getPrisma();

  const id = generateTestId('vend');

  const data = {
    id,
    code: `VEND-${id}`,
    name: `Test Vendor ${id}`,
    taxId: `${Math.floor(Math.random() * 1000000000000)}`,
    email: `vendor-${id}@example.com`,
    phone: '0898765432',
    address: '456 Vendor Road',
    district: 'Test District',
    province: 'Bangkok',
    postalCode: '10200',
    country: 'Thailand',
    paymentTerms: 30,
    accountId: '2101', // Accounts Payable
    ...overrides
  };

  return await prisma.vendor.create({ data });
}

/**
 * Create a test product
 *
 * @param overrides - Optional field overrides
 * @returns Created product record
 */
export async function createTestProduct(
  overrides: Partial<Product> = {}
): Promise<Product> {
  const prisma = getPrisma();

  const id = generateTestId('prod');

  const data = {
    id,
    name: `Test Product ${id}`,
    code: `TEST-${Math.floor(Math.random() * 10000)}`,
    description: 'Test product description',
    unit: 'pcs',
    salePrice: 1000,
    costPrice: 500,
    vatType: 'EXCLUSIVE',
    accountId: '4101', // Sales Revenue
    expenseAccountId: '5101', // Cost of Goods Sold
    assetAccountId: '1203', // Inventory
    incomeType: null,
    whtRate: null,
    active: true,
    ...overrides
  };

  return await prisma.product.create({ data });
}

/**
 * Create a test warehouse
 *
 * @param overrides - Optional field overrides
 * @returns Created warehouse record
 */
export async function createTestWarehouse(
  overrides: Partial<Warehouse> = {}
): Promise<Warehouse> {
  const prisma = getPrisma();

  const id = generateTestId('wh');

  const data = {
    id,
    name: `Test Warehouse ${id}`,
    code: `WH-${Math.floor(Math.random() * 100)}`,
    location: '789 Warehouse Lane',
    district: 'Test District',
    province: 'Bangkok',
    postalCode: '10300',
    active: true,
    ...overrides
  };

  return await prisma.warehouse.create({ data });
}

/**
 * Create a test invoice with items
 *
 * @param overrides - Optional field overrides
 * @returns Created invoice record with items
 */
export async function createTestInvoice(
  overrides: Partial<Invoice> & { items?: Partial<InvoiceItem>[] } = {}
): Promise<Invoice & { items: InvoiceItem[] }> {
  const prisma = getPrisma();

  // Create customer if not provided
  let customerId = overrides.customerId;
  if (!customerId) {
    const customer = await createTestCustomer();
    customerId = customer.id;
  }

  // Create product if not provided
  const items = overrides.items || [];
  if (items.length === 0) {
    const product = await createTestProduct();
    items.push({
      productId: product.id,
      quantity: 10,
      price: 1000,
      discount: 0,
      vatAmount: 700,
      total: 10000
    });
  }

  const id = generateTestId('inv');
  const invoiceNumber = await getNextDocumentNumber('invoice');

  const invoiceData = {
    id,
    invoiceNumber,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    customerId,
    subtotal: items.reduce((sum, item) => sum + (item.quantity || 1) * (item.price || 0), 0),
    discountAmount: 0,
    vatAmount: items.reduce((sum, item) => sum + (item.vatAmount || 0), 0),
    total: items.reduce((sum, item) => sum + (item.total || 0), 0),
    status: 'POSTED',
    notes: 'Test invoice',
    journalEntryId: null,
    ...overrides
  };

  delete (invoiceData as any).items;

  const invoice = await prisma.invoice.create({
    data: {
      ...invoiceData,
      items: {
        create: items.map((item, index) => ({
          id: generateTestId(`inv-item-${index}`),
          productId: item.productId!,
          quantity: item.quantity || 1,
          price: item.price || 0,
          discount: item.discount || 0,
          vatRate: 0.07,
          vatAmount: item.vatAmount || 0,
          total: item.total || 0,
          description: item.description || `Item ${index + 1}`
        }))
      }
    },
    include: { items: true }
  });

  return invoice as Invoice & { items: InvoiceItem[] };
}

/**
 * Create a test receipt with items
 *
 * @param overrides - Optional field overrides
 * @returns Created receipt record with items
 */
export async function createTestReceipt(
  overrides: Partial<Receipt> & { items?: Partial<ReceiptItem>[] } = {}
): Promise<Receipt & { items: ReceiptItem[] }> {
  const prisma = getPrisma();

  // Create customer if not provided
  let customerId = overrides.customerId;
  if (!customerId) {
    const customer = await createTestCustomer();
    customerId = customer.id;
  }

  const id = generateTestId('rcpt');
  const receiptNumber = await getNextDocumentNumber('receipt');

  const items = overrides.items || [];
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const receiptData = {
    id,
    receiptNumber,
    receiptDate: new Date(),
    customerId,
    amount: totalAmount || 10000,
    paymentMethod: 'CASH',
    bankAccount: null,
    chequeNumber: null,
    chequeDate: null,
    reference: '',
    notes: 'Test receipt',
    journalEntryId: null,
    ...overrides
  };

  delete (receiptData as any).items;

  const receipt = await prisma.receipt.create({
    data: {
      ...receiptData,
      items: {
        create: items.length > 0 ? items.map((item, index) => ({
          id: generateTestId(`rcpt-item-${index}`),
          invoiceId: item.invoiceId || null,
          amount: item.amount || 0,
          discountAmount: item.discountAmount || 0
        })) : undefined
      }
    },
    include: { items: true }
  });

  return receipt as Receipt & { items: ReceiptItem[] };
}

/**
 * Create a test payment with items
 *
 * @param overrides - Optional field overrides
 * @returns Created payment record with items
 */
export async function createTestPayment(
  overrides: Partial<Payment> & { items?: Partial<PaymentItem>[] } = {}
): Promise<Payment & { items: PaymentItem[] }> {
  const prisma = getPrisma();

  // Create vendor if not provided
  let vendorId = overrides.vendorId;
  if (!vendorId) {
    const vendor = await createTestVendor();
    vendorId = vendor.id;
  }

  const id = generateTestId('pay');
  const paymentNumber = await getNextDocumentNumber('payment');

  const items = overrides.items || [];
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const paymentData = {
    id,
    paymentNumber,
    paymentDate: new Date(),
    vendorId,
    amount: totalAmount || 10000,
    paymentMethod: 'CASH',
    bankAccount: null,
    chequeNumber: null,
    chequeDate: null,
    reference: '',
    notes: 'Test payment',
    journalEntryId: null,
    whtAmount: 0,
    whtBase: 0,
    ...overrides
  };

  delete (paymentData as any).items;

  const payment = await prisma.payment.create({
    data: {
      ...paymentData,
      items: {
        create: items.length > 0 ? items.map((item, index) => ({
          id: generateTestId(`pay-item-${index}`),
          purchaseInvoiceId: item.purchaseInvoiceId || null,
          amount: item.amount || 0,
          discountAmount: item.discountAmount || 0
        })) : undefined
      }
    },
    include: { items: true }
  });

  return payment as Payment & { items: PaymentItem[] };
}

/**
 * Create a test petty cash fund
 *
 * @param overrides - Optional field overrides
 * @returns Created petty cash fund record
 */
export async function createTestPettyCashFund(
  overrides: Partial<PettyCashFund> = {}
): Promise<PettyCashFund> {
  const prisma = getPrisma();

  const id = generateTestId('pcf');
  const fundCode = `PCF-${Math.floor(Math.random() * 100)}`;

  const data = {
    id,
    fundCode,
    name: `Test Petty Cash Fund ${id}`,
    custodian: 'Test Custodian',
    balance: 5000,
    maxBalance: 10000,
    replenishLevel: 2000,
    bankAccountId: '1111', // Cash on Hand
    active: true,
    ...overrides
  };

  return await prisma.pettyCashFund.create({ data });
}

/**
 * Create a complete test accounting scenario
 * Creates customer, vendor, products, and sample documents
 *
 * @returns Object containing all created records
 */
export async function createTestScenario(): Promise<{
  customer: Customer;
  vendor: Vendor;
  products: Product[];
  warehouse: Warehouse;
  invoice: Invoice & { items: InvoiceItem[] };
  receipt: Receipt & { items: ReceiptItem[] };
  payment: Payment & { items: PaymentItem[] };
}> {
  // Create master data
  const customer = await createTestCustomer();
  const vendor = await createTestVendor();
  const warehouse = await createTestWarehouse();

  // Create products
  const products = await Promise.all([
    createTestProduct({ name: 'Product A', code: 'PROD-A', price: 1000 }),
    createTestProduct({ name: 'Product B', code: 'PROD-B', price: 2000 }),
    createTestProduct({ name: 'Service C', code: 'SVC-C', price: 5000, unit: 'hour' })
  ]);

  // Create documents
  const invoice = await createTestInvoice({
    customerId: customer.id,
    items: products.slice(0, 2).map(p => ({
      productId: p.id,
      quantity: 10,
      price: p.price,
      vatAmount: p.price * 10 * 0.07,
      total: p.price * 10 * 1.07
    }))
  });

  const receipt = await createTestReceipt({
    customerId: customer.id,
    items: [{
      invoiceId: invoice.id,
      amount: invoice.total * 0.5,
      discountAmount: 0
    }]
  });

  const payment = await createTestPayment({
    vendorId: vendor.id,
    items: [{
      amount: 5000
    }]
  });

  return {
    customer,
    vendor,
    products,
    warehouse,
    invoice,
    receipt,
    payment
  };
}

/**
 * Bulk create test customers
 *
 * @param count - Number of customers to create
 * @returns Array of created customers
 */
export async function createTestCustomers(count: number): Promise<Customer[]> {
  const customers = [];
  for (let i = 0; i < count; i++) {
    const customer = await createTestCustomer({
      name: `Bulk Customer ${i + 1}`,
      email: `bulk-customer-${i + 1}@example.com`
    });
    customers.push(customer);
  }
  return customers;
}

/**
 * Bulk create test products
 *
 * @param count - Number of products to create
 * @returns Array of created products
 */
export async function createTestProducts(count: number): Promise<Product[]> {
  const products = [];
  for (let i = 0; i < count; i++) {
    const product = await createTestProduct({
      name: `Bulk Product ${i + 1}`,
      code: `BULK-${i + 1}`,
      price: 1000 + (i * 100)
    });
    products.push(product);
  }
  return products;
}

/**
 * Delete all test data created by factory
 * Removes records where ID contains the test prefix
 */
export async function deleteTestData(): Promise<void> {
  const prisma = getPrisma();

  // Delete in order of dependencies
  await prisma.journalLine.deleteMany({
    where: {
      journalEntry: {
        OR: [
          { invoice: { id: { contains: '-' } } },
          { receipt: { id: { contains: '-' } } },
          { payment: { id: { contains: '-' } } }
        ]
      }
    }
  });

  await prisma.journalEntry.deleteMany({
    where: {
      OR: [
        { invoice: { id: { contains: '-' } } },
        { receipt: { id: { contains: '-' } } },
        { payment: { id: { contains: '-' } } }
      ]
    }
  });

  await prisma.invoiceItem.deleteMany({
    where: {
      invoice: { id: { contains: '-' } }
    }
  });

  await prisma.invoice.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.receiptItem.deleteMany({
    where: {
      receipt: { id: { contains: '-' } }
    }
  });

  await prisma.receipt.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.paymentItem.deleteMany({
    where: {
      payment: { id: { contains: '-' } }
    }
  });

  await prisma.payment.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.product.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.warehouse.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.vendor.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.customer.deleteMany({
    where: { id: { contains: '-' } }
  });

  await prisma.pettyCashFund.deleteMany({
    where: { id: { contains: '-' } }
  });
}
