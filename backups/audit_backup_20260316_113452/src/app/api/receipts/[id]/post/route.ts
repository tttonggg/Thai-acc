import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'

// POST - Post receipt (create journal entry)
// FIXED: Added authorization check and transaction boundary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIXED: Check authorization - only ADMIN and ACCOUNTANT can post receipts
    const user = await requireAuth()
    if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTANT') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ลงบัญชีใบเสร็จรับเงิน' },
        { status: 403 }
      )
    }

    const { id } = await params

    // ✅ FIXED: Wrap all operations in a transaction for data consistency
    const result = await prisma.$transaction(
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

        if (receipt.status !== 'DRAFT') {
          throw new Error('ใบเสร็จรับเงินถูกลงบัญชีแล้ว')
        }

        if (receipt.allocations.length === 0) {
          throw new Error('กรุณาจัดจ่ายใบเสร็จรับเงินอย่างน้อย 1 ใบ')
        }

        // Get GL accounts
        // Cash/Bank account based on payment method
        let cashAccountId: string | null = null
        if (receipt.paymentMethod === 'CASH') {
          // Find cash account (1110 - เงินสด)
          const cashAccount = await tx.chartOfAccount.findFirst({
            where: { code: '1110' }
          })
          cashAccountId = cashAccount?.id || null
        } else if (receipt.bankAccountId) {
          cashAccountId = receipt.bankAccount.glAccountId
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

        // WHT Payable account (2130 - ภาษีหัก ณ ที่จ่าย)
        const whtPayableAccount = await tx.chartOfAccount.findFirst({
          where: { code: '2130' }
        })

        // Generate journal entry number
        const journalCount = await tx.journalEntry.count()
        const entryNo = `JE-${String(journalCount + 1).padStart(6, '0')}`

        // Calculate total allocated
        const totalAllocated = receipt.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
        const totalWht = receipt.whtAmount

        // Create journal entry
        const journalEntry = await tx.journalEntry.create({
          data: {
            entryNo,
            date: receipt.receiptDate,
            description: `รับเงินจากลูกค้า ${receipt.customer.name} เลขที่ ${receipt.receiptNo}`,
            reference: receipt.receiptNo,
            documentType: 'RECEIPT',
            documentId: receipt.id,
            totalDebit: receipt.amount,
            totalCredit: receipt.amount,
            status: 'POSTED',
            createdById: user.id,
            approvedById: user.id,
            approvedAt: new Date(),
            lines: {
              create: [
                // Debit: Cash/Bank
                {
                  lineNo: 1,
                  accountId: cashAccountId,
                  description: `รับเงินจาก ${receipt.customer.name}`,
                  debit: receipt.amount,
                  credit: 0,
                },
                // Credit: AR (for each invoice allocation)
                ...receipt.allocations.map((alloc, index) => ({
                  lineNo: 2 + index,
                  accountId: arAccount.id,
                  description: `ชำระ ${alloc.invoice.invoiceNo}`,
                  debit: 0,
                  credit: alloc.amount,
                })),
                // Credit: WHT Payable (if any)
                ...(totalWht > 0 && whtPayableAccount ? [{
                  lineNo: 2 + receipt.allocations.length + 1,
                  accountId: whtPayableAccount.id,
                  description: `ภาษีหัก ณ ที่จ่าย`,
                  debit: 0,
                  credit: totalWht,
                }] : []),
              ]
            }
          }
        })

        // Update invoice paid amounts and status
        for (const alloc of receipt.allocations) {
          await tx.invoice.update({
            where: { id: alloc.invoiceId },
            data: {
              paidAmount: {
                increment: alloc.amount,
              }
            }
          })

          // Update invoice status based on payment
          const invoice = await tx.invoice.findUnique({
            where: { id: alloc.invoiceId }
          })

          if (invoice) {
            const balance = invoice.totalAmount - invoice.paidAmount - alloc.amount
            let newStatus = invoice.status

            if (balance <= 0.01) {
              newStatus = 'PAID'
            } else if (invoice.paidAmount > 0) {
              newStatus = 'PARTIAL'
            }

            await tx.invoice.update({
              where: { id: alloc.invoiceId },
              data: { status: newStatus }
            })
          }
        }

        // Update receipt status
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
        // Transaction configuration
        maxWait: 5000,  // Maximum time to wait for transaction
        timeout: 10000, // Maximum time for transaction to complete
      }
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error posting receipt:', error)

    // Handle specific error messages
    const errorMessage = error.message || 'เกิดข้อผิดพลาดในการลงบัญชีใบเสร็จรับเงิน'

    // Determine appropriate status code
    let statusCode = 500
    if (errorMessage.includes('ไม่พบ') || errorMessage.includes('ไม่มีสิทธิ์')) {
      statusCode = 400
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}
