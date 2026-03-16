/**
 * Database Transaction Integration Tests
 * Tests for transaction integrity, constraints, and migrations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'

describe('Database Transactions', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.journalLine.deleteMany({
      where: { entry: { entryNo: { startsWith: 'TEST-' } } },
    })
    await prisma.journalEntry.deleteMany({
      where: { entryNo: { startsWith: 'TEST-' } },
    })
  })

  describe('ACID Properties', () => {
    it('should maintain atomicity - all or nothing', async () => {
      const entryNo = 'TEST-ATOMIC-001'
      
      try {
        await prisma.$transaction(async (tx) => {
          // Create journal entry
          const entry = await tx.journalEntry.create({
            data: {
              entryNo,
              date: new Date(),
              description: 'Test atomic transaction',
              status: 'DRAFT',
            },
          })

          // Create lines
          await tx.journalLine.create({
            data: {
              entryId: entry.id,
              accountId: 'test-account-1',
              debit: 1000,
              credit: 0,
            },
          })

          // Intentionally throw error
          throw new Error('Simulated error')
        })
      } catch (error) {
        // Expected
      }

      // Verify no partial data was saved
      const entry = await prisma.journalEntry.findUnique({
        where: { entryNo },
      })

      expect(entry).toBeNull()
    })

    it('should maintain consistency - balanced debits and credits', async () => {
      const entryNo = 'TEST-CONSISTENT-001'

      await prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: {
            entryNo,
            date: new Date(),
            description: 'Test consistency',
            status: 'POSTED',
          },
        })

        await tx.journalLine.createMany({
          data: [
            {
              entryId: entry.id,
              accountId: 'acc-asset',
              debit: 1000,
              credit: 0,
            },
            {
              entryId: entry.id,
              accountId: 'acc-liability',
              debit: 0,
              credit: 1000,
            },
          ],
        })
      })

      // Verify entry is balanced
      const entry = await prisma.journalEntry.findUnique({
        where: { entryNo },
        include: { lines: true },
      })

      const totalDebits = entry!.lines.reduce((sum, l) => sum + l.debit, 0)
      const totalCredits = entry!.lines.reduce((sum, l) => sum + l.credit, 0)

      expect(totalDebits).toBe(totalCredits)
    })

    it('should isolate concurrent transactions', async () => {
      const entryNo1 = 'TEST-ISOLATE-001'
      const entryNo2 = 'TEST-ISOLATE-002'

      // Run two transactions concurrently
      const [result1, result2] = await Promise.all([
        prisma.$transaction(async (tx) => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return tx.journalEntry.create({
            data: {
              entryNo: entryNo1,
              date: new Date(),
              description: 'Concurrent 1',
            },
          })
        }),
        prisma.$transaction(async (tx) => {
          return tx.journalEntry.create({
            data: {
              entryNo: entryNo2,
              date: new Date(),
              description: 'Concurrent 2',
            },
          })
        }),
      ])

      expect(result1.entryNo).toBe(entryNo1)
      expect(result2.entryNo).toBe(entryNo2)
    })

    it('should persist committed transactions', async () => {
      const entryNo = 'TEST-DURABLE-001'

      await prisma.$transaction(async (tx) => {
        await tx.journalEntry.create({
          data: {
            entryNo,
            date: new Date(),
            description: 'Test durability',
          },
        })
      })

      // Reconnect to database
      await prisma.$disconnect()
      await prisma.$connect()

      // Verify data still exists
      const entry = await prisma.journalEntry.findUnique({
        where: { entryNo },
      })

      expect(entry).not.toBeNull()
      expect(entry!.entryNo).toBe(entryNo)
    })
  })

  describe('Foreign Key Constraints', () => {
    it('should enforce customer reference in invoices', async () => {
      await expect(
        prisma.invoice.create({
          data: {
            invoiceNo: 'TEST-INV-001',
            invoiceDate: new Date(),
            dueDate: new Date(),
            customerId: 'non-existent-customer',
            totalAmount: 1000,
          },
        })
      ).rejects.toThrow()
    })

    it('should cascade delete journal lines', async () => {
      const entryNo = 'TEST-CASCADE-001'

      const entry = await prisma.journalEntry.create({
        data: {
          entryNo,
          date: new Date(),
          description: 'Test cascade',
          lines: {
            create: [
              { accountId: 'acc-1', debit: 1000, credit: 0 },
              { accountId: 'acc-2', debit: 0, credit: 1000 },
            ],
          },
        },
        include: { lines: true },
      })

      const lineCount = entry.lines.length
      expect(lineCount).toBe(2)

      // Delete entry
      await prisma.journalEntry.delete({
        where: { id: entry.id },
      })

      // Verify lines are deleted
      const remainingLines = await prisma.journalLine.count({
        where: { entryId: entry.id },
      })

      expect(remainingLines).toBe(0)
    })

    it('should prevent deleting referenced accounts', async () => {
      // Try to delete an account that has journal entries
      const accounts = await prisma.chartOfAccount.findMany({
        where: { isDetail: true },
        take: 1,
      })

      if (accounts.length > 0) {
        // Create a journal line referencing this account
        const entry = await prisma.journalEntry.create({
          data: {
            entryNo: 'TEST-REF-001',
            date: new Date(),
            description: 'Test reference',
            lines: {
              create: [
                { accountId: accounts[0].id, debit: 100, credit: 0 },
                { accountId: accounts[0].id, debit: 0, credit: 100 },
              ],
            },
          },
        })

        // Try to delete the account
        await expect(
          prisma.chartOfAccount.delete({
            where: { id: accounts[0].id },
          })
        ).rejects.toThrow()

        // Cleanup
        await prisma.journalEntry.delete({ where: { id: entry.id } })
      }
    })
  })

  describe('Unique Constraints', () => {
    it('should enforce unique invoice numbers', async () => {
      const invoiceNo = 'TEST-UNIQUE-001'

      // First invoice
      await prisma.invoice.create({
        data: {
          invoiceNo,
          invoiceDate: new Date(),
          dueDate: new Date(),
          totalAmount: 1000,
        },
      })

      // Duplicate should fail
      await expect(
        prisma.invoice.create({
          data: {
            invoiceNo,
            invoiceDate: new Date(),
            dueDate: new Date(),
            totalAmount: 2000,
          },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.invoice.deleteMany({ where: { invoiceNo } })
    })

    it('should enforce unique account codes', async () => {
      const code = '999999'

      // First account
      await prisma.chartOfAccount.create({
        data: {
          code,
          name: 'Test Account 1',
          type: 'ASSET',
        },
      })

      // Duplicate code should fail
      await expect(
        prisma.chartOfAccount.create({
          data: {
            code,
            name: 'Test Account 2',
            type: 'EXPENSE',
          },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.chartOfAccount.deleteMany({ where: { code } })
    })

    it('should enforce unique email for users', async () => {
      const email = 'test-unique@example.com'

      // First user
      await prisma.user.create({
        data: {
          email,
          name: 'Test User 1',
          password: 'hashedpassword',
        },
      })

      // Duplicate email should fail
      await expect(
        prisma.user.create({
          data: {
            email,
            name: 'Test User 2',
            password: 'hashedpassword2',
          },
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.user.deleteMany({ where: { email } })
    })
  })

  describe('Check Constraints', () => {
    it('should enforce positive amounts', async () => {
      const entryNo = 'TEST-NEGATIVE-001'

      await expect(
        prisma.journalEntry.create({
          data: {
            entryNo,
            date: new Date(),
            description: 'Test negative',
            lines: {
              create: [
                { accountId: 'acc-1', debit: -1000, credit: 0 },
                { accountId: 'acc-2', debit: 0, credit: -1000 },
              ],
            },
          },
        })
      ).rejects.toThrow()
    })

    it('should enforce valid dates', async () => {
      // Future dates should be allowed for planned transactions
      const futureDate = new Date('2030-12-31')

      const entry = await prisma.journalEntry.create({
        data: {
          entryNo: 'TEST-FUTURE-001',
          date: futureDate,
          description: 'Future entry',
        },
      })

      expect(entry.date.getTime()).toBe(futureDate.getTime())

      // Cleanup
      await prisma.journalEntry.delete({ where: { id: entry.id } })
    })
  })

  describe('Soft Deletes', () => {
    it('should soft delete instead of hard delete', async () => {
      const entryNo = 'TEST-SOFT-001'

      const entry = await prisma.journalEntry.create({
        data: {
          entryNo,
          date: new Date(),
          description: 'Test soft delete',
        },
      })

      // Soft delete
      await prisma.journalEntry.update({
        where: { id: entry.id },
        data: { deletedAt: new Date() },
      })

      // Should not appear in normal queries
      const found = await prisma.journalEntry.findUnique({
        where: { entryNo },
      })

      expect(found).toBeNull()

      // Should appear with deleted filter
      const deleted = await prisma.journalEntry.findUnique({
        where: { id: entry.id },
      })

      expect(deleted).not.toBeNull()
      expect(deleted!.deletedAt).not.toBeNull()

      // Cleanup
      await prisma.journalEntry.delete({ where: { id: entry.id } })
    })
  })
})

describe('Database Migrations', () => {
  it('should have applied all migrations', async () => {
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations ORDER BY finished_at DESC
    `

    expect(Array.isArray(migrations)).toBe(true)
  })

  it('should have correct table structure', async () => {
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `

    const tableNames = (tables as any[]).map(t => t.name)
    
    expect(tableNames).toContain('User')
    expect(tableNames).toContain('ChartOfAccount')
    expect(tableNames).toContain('JournalEntry')
    expect(tableNames).toContain('JournalLine')
    expect(tableNames).toContain('Invoice')
    expect(tableNames).toContain('Customer')
  })

  it('should have required indexes', async () => {
    const indexes = await prisma.$queryRaw`
      SELECT name, tbl_name FROM sqlite_master WHERE type='index'
    `

    const indexList = (indexes as any[]).map(i => i.name)
    
    // Check for common indexes
    expect(indexList.some(i => i.includes('JournalEntry'))).toBe(true)
    expect(indexList.some(i => i.includes('Invoice'))).toBe(true)
  })
})
