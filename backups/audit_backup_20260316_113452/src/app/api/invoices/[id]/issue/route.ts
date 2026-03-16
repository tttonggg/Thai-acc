import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError } from "@/lib/api-utils"
import { recordStockMovement } from "@/lib/inventory-service"

// POST /api/invoices/[id]/issue - Issue invoice
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
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
    
    // Update status to issued
    const invoice = await db.invoice.update({
      where: { id },
      data: { status: "ISSUED" }
    })

    // Create VAT record
    await db.vatRecord.create({
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

    // Record stock movements for inventory items
    try {
      // Get default warehouse
      const inventoryConfig = await db.inventoryConfig.findUnique({
        where: { id: "default" }
      })

      if (!inventoryConfig?.defaultWarehouseId) {
        // Skip stock movement recording if no warehouse configured
      } else {
        // Get product details for cost price
        const productIds = existing.lines
          .map(line => line.productId)
          .filter((id): id is string => id !== null)

        if (productIds.length > 0) {
          const products = await db.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, costPrice: true, isInventory: true }
          })

          const productMap = new Map(products.map(p => [p.id, p]))

          // Process each line item
          for (const line of existing.lines) {
            if (!line.productId) continue

            const product = productMap.get(line.productId)
            if (!product || !product.isInventory) continue

            // Record stock movement (ISSUE = negative quantity for outgoing stock)
            await recordStockMovement({
              productId: line.productId,
              warehouseId: inventoryConfig.defaultWarehouseId,
              type: "ISSUE",
              quantity: line.quantity, // Positive quantity, type ISSUE handles outgoing
              unitCost: product.costPrice,
              referenceId: existing.id,
              referenceNo: existing.invoiceNo,
              notes: `ออกใบกำกับภาษี่ ${existing.invoiceNo}`,
              sourceChannel: "INVOICE"
            })
          }
        }
      }
    } catch (stockError) {
      // Stock movement recording failed but don't fail the invoice issuance
      // Continue with successful response
    }

    // Create COGS journal entry for inventory items
    try {
      // Get product details for cost price
      const productIds = existing.lines
        .map(line => line.productId)
        .filter((id): id is string => id !== null)

      if (productIds.length > 0) {
        const products = await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, costPrice: true, isInventory: true }
        })

        const productMap = new Map(products.map(p => [p.id, p]))

        // Calculate total COGS for inventory items
        let totalCOGS = 0
        for (const line of existing.lines) {
          if (!line.productId) continue

          const product = productMap.get(line.productId)
          if (product && product.isInventory) {
            totalCOGS += product.costPrice * line.quantity
          }
        }

        // Only create journal entry if there are inventory items with cost
        if (totalCOGS > 0) {
          // Get COGS expense account (5110) and Inventory asset account (1140)
          const cogsAccount = await db.chartOfAccount.findUnique({
            where: { code: '5110' }
          })

          const inventoryAccount = await db.chartOfAccount.findUnique({
            where: { code: '1140' }
          })

          if (cogsAccount && inventoryAccount) {
            // Generate journal entry number
            const now = new Date()
            const thaiYear = now.getFullYear() + 543
            const prefix = `JV-${thaiYear}`

            const lastEntry = await db.journalEntry.findFirst({
              where: { entryNo: { startsWith: prefix } },
              orderBy: { entryNo: 'desc' },
              select: { entryNo: true }
            })

            let nextNum = 1
            if (lastEntry) {
              const parts = lastEntry.entryNo.split('-')
              const lastNum = parseInt(parts[parts.length - 1] || '0', 10)
              nextNum = lastNum + 1
            }

            const entryNo = `${prefix}-${String(nextNum).padStart(4, '0')}`

            // Create journal entry for COGS
            const journalEntry = await db.journalEntry.create({
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

            // Update invoice with journal entry ID
            await db.invoice.update({
              where: { id },
              data: { journalEntryId: journalEntry.id }
            })

          } else {
            // COGS or Inventory account not found, skipping COGS journal entry
          }
        }
      }
    } catch (cogsError) {
      // COGS journal entry creation failed but don't fail the invoice issuance
      // Continue with successful response
    }

    return apiResponse({ message: "ออกใบกำกับภาษีสำเร็จ", invoice })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการออกใบกำกับภาษี")
  }
}
