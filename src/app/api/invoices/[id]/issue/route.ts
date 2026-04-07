import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { generateDocNumber, requireAuth, apiResponse, apiError, notFoundError, unauthorizedError } from "@/lib/api-utils"
import { checkPeriodStatus } from "@/lib/period-service"

// POST /api/invoices/[id]/issue - Issue invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์ออกใบกำกับภาษี", 403)
    }

    const existing = await db.invoice.findUnique({
      where: { id },
      include: {
        lines: true,
        customer: true
      }
    })

    if (!existing) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }

    if (existing.status !== "DRAFT") {
      return apiError("ใบกำกับภาษีนี้ออกแล้ว")
    }

    if (existing.lines.length === 0) {
      return apiError("ใบกำกับภาษีต้องมีอย่างน้อย 1 รายการ")
    }

    // B1. Period Locking - Check if period is open
    const periodCheck = await checkPeriodStatus(existing.invoiceDate)
    if (!periodCheck.isValid) {
      return apiError(periodCheck.error || "ไม่สามารถออกใบกำกับภาษีในงวดที่ปิดแล้ว")
    }

    // Execute all operations in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create VAT record
      await tx.vatRecord.create({
        data: {
          type: "OUTPUT",
          documentNo: existing.invoiceNo,
          documentDate: existing.invoiceDate,
          documentType: "INVOICE",
          referenceId: existing.id,
          customerId: existing.customerId,
          customerName: existing.customer.name,
          customerTaxId: existing.customer.taxId,
          description: existing.description || `ใบกำกับภาษี ${existing.invoiceNo}`,
          subtotal: existing.subtotal,
          vatRate: existing.vatRate,
          vatAmount: existing.vatAmount,
          totalAmount: existing.totalAmount,
          taxMonth: existing.invoiceDate.getMonth() + 1,
          taxYear: existing.invoiceDate.getFullYear(),
        }
      })

      // 2. Create COGS journal entry for inventory items (if applicable)
      const productIds = existing.lines
        .map(line => line.productId)
        .filter((id): id is string => id !== null)

      let cogsJournalEntryId: string | null = null

      if (productIds.length > 0) {
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, costPrice: true, isInventory: true }
        })

        const productMap = new Map(products.map(p => [p.id, p]))

        let totalCOGS = 0
        for (const line of existing.lines) {
          if (!line.productId) continue

          const product = productMap.get(line.productId)
          if (product && product.isInventory) {
            totalCOGS += product.costPrice * line.quantity
          }
        }

        if (totalCOGS > 0) {
          const cogsAccount = await tx.chartOfAccount.findUnique({
            where: { code: '5110' }
          })

          const inventoryAccount = await tx.chartOfAccount.findUnique({
            where: { code: '1140' }
          })

          if (!cogsAccount || !inventoryAccount) {
            throw new Error(`ไม่พบบัญชี: COGS (5110) หรือ สินค้าคงเหลือ (1140)`)
          }

          const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE')

          const cogsJournalEntry = await tx.journalEntry.create({
            data: {
              entryNo,
              date: existing.invoiceDate,
              description: `ต้นทุนขาย ${existing.invoiceNo}`,
              reference: existing.invoiceNo,
              documentType: 'INVOICE',
              documentId: existing.id,
              totalDebit: totalCOGS,
              totalCredit: totalCOGS,
              status: 'POSTED',
              createdById: user.id,
              approvedById: user.id,
              approvedAt: new Date(),
              lines: {
                create: [
                  {
                    lineNo: 1,
                    accountId: cogsAccount.id,
                    description: 'ต้นทุนขาย',
                    debit: totalCOGS,
                    credit: 0,
                    reference: existing.invoiceNo
                  },
                  {
                    lineNo: 2,
                    accountId: inventoryAccount.id,
                    description: 'ลดสินค้าคงเหลือ',
                    debit: 0,
                    credit: totalCOGS,
                    reference: existing.invoiceNo
                  }
                ]
              }
            }
          })

          cogsJournalEntryId = cogsJournalEntry.id
        }
      }

      // 3. Create Revenue journal entry
      const arAccount = await tx.chartOfAccount.findUnique({
        where: { code: '1120' }
      })

      const revenueAccount = await tx.chartOfAccount.findUnique({
        where: { code: '4100' }
      })

      const vatOutputAccount = await tx.chartOfAccount.findUnique({
        where: { code: '2132' }
      })

      if (!arAccount || !revenueAccount || !vatOutputAccount) {
        throw new Error(`ไม่พบบัญชี: AR (1120), รายได้ (4100), หรือ VAT ขาย (2132)`)
      }

      const totalAmount = existing.totalAmount
      const subtotal = existing.subtotal
      const vatAmount = existing.vatAmount

      // Validate amounts
      if (subtotal + vatAmount !== totalAmount) {
        throw new Error(`ยอดไม่ถูกต้อง: subtotal(${subtotal}) + vat(${vatAmount}) != total(${totalAmount})`)
      }

      const revenueEntryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE')

      await tx.journalEntry.create({
        data: {
          entryNo: revenueEntryNo,
          date: existing.invoiceDate,
          description: `รายได้ขาย ${existing.invoiceNo}`,
          reference: existing.invoiceNo,
          documentType: 'INVOICE_REVENUE',
          documentId: existing.id,
          totalDebit: totalAmount,
          totalCredit: totalAmount,
          status: 'POSTED',
          createdById: user.id,
          approvedById: user.id,
          approvedAt: new Date(),
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: arAccount.id,
                description: 'ลูกหนี้การค้า',
                debit: totalAmount,
                credit: 0,
                reference: existing.invoiceNo
              },
              {
                lineNo: 2,
                accountId: revenueAccount.id,
                description: 'รายได้ขาย',
                debit: 0,
                credit: subtotal,
                reference: existing.invoiceNo
              },
              {
                lineNo: 3,
                accountId: vatOutputAccount.id,
                description: 'ภาษีมูลค่าเพิ่มขาย',
                debit: 0,
                credit: vatAmount,
                reference: existing.invoiceNo
              }
            ]
          }
        }
      })

      // 4. Update invoice status to ISSUED and link COGS journal entry
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          status: "ISSUED",
          journalEntryId: cogsJournalEntryId
        }
      })

      return invoice
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    // 5. Record stock movements AFTER transaction commits (outside transaction)
    // This is done separately to avoid nested transaction issues
    try {
      const inventoryConfig = await db.inventoryConfig.findUnique({
        where: { id: "default" }
      })

      if (inventoryConfig?.defaultWarehouseId) {
        const productIds = existing.lines
          .map(line => line.productId)
          .filter((id): id is string => id !== null)

        if (productIds.length > 0) {
          const products = await db.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, costPrice: true, isInventory: true }
          })

          const productMap = new Map(products.map(p => [p.id, p]))

          for (const line of existing.lines) {
            if (!line.productId) continue

            const product = productMap.get(line.productId)
            if (!product || !product.isInventory) continue

            // Record stock movement
            const existingBalance = await db.stockBalance.findUnique({
              where: {
                productId_warehouseId: {
                  productId: line.productId,
                  warehouseId: inventoryConfig.defaultWarehouseId
                }
              }
            })

            const newQty = (existingBalance?.quantity || 0) - line.quantity

            if (newQty < 0) {
              console.warn(`Insufficient stock for product ${line.productId}: available ${existingBalance?.quantity || 0}, needed ${line.quantity}`)
            }

            await db.stockMovement.create({
              data: {
                productId: line.productId,
                warehouseId: inventoryConfig.defaultWarehouseId,
                type: 'ISSUE',
                quantity: line.quantity,
                unitCost: product.costPrice,
                referenceId: existing.id,
                referenceNo: existing.invoiceNo,
                notes: `ออกใบกำกับภาษี ${existing.invoiceNo}`,
                sourceChannel: 'INVOICE',
                balanceAfter: Math.max(0, newQty)
              }
            })

            await db.stockBalance.update({
              where: {
                productId_warehouseId: {
                  productId: line.productId,
                  warehouseId: inventoryConfig.defaultWarehouseId
                }
              },
              data: {
                quantity: Math.max(0, newQty),
                totalCost: Math.max(0, newQty) * product.costPrice
              }
            })
          }
        }
      }
    } catch (stockError) {
      // Log stock movement errors but don't fail the invoice
      console.error('Stock movement recording failed:', stockError)
    }

    return apiResponse({ message: "ออกใบกำกับภาษีสำเร็จ", invoice: result })
  } catch (error) {
    console.error('Error issuing invoice:', error)
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการออกใบกำกับภาษี")
  }
}
