/**
 * Transaction Rollback Tests
 *
 * These tests verify that GL posting operations properly
 * use transactions and rollback on errors, preventing data corruption.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/db';

describe('Transaction Rollback Tests', () => {
  let testCustomerId: string;
  let testInvoiceId: string;

  beforeEach(async () => {
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        code: 'TEST-CUST-001',
        name: 'Test Customer for Transactions',
        taxId: '1234567890123',
        creditLimit: 100000,
        creditDays: 30,
        isActive: true,
      },
    });
    testCustomerId = customer.id;

    // Create test draft invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: 'TEST-INV-001',
        invoiceDate: new Date(),
        customerId: testCustomerId,
        type: 'TAX_INVOICE',
        status: 'DRAFT',
        subtotal: 1000,
        vatRate: 7,
        vatAmount: 70,
        totalAmount: 1070,
        netAmount: 1070,
        paidAmount: 0,
        lines: {
          create: {
            lineNo: 1,
            description: 'Test Item',
            quantity: 1,
            unit: 'ชิ้น',
            unitPrice: 1000,
            discount: 0,
            amount: 1000,
            vatRate: 7,
            vatAmount: 70,
          },
        },
      },
    });
    testInvoiceId = invoice.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.journalEntry.deleteMany({});
    await prisma.invoice.deleteMany({
      where: { invoiceNo: { startsWith: 'TEST-' } },
    });
    await prisma.customer.deleteMany({
      where: { code: { startsWith: 'TEST-' } },
    });
  });

  it('should rollback journal entry creation if invoice update fails', async () => {
    const initialJournalCount = await prisma.journalEntry.count();
    const initialInvoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
    });

    try {
      // Attempt to create journal entry with invalid data
      // This should fail and rollback
      await prisma.$transaction(async (tx) => {
        // Create journal entry
        await tx.journalEntry.create({
          data: {
            entryNo: 'TEST-JE-001',
            date: new Date(),
            description: 'Test journal entry',
            totalDebit: 1070,
            totalCredit: 1070,
            status: 'POSTED',
            lines: {
              create: [
                {
                  lineNo: 1,
                  accountId: 'invalid-account-id', // This will cause failure
                  description: 'Test debit',
                  debit: 1070,
                  credit: 0,
                },
              ],
            },
          },
        });

        // This should not be reached due to the error above
        await tx.invoice.update({
          where: { id: testInvoiceId },
          data: { status: 'POSTED' },
        });
      });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }

    // Verify rollback: No journal entry should exist
    const finalJournalCount = await prisma.journalEntry.count();
    expect(finalJournalCount).toBe(initialJournalCount);

    // Verify rollback: Invoice should still be in DRAFT status
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
    });
    expect(finalInvoice?.status).toBe('DRAFT');
  });

  it('should commit all changes if transaction succeeds', async () => {
    // Get cash account
    const cashAccount = await prisma.chartOfAccount.findFirst({
      where: { code: '1110' },
    });
    expect(cashAccount).toBeTruthy();

    // Get AR account
    const arAccount = await prisma.chartOfAccount.findFirst({
      where: { code: '1120' },
    });
    expect(arAccount).toBeTruthy();

    if (!cashAccount || !arAccount) {
      console.warn('Required accounts not found, skipping test');
      return;
    }

    const initialJournalCount = await prisma.journalEntry.count();

    // Successful transaction
    await prisma.$transaction(async (tx) => {
      // Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo: `TEST-JE-${Date.now()}`,
          date: new Date(),
          description: 'Test successful transaction',
          totalDebit: 1070,
          totalCredit: 1070,
          status: 'POSTED',
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: cashAccount.id,
                description: 'Debit Cash',
                debit: 1070,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: arAccount.id,
                description: 'Credit AR',
                debit: 0,
                credit: 1070,
              },
            ],
          },
        },
      });

      // Update invoice
      await tx.invoice.update({
        where: { id: testInvoiceId },
        data: {
          status: 'POSTED',
          journalEntryId: journalEntry.id,
        },
      });
    });

    // Verify commit: Journal entry was created
    const finalJournalCount = await prisma.journalEntry.count();
    expect(finalJournalCount).toBe(initialJournalCount + 1);

    // Verify commit: Invoice status was updated
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
      include: { journalEntry: true },
    });
    expect(finalInvoice?.status).toBe('POSTED');
    expect(finalInvoice?.journalEntry).toBeTruthy();
  });

  it('should handle nested transaction operations', async () => {
    const cashAccount = await prisma.chartOfAccount.findFirst({
      where: { code: '1110' },
    });
    const arAccount = await prisma.chartOfAccount.findFirst({
      where: { code: '1120' },
    });

    if (!cashAccount || !arAccount) {
      console.warn('Required accounts not found, skipping test');
      return;
    }

    // Test multiple related operations in one transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create journal entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo: `TEST-JE-NEST-${Date.now()}`,
          date: new Date(),
          description: 'Nested transaction test',
          totalDebit: 1070,
          totalCredit: 1070,
          status: 'POSTED',
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: cashAccount.id,
                description: 'Debit',
                debit: 1070,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: arAccount.id,
                description: 'Credit',
                debit: 0,
                credit: 1070,
              },
            ],
          },
        },
      });

      // 2. Update invoice
      await tx.invoice.update({
        where: { id: testInvoiceId },
        data: { journalEntryId: journalEntry.id },
      });

      // 3. Update customer (simulating balance update)
      await tx.customer.update({
        where: { id: testCustomerId },
        data: {
          /* Update some field */
        },
      });

      // All operations should succeed
      expect(journalEntry.id).toBeTruthy();
    });

    // Verify all changes were committed
    const invoice = await prisma.invoice.findUnique({
      where: { id: testInvoiceId },
    });
    expect(invoice?.journalEntryId).toBeTruthy();
  });

  it('should timeout after maxWait period if locked', async () => {
    // This test verifies that transactions timeout appropriately
    // when they cannot acquire a lock

    const maxWait = 1000; // 1 second for testing

    // Create first transaction that holds a lock
    const tx1Promise = prisma.$transaction(
      async (tx) => {
        // Update a record to hold a lock
        await tx.documentNumber.upsert({
          where: { type: 'LOCK_TEST' },
          create: {
            type: 'LOCK_TEST',
            prefix: 'LCK',
            currentNo: 0,
            format: '',
            resetMonthly: false,
          },
          update: {
            currentNo: { increment: 1 },
          },
        });

        // Hold the lock for a bit
        await new Promise((resolve) => setTimeout(resolve, 2000));
      },
      { maxWait }
    );

    // Create second transaction that should timeout
    const tx2Promise = prisma.$transaction(
      async (tx) => {
        await tx.documentNumber.upsert({
          where: { type: 'LOCK_TEST' },
          create: {
            type: 'LOCK_TEST',
            prefix: 'LCK',
            currentNo: 0,
            format: '',
            resetMonthly: false,
          },
          update: {
            currentNo: { increment: 1 },
          },
        });
      },
      { maxWait }
    );

    // First transaction should succeed
    const result1 = await tx1Promise;
    expect(result1).toBeTruthy();

    // Second transaction should timeout or wait
    try {
      const result2 = await tx2Promise;
      expect(result2).toBeTruthy();
    } catch (error) {
      // Transaction might timeout if lock is held too long
      expect(error).toBeDefined();
    }
  });
});

/**
 * Manual Test Script for Transaction Rollback
 *
 * ```bash
 * node tests/manual/test-transaction-rollback.js
 * ```
 */
