import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError, generateDocNumber, calculateInvoiceTotals } from "@/lib/api-utils"
import { purchaseInvoiceSchema } from "@/lib/validations"
import { recordStockMovement } from "@/lib/inventory-service"

// GET /api/purchases - List purchase invoices
export async function GET(request: Request) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const vendorId = searchParams.get("vendorId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")
    
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (vendorId) {
      where.vendorId = vendorId
    }
    
    if (startDate || endDate) {
      where.invoiceDate = {}
      if (startDate) where.invoiceDate.gte = new Date(startDate)
      if (endDate) where.invoiceDate.lte = new Date(endDate)
    }
    
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { vendorInvoiceNo: { contains: search } },
        { reference: { contains: search } },
      ]
    }
    
    const [purchases, total] = await Promise.all([
      db.purchaseInvoice.findMany({
        where,
        orderBy: { invoiceDate: "desc" },
        skip,
        take: limit,
        include: {
          vendor: {
            select: { id: true, code: true, name: true, taxId: true }
          },
          lines: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unit: true,
              unitPrice: true,
              amount: true,
              vatAmount: true,
            }
          }
        }
      }),
      db.purchaseInvoice.count({ where })
    ])
    
    return apiResponse({
      success: true,
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบซื้อ")
  }
}

// POST /api/purchases - Create purchase invoice
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    
    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์สร้างใบซื้อ", 403)
    }
    
    const body = await request.json()
    const validatedData = purchaseInvoiceSchema.parse(body)
    
    // Verify vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId }
    })
    
    if (!vendor) {
      return apiError("ไม่พบผู้ขาย")
    }
    
    // Generate invoice number
    const invoiceNo = await generateDocNumber("PURCHASE", "PO")
    
    // Calculate totals
    const totals = calculateInvoiceTotals(
      validatedData.lines,
      validatedData.discountAmount,
      0,
      validatedData.withholdingRate
    )
    
    // Create purchase invoice with lines
    const purchase = await db.purchaseInvoice.create({
      data: {
        invoiceNo,
        vendorInvoiceNo: validatedData.vendorInvoiceNo,
        invoiceDate: new Date(validatedData.invoiceDate),
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        vendorId: validatedData.vendorId,
        type: validatedData.type,
        reference: validatedData.reference,
        poNumber: validatedData.poNumber,
        subtotal: totals.subtotal,
        discountAmount: totals.totalDiscount,
        vatRate: 7,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        withholdingRate: validatedData.withholdingRate,
        withholdingAmount: totals.withholdingAmount,
        netAmount: totals.netAmount,
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
        createdById: user.id,
        lines: {
          create: validatedData.lines.map((line, index) => ({
            lineNo: index + 1,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPrice: line.unitPrice,
            discount: line.discount,
            amount: (line.quantity * line.unitPrice) - line.discount,
            vatRate: line.vatRate,
            vatAmount: ((line.quantity * line.unitPrice) - line.discount) * (line.vatRate / 100),
            notes: line.notes,
          }))
        }
      },
      include: {
        vendor: true,
        lines: true
      }
    })
    
    // Create VAT record for input tax
    await db.vatRecord.create({
      data: {
        type: "INPUT",
        documentNo: purchase.invoiceNo,
        documentDate: purchase.invoiceDate,
        documentType: "PURCHASE",
        referenceId: purchase.id,
        vendorId: purchase.vendorId,
        vendorName: vendor.name,
        vendorTaxId: vendor.taxId,
        description: `ใบซื้อ ${purchase.invoiceNo}`,
        subtotal: purchase.subtotal,
        vatRate: purchase.vatRate,
        vatAmount: purchase.vatAmount,
        totalAmount: purchase.totalAmount,
        taxMonth: purchase.invoiceDate.getMonth() + 1,
        taxYear: purchase.invoiceDate.getFullYear(),
      }
    })
    
    // Update status to issued
    await db.purchaseInvoice.update({
      where: { id: purchase.id },
      data: { status: "ISSUED" }
    })

    // Record stock movements for inventory items
    // Get or create default warehouse
    let warehouse = await db.warehouse.findFirst({
      where: { type: "MAIN", isActive: true }
    })

    if (!warehouse) {
      // Create default warehouse if none exists
      warehouse = await db.warehouse.create({
        data: {
          code: "WH-MAIN",
          name: "คลังสินค้าหลัก",
          type: "MAIN",
          location: "หลัก",
          isActive: true
        }
      })
    }

    // Process each line item for stock movement
    for (const line of purchase.lines) {
      // Only record stock movement for products that track inventory
      if (line.productId) {
        try {
          const product = await db.product.findUnique({
            where: { id: line.productId },
            select: { isInventory: true, costPrice: true }
          })

          // Only record if product is inventory-tracked
          if (product && product.isInventory) {
            await recordStockMovement({
              productId: line.productId,
              warehouseId: warehouse.id,
              type: "RECEIVE",
              quantity: line.quantity,
              unitCost: line.unitPrice,
              referenceId: purchase.id,
              referenceNo: purchase.invoiceNo,
              notes: `รับสินค้าจากใบซื้อ ${purchase.invoiceNo}`,
              sourceChannel: "PURCHASE"
            })
          }
        } catch (stockError) {
          // Stock movement error but don't fail the entire purchase
        }
      }
    }

    return apiResponse(purchase, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง")
    }
    return apiError("เกิดข้อผิดพลาดในการสร้างใบซื้อ")
  }
}
