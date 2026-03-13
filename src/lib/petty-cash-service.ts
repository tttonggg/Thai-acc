import { db } from './db'

/**
 * Petty Cash Service
 * Handles petty cash voucher operations including journal entry creation
 */

export interface CreateVoucherJournalEntryParams {
  voucherId: string
  voucherNo: string
  voucherDate: Date
  amount: number
  payee: string
  description: string
  glExpenseAccountId: string
  pettyCashFundAccountId: string
}

/**
 * Create journal entry for petty cash voucher
 * When a petty cash voucher is approved, creates:
 * - Debit: Expense account (based on voucher expense type)
 * - Credit: Petty cash fund account
 */
export async function createVoucherJournalEntry(params: CreateVoucherJournalEntryParams) {
  return await db.$transaction(async (tx) => {
    const {
      voucherId,
      voucherNo,
      voucherDate,
      amount,
      payee,
      description,
      glExpenseAccountId,
      pettyCashFundAccountId,
    } = params

    // Generate journal entry number
    const entryNo = await generateJournalEntryNumber(voucherDate, tx)

    // Create description in Thai
    const journalDescription = `เบิกเงินสดย่อย ${voucherNo} - ${description}`

    // Create journal entry with lines
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNo,
        date: voucherDate,
        description: journalDescription,
        reference: `เบียกเงินสดย่อย ${voucherNo}`,
        documentType: 'PETTY_CASH_VOUCHER',
        documentId: voucherId,
        totalDebit: amount,
        totalCredit: amount,
        status: 'POSTED', // Auto-post petty cash vouchers
        lines: {
          create: [
            // Debit line - Expense account
            {
              lineNo: 1,
              accountId: glExpenseAccountId,
              description: `${description} (ค่าใช้จ่าย)`,
              debit: amount,
              credit: 0,
              reference: voucherNo,
            },
            // Credit line - Petty cash fund
            {
              lineNo: 2,
              accountId: pettyCashFundAccountId,
              description: `เงินสดย่อย (${payee})`,
              debit: 0,
              credit: amount,
              reference: voucherNo,
            },
          ],
        },
      },
    })

    return journalEntry
  })
}

/**
 * Generate journal entry number for petty cash vouchers
 * Format: JV-YYYYMM-NNNN
 */
async function generateJournalEntryNumber(date: Date, tx: any): Promise<string> {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const prefix = `JV-${year}${month}`

  const lastEntry = await tx.journalEntry.findFirst({
    where: {
      entryNo: {
        startsWith: prefix,
      },
    },
    orderBy: { entryNo: 'desc' },
  })

  let nextNum = 1
  if (lastEntry) {
    const lastNum = parseInt(lastEntry.entryNo.split('-')[2] || '0')
    nextNum = lastNum + 1
  }

  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}
