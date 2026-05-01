import { NextRequest } from 'next/server';
import {
  requireAuth,
  requireRole,
  apiResponse,
  apiError,
  unauthorizedError,
  notFoundError,
  forbiddenError,
} from '@/lib/api-utils';
import { prisma } from '@/lib/db';
import { logActivity } from '@/lib/activity-logger';
import { z } from 'zod';

// Validation schema for convert to PO request
const convertToPoSchema = z.object({
  vendorId: z.string().min(1, 'กรุณาเลือกผู้ขาย'),
  vendorContact: z.string().optional(),
  vendorEmail: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  vendorPhone: z.string().optional(),
  shippingTerms: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryAddress: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/purchase-requests/[id]/convert-to-po - Convert approved PR to PO
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require ADMIN or ACCOUNTANT role
    const user = await requireRole(['ADMIN', 'ACCOUNTANT']);

    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const validatedData = convertToPoSchema.parse(body);

    // Fetch PR with all relations
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: true,
          },
          orderBy: {
            lineNo: 'asc',
          },
        },
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        departmentData: true,
      },
    });

    if (!pr) {
      return notFoundError('ไม่พบใบขอซื้อ');
    }

    // Validate status transition
    if (pr.status !== 'APPROVED') {
      return apiError('สามารถแปลงเป็นใบสั่งซื้อเฉพาะใบขอซื้อที่ได้รับการอนุมัติแล้วเท่านั้น', 400);
    }

    // Check if PR is already converted
    if (pr.purchaseOrderId) {
      return apiError('ใบขอซื้อนี้ถูกแปลงเป็นใบสั่งซื้อแล้ว', 400);
    }

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: validatedData.vendorId },
    });

    if (!vendor) {
      return apiError('ไม่พบข้อมูลผู้ขาย', 400);
    }

    // Generate PO number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Find latest PO number for this month
    const latestPO = await prisma.purchaseOrder.findFirst({
      where: {
        orderNo: {
          startsWith: `PO${year}${month}`,
        },
      },
      orderBy: {
        orderNo: 'desc',
      },
    });

    let sequence = 1;
    if (latestPO) {
      const match = latestPO.orderNo.match(/PO\d{6}-(\d{4})/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    const orderNo = `PO${year}${month}-${String(sequence).padStart(4, '0')}`;

    // Convert PR to PO using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create PO from PR
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderNo,
          orderDate: new Date(),
          vendorId: validatedData.vendorId,
          vendorContact: validatedData.vendorContact,
          vendorEmail: validatedData.vendorEmail,
          vendorPhone: validatedData.vendorPhone,
          purchaseRequestId: id,
          shippingTerms: validatedData.shippingTerms,
          paymentTerms: validatedData.paymentTerms,
          expectedDate: validatedData.expectedDate
            ? new Date(validatedData.expectedDate)
            : pr.requiredDate,
          notes: validatedData.notes,
          status: 'DRAFT',
          createdById: user.id,
          lines: {
            create: pr.lines.map((line, index) => ({
              lineNo: index + 1,
              productId: line.productId,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unitPrice: line.unitPrice,
              discount: line.discount,
              vatRate: line.vatRate,
              vatAmount: line.vatAmount,
              amount: line.amount,
              notes: line.notes,
            })),
          },
        },
        include: {
          vendor: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
            orderBy: {
              lineNo: 'asc',
            },
          },
        },
      });

      // Update PR status to CONVERTED
      const updatedPR = await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          purchaseOrderId: purchaseOrder.id,
          updatedById: user.id,
        },
        include: {
          requestedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          departmentData: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          budget: {
            select: {
              id: true,
              name: true,
              fiscalYear: true,
              remainingAmount: true,
            },
          },
          lines: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
            orderBy: {
              lineNo: 'asc',
            },
          },
          purchaseOrder: {
            select: {
              id: true,
              orderNo: true,
              status: true,
            },
          },
        },
      });

      return {
        purchaseOrder,
        updatedPR,
      };
    });

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'CONVERT',
      module: 'purchase-requests',
      recordId: id,
      details: {
        requestNo: result.updatedPR.requestNo,
        orderNo: result.purchaseOrder.orderNo,
        vendorName: result.purchaseOrder.vendor.name,
        lineCount: result.purchaseOrder.lines.length,
      },
    });

    return apiResponse({
      success: true,
      message: 'แปลงใบขอซื้อเป็นใบสั่งซื้อเรียบร้อยแล้ว',
      data: {
        purchaseOrder: result.purchaseOrder,
        purchaseRequest: result.updatedPR,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('ข้อมูลไม่ถูกต้อง: ' + error.issues.map((e) => e.message).join(', '), 400);
    }
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    if (error instanceof Error && error.message.includes('ไม่มีสิทธิ์เข้าถึง')) {
      return forbiddenError();
    }
    console.error('Purchase Request Convert to PO Error:', error);
    return apiError('เกิดข้อผิดพลาดในการแปลงใบขอซื้อเป็นใบสั่งซื้อ');
  }
}
