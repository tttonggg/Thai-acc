import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-utils'
import { generateDocNumber } from '@/lib/api-utils'
import { checkPeriodStatus } from '@/lib/period-service'

// POST - Post receipt (create journal entry)
// Debits Cash/Bank and credits AR for customer payments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ACCOUNTANT or ADMIN role
    const user = await requireRole(['ADMIN', 'ACCOUNTANT'], request)

    const { id } = await params

    // B1. Period Locking - Check receipt date before transaction
    const receipt = await db.receipt.findUnique({
      where: { id },
      select: { receiptDate: true, status: true }
    })

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสร็จรับเงิน' },
        { status: 404 }
      )
    }

    if (receipt.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'ใบเสร็จรับเงินถูกลงบัญชีแล้ว' },
        { status: 400 }
      )
    }

    const periodCheck = await checkPeriodStatus(receipt.receiptDate)
    if (!periodCheck.isValid) {
      return NextResponse.json(
        { success: false, error: periodCheck.error },
        { status: 400 }
      )
    }

    // Execute in transaction for data consistency
    const result = await db.$transaction(
      async (tx) => {
        // Get receipt with all related data
        const receipt = await tx.receipt.findUnique({
          where: { id },
          include: {
            customer: true,
            bankAccount: true,
            allocations: {
              include: {
                invoice: true,
              }
            }
          }
        })

        if (!receipt) {
          throw new Error('ไม่พบใบเสร็จรับเงิน')
        }

        // Get GL accounts
        // Cash (1110) or Bank based on payment method
        let cashAccountId: string | null = null
        if (receipt.paymentMethod === 'CASH') {
          // Find cash account (1110 - เงินสดและเงินฝากธนาคาร)
          const cashAccount = await tx.chartOfAccount.findFirst({
            where: { code: '1110' }
          })
          cashAccountId = cashAccount?.id || null
        } else {
          // Bank account or use bank account's GL account
          if (receipt.bankAccount?.glAccountId) {
            cashAccountId = receipt.bankAccount.glAccountId
          } else {
            // Fallback: find any bank account
            const bankAccount = await tx.chartOfAccount.findFirst({
              where: { code: { startsWith: '111' } }
            })
            cashAccountId = bankAccount?.id || null
          }
        }

        if (!cashAccountId) {
          throw new Error('ไม่พบบัญชีเงินสด/ธนาคาร')
        }

        // AR account (1120 - ลูกหนี้การค้า)
        const arAccount = await tx.chartOfAccount.findFirst({
          where: { code: '1120' }
        })

        if (!arAccount) {
          throw new Error('ไม่พบบัญชีลูกหนี้การค้า')
        }

        // WHT Payable account (2131 - ภาษีเงินได้หัก ณ ที่จ่าย)
        const whtPayableAccount = await tx.chartOfAccount.findFirst({
          where: { code: '2131' }
        })

        // Generate journal entry number using utility
        const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE')

        // Calculate total WHT
        const totalWht = receipt.whtAmount

        // Create journal entry lines
        const journalLines: Array<{
          lineNo: number
          accountId: string
          description: string
          debit: number
          credit: number
        }> = []

        let lineNo = 1

        // Debit: Cash/Bank for total amount received
        journalLines.push({
          lineNo: lineNo++,
          accountId: cashAccountId,
          description: `รับเงินจาก ${receipt.customer.name}`,
          debit: receipt.amount,
          credit: 0,
        })

        // Calculate total allocations
        const totalAllocations = receipt.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)

        // Credit: AR for each invoice allocation
        for (const alloc of receipt.allocations) {
          journalLines.push({
            lineNo: lineNo++,
            accountId: arAccount.id,
            description: `ชำระ ${alloc.invoice.invoiceNo}`,
            debit: 0,
            credit: alloc.amount,
          })
        }

        // Credit: WHT Payable (if any)
        if (totalWht > 0 && whtPayableAccount) {
          journalLines.push({
            lineNo: lineNo++,
            accountId: whtPayableAccount.id,
            description: `ภาษีหัก ณ ที่จ่าย`,
            debit: 0,
            credit: totalWht,
          })
        }

        // Credit: Unallocated amount to AR (advance payment from customer)
        // This ensures the journal entry is always balanced
        const totalCredits = totalAllocations + totalWht
        const unallocated = receipt.amount - totalCredits
        if (unallocated > 0) {
          journalLines.push({
            lineNo: lineNo++,
            accountId: arAccount.id,
            description: `เงินรับล่วงหน้า/รอจัดสรร`,
            debit: 0,
            credit: unallocated,
          })
        }

        // Calculate total for balancing
        const totalDebit = journalLines.reduce((sum, line) => sum + line.debit, 0)
        const totalCredit = journalLines.reduce((sum, line) => sum + line.credit, 0)

        // Create journal entry
        const journalEntry = await tx.journalEntry.create({
          data: {
            entryNo,
            date: receipt.receiptDate,
            description: `รับเงินจากลูกค้า ${receipt.customer.name} เลขที่ ${receipt.receiptNo}`,
            reference: receipt.receiptNo,
            documentType: 'RECEIPT',
            documentId: receipt.id,
            totalDebit,
            totalCredit,
            status: 'POSTED',
            createdById: user.id,
            approvedById: user.id,
            approvedAt: new Date(),
            lines: {
              create: journalLines
            }
          }
        })

        // Update invoice paid amounts and status
        for (const alloc of receipt.allocations) {
          // Increment paid amount
          await tx.invoice.update({
            where: { id: alloc.invoiceId },
            data: {
              paidAmount: {
                increment: alloc.amount,
              }
            }
          })

          // Get updated invoice to check status
          const updatedInvoice = await tx.invoice.findUnique({
            where: { id: alloc.invoiceId }
          })

          if (updatedInvoice) {
            const balance = updatedInvoice.totalAmount - updatedInvoice.paidAmount
            let newStatus = updatedInvoice.status

            if (balance <= 0.01) {
              newStatus = 'PAID'
            } else if (updatedInvoice.paidAmount > 0) {
              newStatus = 'PARTIAL'
            }

            await tx.invoice.update({
              where: { id: alloc.invoiceId },
              data: { status: newStatus }
            })
          }
        }

        // Update receipt status to POSTED
        const updatedReceipt = await tx.receipt.update({
          where: { id },
          data: {
            status: 'POSTED',
            journalEntryId: journalEntry.id,
          },
          include: {
            customer: true,
            bankAccount: true,
            allocations: {
              include: {
                invoice: true,
              }
            },
            journalEntry: true,
          }
        })

        return updatedReceipt
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error posting receipt:', error)

    const errorMessage = error.message || 'เกิดข้อผิดพลาดในการลงบัญชีใบเสร็จรับเงิน'

    // Determine appropriate status code
    let statusCode = 500
    if (errorMessage.includes('ไม่พบ')) {
      statusCode = 404
    } else if (errorMessage.includes('ไม่มีสิทธิ์')) {
      statusCode = 403
    } else if (errorMessage.includes('ถูกลงบัญชีแล้ว')) {
      statusCode = 400
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}
