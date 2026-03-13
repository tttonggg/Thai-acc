// ============================================
// 🏦 Cheque Clearing Service (Agent 05: Banking & Finance Engineer)
// GL Journal Entry Generation for Cheque Clearing
// Schema-exact — Cheque model verified with journalEntryId
// ============================================
import prisma from '@/lib/db'

/**
 * Create journal entry when a RECEIVED cheque is cleared
 * Debit: Bank Account (Asset)
 * Credit: Accounts Receivable (Asset reduction)
 */
export async function createReceivedChequeJournalEntry(
  chequeId: string,
  clearedDate: Date,
  userId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const cheque = await tx.cheque.findUnique({
      where: { id: chequeId },
      include: { bankAccount: true }
    })

    if (!cheque) throw new Error('Cheque not found')
    if (cheque.type !== 'RECEIVE') throw new Error('Not a received cheque')
    if (cheque.status === 'CLEARED' && cheque.journalEntryId) {
      throw new Error('Cheque already cleared')
    }

    // Get AR account (default: 1121 - ลูกหนี้การค้า)
    const arAccount = await tx.chartOfAccount.findFirst({
      where: { code: '1121' }
    })

    if (!arAccount) {
      throw new Error('Accounts Receivable GL account not found (code: 1121)')
    }

    // Generate journal entry number
    const count = await tx.journalEntry.count()
    const entryNo = `CHQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

    let lineNo = 1

    // Create journal entry for received cheque clearing
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNo,
        date: clearedDate,
        description: `เช็ครับเลขที่ ${cheque.chequeNo} ผ่าน ${cheque.bankAccount.bankName}`,
        reference: cheque.chequeNo,
        documentType: 'CHEQUE_RECEIVE',
        documentId: cheque.id,
        status: 'POSTED',
        createdById: userId,
        lines: {
          create: [
            {
              lineNo: lineNo++,
              accountId: cheque.bankAccount.glAccountId,
              description: `เช็ครับเลขที่ ${cheque.chequeNo} จาก ${cheque.payeeName || 'ลูกหนี้'}`,
              debit: cheque.amount,
              credit: 0,
            },
            {
              lineNo: lineNo++,
              accountId: arAccount.id,
              description: `เช็ครับเลขที่ ${cheque.chequeNo} จาก ${cheque.payeeName || 'ลูกหนี้'}`,
              debit: 0,
              credit: cheque.amount,
            }
          ]
        }
      }
    })

    // Update cheque with journal entry ID and cleared status
    await tx.cheque.update({
      where: { id: chequeId },
      data: {
        status: 'CLEARED',
        clearedDate,
        journalEntryId: journalEntry.id
      }
    })

    return journalEntry
  })
}

/**
 * Create journal entry when a PAYMENT cheque is cleared
 * Debit: Accounts Payable (Liability reduction)
 * Credit: Bank Account (Asset reduction)
 */
export async function createPaymentChequeJournalEntry(
  chequeId: string,
  clearedDate: Date,
  userId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const cheque = await tx.cheque.findUnique({
      where: { id: chequeId },
      include: { bankAccount: true }
    })

    if (!cheque) throw new Error('Cheque not found')
    if (cheque.type !== 'PAY') throw new Error('Not a payment cheque')
    if (cheque.status === 'CLEARED' && cheque.journalEntryId) {
      throw new Error('Cheque already cleared')
    }

    // Get AP account (default: 2110 - เจ้าหนี้การค้า)
    const apAccount = await tx.chartOfAccount.findFirst({
      where: { code: '2110' }
    })

    if (!apAccount) {
      throw new Error('Accounts Payable GL account not found (code: 2110)')
    }

    // Generate journal entry number
    const count = await tx.journalEntry.count()
    const entryNo = `CHQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

    let lineNo = 1

    // Create journal entry for payment cheque clearing
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNo,
        date: clearedDate,
        description: `เช็คจ่ายเลขที่ ${cheque.chequeNo} ผ่าน ${cheque.bankAccount.bankName}`,
        reference: cheque.chequeNo,
        documentType: 'CHEQUE_PAY',
        documentId: cheque.id,
        status: 'POSTED',
        createdById: userId,
        lines: {
          create: [
            {
              lineNo: lineNo++,
              accountId: apAccount.id,
              description: `เช็คจ่ายเลขที่ ${cheque.chequeNo} ให้ ${cheque.payeeName || 'เจ้าหนี้'}`,
              debit: cheque.amount,
              credit: 0,
            },
            {
              lineNo: lineNo++,
              accountId: cheque.bankAccount.glAccountId,
              description: `เช็คจ่ายเลขที่ ${cheque.chequeNo} ให้ ${cheque.payeeName || 'เจ้าหนี้'}`,
              debit: 0,
              credit: cheque.amount,
            }
          ]
        }
      }
    })

    // Update cheque with journal entry ID and cleared status
    await tx.cheque.update({
      where: { id: chequeId },
      data: {
        status: 'CLEARED',
        clearedDate,
        journalEntryId: journalEntry.id
      }
    })

    return journalEntry
  })
}

/**
 * Main function to clear a cheque and create GL entries
 * Routes to the appropriate function based on cheque type
 */
export async function clearCheque(
  chequeId: string,
  clearedDate: Date,
  userId?: string
) {
  const cheque = await prisma.cheque.findUnique({ where: { id: chequeId } })

  if (!cheque) throw new Error('Cheque not found')
  if (cheque.status === 'CLEARED') throw new Error('Cheque already cleared')
  if (cheque.status === 'CANCELLED') throw new Error('Cannot clear cancelled cheque')
  if (cheque.status === 'BOUNCED') throw new Error('Cannot clear bounced cheque')

  if (cheque.type === 'RECEIVE') {
    return createReceivedChequeJournalEntry(chequeId, clearedDate, userId)
  } else {
    return createPaymentChequeJournalEntry(chequeId, clearedDate, userId)
  }
}

/**
 * Handle bounced cheque - create reversing entry
 */
export async function bounceCheque(
  chequeId: string,
  bouncedDate: Date,
  reason?: string,
  userId?: string
) {
  const cheque = await prisma.cheque.findUnique({
    where: { id: chequeId },
    include: { bankAccount: true }
  })

  if (!cheque) throw new Error('Cheque not found')
  if (!cheque.journalEntryId) throw new Error('No journal entry found for this cheque')
  if (cheque.status === 'BOUNCED') throw new Error('Cheque already marked as bounced')

  const existingEntry = await prisma.journalEntry.findUnique({
    where: { id: cheque.journalEntryId },
    include: { lines: true }
  })

  if (!existingEntry) throw new Error('Original journal entry not found')

  // Generate reversing entry number
  const count = await prisma.journalEntry.count()
  const entryNo = `CHQ-REV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

  let lineNo = 1

  // Create reversing entry (swap debit/credit)
  const reversingEntry = await prisma.journalEntry.create({
    data: {
      entryNo,
      date: bouncedDate,
      description: `เช็คเลขที่ ${cheque.chequeNo} เด้ง${reason ? ` (${reason})` : ''}`,
      reference: cheque.chequeNo,
      documentType: 'CHEQUE_BOUNCE',
      documentId: cheque.id,
      status: 'POSTED',
      isReversing: true,
      reversingId: existingEntry.id,
      createdById: userId,
      lines: {
        create: existingEntry.lines.map(line => ({
          lineNo: lineNo++,
          accountId: line.accountId,
          description: `เช็คเด้งเลขที่ ${cheque.chequeNo}`,
          debit: line.credit, // Swap credit to debit
          credit: line.debit, // Swap debit to credit
        }))
      }
    }
  })

  // Mark original entry as reversed
  await prisma.journalEntry.update({
    where: { id: existingEntry.id },
    data: { status: 'REVERSED' }
  })

  // Update cheque status
  await prisma.cheque.update({
    where: { id: chequeId },
    data: {
      status: 'BOUNCED',
      clearedDate: bouncedDate
    }
  })

  return reversingEntry
}
