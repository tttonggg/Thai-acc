import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi, AuthError } from '@/lib/api-auth';
import {
  apiResponse,
  apiError,
  unauthorizedError,
  generateDocNumber,
  calculateInvoiceTotals,
} from '@/lib/api-utils';
import { purchaseInvoiceSchema } from '@/lib/validations';
import { recordStockMovement } from '@/lib/inventory-service';
import { bahtToSatang, satangToBaht } from '@/lib/currency';

// GET /api/purchases - List purchase invoices
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { vendorInvoiceNo: { contains: search } },
        { reference: { contains: search } },
      ];
    }

    // Fetch purchase invoices with vendor and lines in optimized query
    const [purchases, total] = await Promise.all([
      db.purchaseInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              code: true,
              name: true,
              taxId: true,
            },
          },
          lines: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unit: true,
              unitPrice: true,
              amount: true,
              vatAmount: true,
            },
          },
        },
      }),
      db.purchaseInvoice.count({ where }),
    ]);

    // Filter out purchases with null vendors (data integrity issue)
    const validPurchases = purchases.filter((p: any) => p.vendor !== null);

    // Transform data to match frontend interface (flatten vendor.name to vendorName)
    console.log('Raw purchases data:', JSON.stringify(validPurchases, null, 2).substring(0, 500));

    const transformedPurchases = validPurchases.map((purchase: any) => {
      try {
        return {
          ...purchase,
          subtotal: satangToBaht(purchase.subtotal),
          discountAmount: satangToBaht(purchase.discountAmount),
          vatAmount: satangToBaht(purchase.vatAmount),
          totalAmount: satangToBaht(purchase.totalAmount),
          withholdingAmount: satangToBaht(purchase.withholdingAmount),
          netAmount: satangToBaht(purchase.netAmount),
          paidAmount: satangToBaht(purchase.paidAmount || 0),
          vendorName: purchase.vendor?.name || '',
          vendorCode: purchase.vendor?.code || '',
          vendorTaxId: purchase.vendor?.taxId || '',
          invoiceDate: purchase.invoiceDate ? purchase.invoiceDate.toISOString() : '',
          dueDate: purchase.dueDate ? purchase.dueDate.toISOString() : null,
          createdAt: purchase.createdAt ? purchase.createdAt.toISOString() : '',
          updatedAt: purchase.updatedAt ? purchase.updatedAt.toISOString() : '',
          lines:
            purchase.lines?.map((line: any) => ({
              ...line,
              unitPrice: satangToBaht(line.unitPrice),
              discount: satangToBaht(line.discount),
              amount: satangToBaht(line.amount),
              vatAmount: satangToBaht(line.vatAmount),
            })) || [],
        };
      } catch (err) {
        console.error('Error transforming purchase invoice:', purchase.id, err);
        return {
          ...purchase,
          vendorName: '',
          vendorCode: '',
          vendorTaxId: '',
          invoiceDate: '',
          dueDate: null,
          createdAt: '',
          updatedAt: '',
        };
      }
    });

    console.log(
      'Transformed purchases data:',
      JSON.stringify(transformedPurchases, null, 2).substring(0, 500)
    );

    // Return response with pagination included in data object
    return Response.json({
      success: true,
      data: transformedPurchases,
      pagination: {
        page,
        limit,
        total: validPurchases.length, // Use actual count after filtering
        totalPages: Math.ceil(validPurchases.length / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    console.error('Purchases API Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบซื้อ');
  }
}

// POST /api/purchases - Create purchase invoice
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi();

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์สร้างใบซื้อ', 403);
    }

    const body = await request.json();
    const validatedData = purchaseInvoiceSchema.parse(body);

    // Verify vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId },
    });

    if (!vendor) {
      return apiError('ไม่พบผู้ขาย');
    }

    // Generate invoice number
    const invoiceNo = await generateDocNumber('PURCHASE', 'PO');

    // Calculate totals
    const totals = calculateInvoiceTotals(
      validatedData.lines,
      validatedData.discountAmount,
      0,
      validatedData.withholdingRate
    );

    // ✅ H-05: Wrap purchase create + VAT create + status update in atomic transaction
    const purchase = await db.$transaction(async (tx) => {
      // Create purchase invoice with lines
      const newPurchase = await tx.purchaseInvoice.create({
        data: {
          invoiceNo,
          vendorInvoiceNo: validatedData.vendorInvoiceNo,
          invoiceDate: new Date(validatedData.invoiceDate),
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          vendorId: validatedData.vendorId,
          type: validatedData.type,
          reference: validatedData.reference,
          poNumber: validatedData.poNumber,
          subtotal: bahtToSatang(totals.subtotal),
          discountAmount: bahtToSatang(totals.totalDiscount),
          vatRate: 7,
          vatAmount: bahtToSatang(totals.vatAmount),
          totalAmount: bahtToSatang(totals.totalAmount),
          withholdingRate: validatedData.withholdingRate,
          withholdingAmount: bahtToSatang(totals.withholdingAmount),
          netAmount: bahtToSatang(totals.netAmount),
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
              unitPrice: bahtToSatang(line.unitPrice),
              discount: bahtToSatang(line.discount),
              amount: bahtToSatang(line.quantity * line.unitPrice - line.discount),
              vatRate: line.vatRate,
              vatAmount: bahtToSatang(
                (line.quantity * line.unitPrice - line.discount) * (line.vatRate / 100)
              ),
              notes: line.notes,
            })),
          },
        },
        include: {
          vendor: true,
          lines: true,
        },
      });

      // Create VAT record for input tax
      await tx.vatRecord.create({
        data: {
          type: 'INPUT',
          documentNo: newPurchase.invoiceNo,
          documentDate: newPurchase.invoiceDate,
          documentType: 'PURCHASE',
          referenceId: newPurchase.id,
          vendorId: newPurchase.vendorId,
          vendorName: vendor.name,
          vendorTaxId: vendor.taxId,
          description: `ใบซื้อ ${newPurchase.invoiceNo}`,
          subtotal: newPurchase.subtotal,
          vatRate: newPurchase.vatRate,
          vatAmount: newPurchase.vatAmount,
          totalAmount: newPurchase.totalAmount,
          taxMonth: newPurchase.invoiceDate.getMonth() + 1,
          taxYear: newPurchase.invoiceDate.getFullYear(),
        },
      });

      // Update status to issued
      await tx.purchaseInvoice.update({
        where: { id: newPurchase.id },
        data: { status: 'ISSUED' },
      });

      return newPurchase;
    });

    // ✅ OPTIMIZED: Record stock movements for inventory items in batch
    // Get or create default warehouse ONCE
    let warehouse = await db.warehouse.findFirst({
      where: { type: 'MAIN', isActive: true },
    });

    if (!warehouse) {
      // Create default warehouse if none exists
      warehouse = await db.warehouse.create({
        data: {
          code: 'WH-MAIN',
          name: 'คลังสินค้าหลัก',
          type: 'MAIN',
          location: 'หลัก',
          isActive: true,
        },
      });
    }

    // Filter lines that have products
    const productLines = purchase.lines.filter((line) => line.productId);

    if (productLines.length > 0) {
      try {
        // Get all products in ONE query (not in loop)
        const products = await db.product.findMany({
          where: {
            id: { in: productLines.map((line) => line.productId!) },
          },
          select: { id: true, isInventory: true, costPrice: true },
        });

        // Create a map for quick lookup
        const productMap = new Map(products.map((p) => [p.id, p]));

        // Batch record all stock movements in parallel
        await Promise.all(
          productLines.map(async (line) => {
            const product = productMap.get(line.productId!);
            // Only record if product is inventory-tracked
            if (product && product.isInventory) {
              return recordStockMovement({
                productId: line.productId!,
                warehouseId: warehouse.id,
                type: 'RECEIVE',
                quantity: line.quantity,
                unitCost: line.unitPrice,
                referenceId: purchase.id,
                referenceNo: purchase.invoiceNo,
                notes: `รับสินค้าจากใบซื้อ ${purchase.invoiceNo}`,
                sourceChannel: 'PURCHASE',
              }).catch((stockError) => {
                // Stock movement error but don't fail the entire purchase
                console.error('Stock movement error:', stockError);
              });
            }
            return Promise.resolve();
          })
        );
      } catch (stockError) {
        // Stock movement batch error but don't fail the entire purchase
        console.error('Stock batch error:', stockError);
      }
    }

    // Convert Satang to Baht for response
    const purchaseInBaht = {
      ...purchase,
      subtotal: satangToBaht(purchase.subtotal),
      discountAmount: satangToBaht(purchase.discountAmount),
      vatAmount: satangToBaht(purchase.vatAmount),
      totalAmount: satangToBaht(purchase.totalAmount),
      withholdingAmount: satangToBaht(purchase.withholdingAmount),
      netAmount: satangToBaht(purchase.netAmount),
      lines: purchase.lines.map((line) => ({
        ...line,
        unitPrice: satangToBaht(line.unitPrice),
        discount: satangToBaht(line.discount),
        amount: satangToBaht(line.amount),
        vatAmount: satangToBaht(line.vatAmount),
      })),
    };

    return apiResponse(purchaseInBaht, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return apiError('ข้อมูลไม่ถูกต้อง');
    }
    return apiError('เกิดข้อผิดพลาดในการสร้างใบซื้อ');
  }
}
