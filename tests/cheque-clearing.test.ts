/**
 * Cheque Clearing GL Entry Tests
 *
 * This file demonstrates the expected behavior of the cheque clearing system.
 * Run these tests after implementation to verify correctness.
 */

import { clearCheque, bounceCheque } from '@/lib/cheque-service'
import prisma from '@/lib/db'

describe('Cheque Clearing GL Entries', () => {
  describe('Received Cheque (เช็ครับ)', () => {
    it('should create correct journal entry when cleared', async () => {
      // Setup: Create a received cheque
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'R001',
          type: 'RECEIVE',
          bankAccountId: bankAccount!.id,
          amount: 10000,
          dueDate: new Date('2026-03-15'),
          payeeName: 'Customer A',
          status: 'ON_HAND'
        }
      })

      // Execute: Clear the cheque
      const journalEntry = await clearCheque(cheque.id, new Date('2026-03-16'))

      // Verify: Journal entry created with correct accounts
      expect(journalEntry.lines).toHaveLength(2)
      expect(journalEntry.totalDebit).toBe(10000)
      expect(journalEntry.totalCredit).toBe(10000)
      expect(journalEntry.documentId).toBe(cheque.id)
      expect(journalEntry.documentType).toBe('CHEQUE_RECEIVE')

      // Verify: Debit line (Bank Account)
      const debitLine = journalEntry.lines.find(l => l.debit > 0)!
      expect(debitLine.accountId).toBe(bankAccount!.glAccountId)
      expect(debitLine.debit).toBe(10000)
      expect(debitLine.credit).toBe(0)

      // Verify: Credit line (Accounts Receivable - 1121)
      const arAccount = await prisma.chartOfAccount.findFirst({
        where: { code: '1121' }
      })
      const creditLine = journalEntry.lines.find(l => l.credit > 0)!
      expect(creditLine.accountId).toBe(arAccount!.id)
      expect(creditLine.debit).toBe(0)
      expect(creditLine.credit).toBe(10000)

      // Verify: Cheque updated
      const updatedCheque = await prisma.cheque.findUnique({
        where: { id: cheque.id }
      })
      expect(updatedCheque?.status).toBe('CLEARED')
      expect(updatedCheque?.journalEntryId).toBe(journalEntry.id)
      expect(updatedCheque?.clearedDate).toEqual(new Date('2026-03-16'))
    })

    it('should create reversing entry when bounced', async () => {
      // Setup: Clear a cheque first
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'R002',
          type: 'RECEIVE',
          bankAccountId: bankAccount!.id,
          amount: 5000,
          dueDate: new Date('2026-03-15'),
          payeeName: 'Customer B',
          status: 'CLEARED',
          clearedDate: new Date('2026-03-16'),
          journalEntryId: 'existing-entry-id' // Simulating already cleared
        }
      })

      // Execute: Bounce the cheque
      const reversingEntry = await bounceCheque(
        cheque.id,
        new Date('2026-03-17'),
        'insufficient funds'
      )

      // Verify: Reversing entry created
      expect(reversingEntry.isReversing).toBe(true)
      expect(reversingEntry.lines).toHaveLength(2)
      expect(reversingEntry.totalDebit).toBe(5000)
      expect(reversingEntry.totalCredit).toBe(5000)

      // Verify: Debits and credits are swapped
      const originalEntry = await prisma.journalEntry.findUnique({
        where: { id: cheque.journalEntryId! },
        include: { lines: true }
      })
      const originalDebitLine = originalEntry!.lines.find(l => l.debit > 0)!
      const reversingCreditLine = reversingEntry.lines.find(l => l.credit > 0)!

      expect(reversingCreditLine.accountId).toBe(originalDebitLine.accountId)
      expect(reversingCreditLine.credit).toBe(originalDebitLine.debit)

      // Verify: Original entry marked as reversed
      const updatedOriginal = await prisma.journalEntry.findUnique({
        where: { id: originalEntry!.id }
      })
      expect(updatedOriginal?.status).toBe('REVERSED')

      // Verify: Cheque status updated
      const updatedCheque = await prisma.cheque.findUnique({
        where: { id: cheque.id }
      })
      expect(updatedCheque?.status).toBe('BOUNCED')
    })
  })

  describe('Payment Cheque (เช็คจ่าย)', () => {
    it('should create correct journal entry when cleared', async () => {
      // Setup: Create a payment cheque
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'P001',
          type: 'PAY',
          bankAccountId: bankAccount!.id,
          amount: 7500,
          dueDate: new Date('2026-03-15'),
          payeeName: 'Vendor X',
          status: 'ON_HAND'
        }
      })

      // Execute: Clear the cheque
      const journalEntry = await clearCheque(cheque.id, new Date('2026-03-16'))

      // Verify: Journal entry created with correct accounts
      expect(journalEntry.lines).toHaveLength(2)
      expect(journalEntry.totalDebit).toBe(7500)
      expect(journalEntry.totalCredit).toBe(7500)
      expect(journalEntry.documentId).toBe(cheque.id)
      expect(journalEntry.documentType).toBe('CHEQUE_PAY')

      // Verify: Debit line (Accounts Payable - 2110)
      const apAccount = await prisma.chartOfAccount.findFirst({
        where: { code: '2110' }
      })
      const debitLine = journalEntry.lines.find(l => l.debit > 0)!
      expect(debitLine.accountId).toBe(apAccount!.id)
      expect(debitLine.debit).toBe(7500)
      expect(debitLine.credit).toBe(0)

      // Verify: Credit line (Bank Account)
      const creditLine = journalEntry.lines.find(l => l.credit > 0)!
      expect(creditLine.accountId).toBe(bankAccount!.glAccountId)
      expect(creditLine.debit).toBe(0)
      expect(creditLine.credit).toBe(7500)

      // Verify: Cheque updated
      const updatedCheque = await prisma.cheque.findUnique({
        where: { id: cheque.id }
      })
      expect(updatedCheque?.status).toBe('CLEARED')
      expect(updatedCheque?.journalEntryId).toBe(journalEntry.id)
    })

    it('should create reversing entry when bounced', async () => {
      // Setup: Clear a payment cheque first
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'P002',
          type: 'PAY',
          bankAccountId: bankAccount!.id,
          amount: 3000,
          dueDate: new Date('2026-03-15'),
          payeeName: 'Vendor Y',
          status: 'CLEARED',
          clearedDate: new Date('2026-03-16'),
          journalEntryId: 'existing-payment-entry-id'
        }
      })

      // Execute: Bounce the cheque
      const reversingEntry = await bounceCheque(
        cheque.id,
        new Date('2026-03-17'),
        'stop payment'
      )

      // Verify: Reversing entry created
      expect(reversingEntry.isReversing).toBe(true)
      expect(reversingEntry.documentType).toBe('CHEQUE_BOUNCE')

      // Verify: Cheque status updated
      const updatedCheque = await prisma.cheque.findUnique({
        where: { id: cheque.id }
      })
      expect(updatedCheque?.status).toBe('BOUNCED')
    })
  })

  describe('Error Handling', () => {
    it('should prevent clearing already cleared cheque', async () => {
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'E001',
          type: 'RECEIVE',
          bankAccountId: bankAccount!.id,
          amount: 1000,
          dueDate: new Date('2026-03-15'),
          status: 'CLEARED',
          clearedDate: new Date('2026-03-16'),
          journalEntryId: 'existing-id'
        }
      })

      await expect(
        clearCheque(cheque.id, new Date('2026-03-17'))
      ).rejects.toThrow('already cleared')
    })

    it('should prevent clearing cancelled cheque', async () => {
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'E002',
          type: 'RECEIVE',
          bankAccountId: bankAccount!.id,
          amount: 1000,
          dueDate: new Date('2026-03-15'),
          status: 'CANCELLED'
        }
      })

      await expect(
        clearCheque(cheque.id, new Date('2026-03-16'))
      ).rejects.toThrow('Cannot clear cancelled cheque')
    })

    it('should prevent bouncing without journal entry', async () => {
      const bankAccount = await prisma.bankAccount.findFirst()
      const cheque = await prisma.cheque.create({
        data: {
          chequeNo: 'E003',
          type: 'RECEIVE',
          bankAccountId: bankAccount!.id,
          amount: 1000,
          dueDate: new Date('2026-03-15'),
          status: 'ON_HAND'
        }
      })

      await expect(
        bounceCheque(cheque.id, new Date('2026-03-16'))
      ).rejects.toThrow('No journal entry found')
    })
  })

  describe('Double-Entry Validation', () => {
    it('should always balance for received cheques', async () => {
      const amounts = [100, 1000.50, 50000, 999999.99]

      for (const amount of amounts) {
        const bankAccount = await prisma.bankAccount.findFirst()
        const cheque = await prisma.cheque.create({
          data: {
            chequeNo: `BAL-${amount}`,
            type: 'RECEIVE',
            bankAccountId: bankAccount!.id,
            amount,
            dueDate: new Date('2026-03-15'),
            status: 'ON_HAND'
          }
        })

        const entry = await clearCheque(cheque.id, new Date())
        expect(entry.totalDebit).toBe(entry.totalCredit)
        expect(entry.totalDebit).toBe(amount)
      }
    })

    it('should always balance for payment cheques', async () => {
      const amounts = [250, 2500.75, 75000, 888888.88]

      for (const amount of amounts) {
        const bankAccount = await prisma.bankAccount.findFirst()
        const cheque = await prisma.cheque.create({
          data: {
            chequeNo: `BALP-${amount}`,
            type: 'PAY',
            bankAccountId: bankAccount!.id,
            amount,
            dueDate: new Date('2026-03-15'),
            status: 'ON_HAND'
          }
        })

        const entry = await clearCheque(cheque.id, new Date())
        expect(entry.totalDebit).toBe(entry.totalCredit)
        expect(entry.totalDebit).toBe(amount)
      }
    })
  })
})
