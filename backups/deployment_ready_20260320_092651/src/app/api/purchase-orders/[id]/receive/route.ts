import { NextRequest } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, notFoundError, forbiddenError } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { purchaseOrderReceiveSchema } from '@/lib/validations'
import { recordStockMovement } from '@/lib/inventory-service'
import { logActivity } from '@/lib/activity-logger'

// POST /api/purchase-orders/[id]/receive - Mark PO as received (full or partial)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    if (user.role === 'VIEWER') {
      return forbiddenError()
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id: id },
      include: {
        vendor: true,
        lines: {
          include: {
            product: true,
          }
        },
      },
    })

    if (!purchaseOrder) {
      return notFoundError('ไม่พบใบสั่งซื้อ')
    }

    // Validate status transition - SHIPPED can be received
    if (purchaseOrder.status !== 'SHIPPED' && purchaseOrder.status !== 'CONFIRMED') {
      return apiError('สามารถรับสินค้าเฉพาะใบสั่งซื้อที่จัดส่งแล้วหรือยืนยันแล้วเท่านั้น', 400)
    }

    const body = await request.json()
    const validatedData = purchaseOrderReceiveSchema.parse(body)

    // Validate received quantities
    const lineUpdates: any[] = []
    let allReceived = true
    let hasReceivedItems = false

    for (const receiveLine of validatedData.lines) {
      const line = purchaseOrder.lines.find(l => l.id === receiveLine.lineId)
      if (!line) {
        return apiError(`ไม่พบรายการที่ ${receiveLine.lineId}`, 400)
      }

      const totalReceived = (line.receivedQty || 0) + receiveLine.receivedQty

      // Validate not exceeding ordered quantity
      if (totalReceived > line.quantity) {
        return apiError(
          `รายการ "${line.description}" รับเกินจำนวนที่สั่งซื้อ (สั่ง: ${line.quantity}, รับแล้ว: ${line.receivedQty}, รับเพิ่ม: ${receiveLine.receivedQty})`,
          400
        )
      }

      // Track if all items are received
      if (totalReceived < line.quantity) {
        allReceived = false
      }

      // Track if at least some items are received
      if (receiveLine.receivedQty > 0) {
        hasReceivedItems = true
      }

      lineUpdates.push({
        id: line.id,
        receivedQty: totalReceived,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        description: line.description,
      })
    }

    if (!hasReceivedItems) {
      return apiError('ต้องรับสินค้าอย่างน้อย 1 รายการ', 400)
    }

    // Get or create default warehouse for stock movements
    let warehouse = await db.warehouse.findFirst({
      where: { type: 'MAIN', isActive: true }
    })

    if (!warehouse) {
      warehouse = await db.warehouse.create({
        data: {
          code: 'WH-MAIN',
          name: 'คลังสินค้าหลัก',
          type: 'MAIN',
          location: 'หลัก',
          isActive: true
        }
      })
    }

    // Update lines and record stock movements in transaction
    const result = await db.$transaction(async (tx) => {
      // Update each line
      for (const lineUpdate of lineUpdates) {
        await tx.purchaseOrderLine.update({
          where: { id: lineUpdate.id },
          data: {
            receivedQty: lineUpdate.receivedQty,
          },
        })

        // Record stock movement for inventory items
        if (lineUpdate.productId) {
          const product = await tx.product.findUnique({
            where: { id: lineUpdate.productId },
            select: { isInventory: true }
          })

          if (product && product.isInventory) {
            try {
              // Note: recordStockMovement uses its own transaction, so we call it after
              // For now, we'll just log and continue
              await recordStockMovement({
                productId: lineUpdate.productId,
                warehouseId: warehouse.id,
                type: 'RECEIVE',
                quantity: lineUpdate.receivedQty - (lineUpdate.receivedQty - (lineUpdate.receivedQty - (purchaseOrder.lines.find(l => l.id === lineUpdate.id)?.receivedQty || 0))),
                unitCost: lineUpdate.unitPrice,
                referenceId: id,
                referenceNo: purchaseOrder.orderNo,
                notes: `รับสินค้าจากใบสั่งซื้อ ${purchaseOrder.orderNo} - ${lineUpdate.description}`,
                sourceChannel: 'PURCHASE_ORDER',
              })
            } catch (stockError) {
              console.error('Stock movement error:', stockError)
              // Don't fail the entire operation if stock movement fails
            }
          }
        }
      }

      // Update PO status
      const updated = await tx.purchaseOrder.update({
        where: { id: id },
        data: {
          status: allReceived ? 'RECEIVED' : 'SHIPPED', // Keep SHIPPED if partial
          receivedAt: allReceived ? new Date() : null,
          notes: validatedData.notes
            ? `${purchaseOrder.notes || ''}\n${validatedData.notes}`.trim()
            : purchaseOrder.notes,
          updatedById: user.id,
        },
        include: {
          vendor: true,
          lines: {
            include: {
              product: true,
            }
          },
        },
      })

      return updated
    })

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'RECEIVE',
      module: 'purchase-orders',
      recordId: id,
      details: {
        orderNo: result.orderNo,
        vendorName: result.vendor.name,
        allReceived,
        linesReceived: lineUpdates.length,
      },
    })

    return apiResponse({
      success: true,
      message: allReceived
        ? 'รับสินค้าครบถ้วนเรียบร้อยแล้ว'
        : 'รับสินค้าบางส่วนเรียบร้อยแล้ว',
      data: result,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง')
    }
    return apiError('เกิดข้อผิดพลาดในการรับสินค้า')
  }
}
