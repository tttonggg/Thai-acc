import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, generateDocNumber } from "@/lib/api-utils"
import { recordStockMovement } from "@/lib/inventory-service"

// POST /api/purchases/[id]/post - Post purchase invoice (receive from supplier)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์รับใบซื้อ", 403)
    }

    const existing = await db.purchaseInvoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        lines: true
      }
    })

    if (!existing) {
      return notFoundError("ไม่พบใบซื้อ")
    }

    if (existing.status !== "DRAFT") {
      return apiError("ใบซื้อนี้ถูกรับแล้ว")
    }

    if (existing.lines.length === 0) {
      return apiError("ใบซื้อต้องมีอย่างน้อย 1 รายการ")
    }

    // Update status to POSTED
    const purchase = await db.purchaseInvoice.update({
      where: { id },
      data: { status: "POSTED" }
    })

    // Create VAT INPUT record (ภาษีซื้อ)
    await db.vatRecord.create({
      data: {
        type: "INPUT",
        documentNo: existing.invoiceNo,
        documentDate: existing.invoiceDate,
        documentType: "PURCHASE_INVOICE",
        referenceId: existing.id,
        vendorId: existing.vendorId,
        vendorName: existing.vendor.name,
        vendorTaxId: existing.vendor.taxId,
        description: existing.vendorInvoiceNo || `ใบกำกับภาษีจากผู้ขาย ${existing.invoiceNo}`,
        subtotal: existing.subtotal,
        vatRate: existing.vatRate || 7,
        vatAmount: existing.vatAmount,
        totalAmount: existing.totalAmount,
        taxMonth: existing.invoiceDate.getMonth() + 1,
        taxYear: existing.invoiceDate.getFullYear(),
      }
    })

    // Record stock movements for inventory items
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

            // Record stock movement (RECEIVE = positive quantity for incoming stock)
            await recordStockMovement({
              productId: line.productId,
              warehouseId: inventoryConfig.defaultWarehouseId,
              type: "RECEIVE",
              quantity: line.quantity,
              unitCost: product.costPrice,
              referenceId: existing.id,
              referenceNo: existing.invoiceNo,
              notes: `รับสินค้าจากผู้ขาย ${existing.vendor.name}`,
              sourceChannel: "PURCHASE"
            })
          }
        }
      }
    } catch (stockError) {
      // Stock movement failed but don't fail the posting
      console.error("Stock movement error:", stockError)
    }

    // Create journal entries for the purchase
    try {
      // Get accounts: Inventory (1140), VAT Input (1145), AP (2110)
      const inventoryAccount = await db.chartOfAccount.findUnique({
        where: { code: '1140' }
      })

      const vatInputAccount = await db.chartOfAccount.findUnique({
        where: { code: '1145' }
      })

      const apAccount = await db.chartOfAccount.findUnique({
        where: { code: '2110' }
      })

      if (inventoryAccount && vatInputAccount && apAccount) {
        const entryNo = await generateDocNumber('JOURNAL_ENTRY', 'JE')

        const totalAmount = existing.totalAmount
        const subtotal = existing.subtotal
        const vatAmount = existing.vatAmount

        // Create journal entry
        const journalEntry = await db.journalEntry.create({
          data: {
            entryNo,
            date: existing.invoiceDate,
            description: `ซื้อสินค้าจาก ${existing.vendor.name}`,
            reference: existing.invoiceNo,
            documentType: 'PURCHASE_INVOICE',
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
                  accountId: inventoryAccount.id,
                  description: 'สินค้าคงเหลือ',
                  debit: subtotal,
                  credit: 0,
                  reference: existing.invoiceNo
                },
                {
                  lineNo: 2,
                  accountId: vatInputAccount.id,
                  description: 'ภาษีมูลค่าเพิ่มซื้อ',
                  debit: vatAmount,
                  credit: 0,
                  reference: existing.invoiceNo
                },
                {
                  lineNo: 3,
                  accountId: apAccount.id,
                  description: `เจ้าหนี้ ${existing.vendor.name}`,
                  debit: 0,
                  credit: totalAmount,
                  reference: existing.invoiceNo
                }
              ]
            }
          }
        })

        // Update purchase invoice with journal entry ID
        await db.purchaseInvoice.update({
          where: { id },
          data: { journalEntryId: journalEntry.id }
        })
      }
    } catch (journalError) {
      // Journal entry creation failed but don't fail the posting
      console.error("Journal entry error:", journalError)
    }

    return apiResponse({
      message: "รับใบซื้อสำเร็จ",
      purchase
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการรับใบซื้อ")
  }
}
