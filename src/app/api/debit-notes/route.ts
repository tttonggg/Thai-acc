import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  apiResponse,
  apiError,
  unauthorizedError,
  forbiddenError,
  generateDocNumber,
} from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { checkPeriodStatus } from '@/lib/period-service';
import { bahtToSatang, satangToBaht } from '@/lib/currency';

// Wrapper that properly handles auth with request context
async function requireAuthWithRequest(request: NextRequest): Promise<any> {
  // Import the requireAuth that accepts request from api-auth
  const { requireAuth: requireAuthWithReq } = await import('@/lib/api-auth');
  return requireAuthWithReq(request);
}

// Validation schema for debit note line
const debitNoteLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'ต้องระบุรายการ'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  discount: z.number().min(0).default(0),
  amount: z.number().min(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().min(0).default(0),
});

// Validation schema for debit note
const debitNoteSchema = z.object({
  debitNoteDate: z.string().transform((val) => new Date(val)),
  vendorId: z.string().min(1, 'ต้องเลือกผู้ขาย'),
  purchaseInvoiceId: z.string().optional().nullable(),
  reason: z
    .enum(['ADDITIONAL_CHARGES', 'RETURNED_GOODS', 'PRICE_ADJUSTMENT'])
    .default('ADDITIONAL_CHARGES'),
  subtotal: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  lines: z.array(debitNoteLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
});

// GET /api/debit-notes - List debit notes
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRequest(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (startDate || endDate) {
      where.debitNoteDate = {};
      if (startDate) where.debitNoteDate.gte = new Date(startDate);
      if (endDate) where.debitNoteDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { debitNoteNo: { contains: search } },
        { vendor: { name: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    // Fetch debit notes without vendor first to avoid null relationship errors
    const [debitNotes, total] = await Promise.all([
      db.debitNote.findMany({
        where,
        include: {
          purchaseInvoice: {
            select: { id: true, invoiceNo: true },
          },
        },
        orderBy: { debitNoteDate: 'desc' },
        skip,
        take: limit,
      }),
      db.debitNote.count({ where }),
    ]);

    // Fetch vendors separately for debit notes that have them
    const vendorIds = debitNotes.map((dn: any) => dn.vendorId).filter((id: string) => id != null);
    const vendors =
      vendorIds.length > 0
        ? await db.vendor.findMany({
            where: {
              id: { in: vendorIds },
            },
            select: { id: true, code: true, name: true, taxId: true },
          })
        : [];

    // Create a map for quick vendor lookup
    const vendorMap = new Map(vendors.map((v: any) => [v.id, v]));

    // Attach vendors to debit notes
    const debitNotesWithVendors = debitNotes.map((dn: any) => ({
      ...dn,
      vendor: dn.vendorId ? vendorMap.get(dn.vendorId) || null : null,
    }));

    // Filter out debit notes with null vendors (data integrity issue)
    const validDebitNotes = debitNotesWithVendors.filter((dn: any) => dn.vendor !== null);

    // Transform data to match frontend interface (flatten vendor.name to vendorName)
    const transformedDebitNotes = validDebitNotes.map((dn: any) => {
      try {
        return {
          ...dn,
          subtotal: satangToBaht(dn.subtotal),
          vatAmount: satangToBaht(dn.vatAmount),
          totalAmount: satangToBaht(dn.totalAmount),
          vendorName: dn.vendor?.name || '',
          vendorCode: dn.vendor?.code || '',
          vendorTaxId: dn.vendor?.taxId || '',
          debitNoteDate: dn.debitNoteDate ? dn.debitNoteDate.toISOString() : '',
          createdAt: dn.createdAt ? dn.createdAt.toISOString() : '',
          updatedAt: dn.updatedAt ? dn.updatedAt.toISOString() : '',
        };
      } catch (err) {
        console.error('Error transforming debit note:', dn.id, err);
        return {
          ...dn,
          vendorName: '',
          vendorCode: '',
          vendorTaxId: '',
          debitNoteDate: '',
          createdAt: '',
          updatedAt: '',
        };
      }
    });

    return Response.json({
      success: true,
      data: transformedDebitNotes,
      pagination: {
        page,
        limit,
        total: validDebitNotes.length, // Use actual count after filtering
        totalPages: Math.ceil(validDebitNotes.length / limit),
      },
    });
  } catch (error) {
    console.error('Debit Notes API Error:', error);
    if (
      error instanceof AuthError ||
      (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต'))
    ) {
      return unauthorizedError();
    }
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบเพิ่มหนี้');
  }
}

// POST /api/debit-notes - Create debit note
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRequest(request);

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์สร้างใบเพิ่มหนี้', 403);
    }

    const body = await request.json();
    const validatedData = debitNoteSchema.parse(body);

    // Verify vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId },
    });

    if (!vendor) {
      return apiError('ไม่พบผู้ขาย');
    }

    // If purchase invoice is provided, verify it exists and belongs to vendor
    if (validatedData.purchaseInvoiceId) {
      const purchaseInvoice = await db.purchaseInvoice.findUnique({
        where: { id: validatedData.purchaseInvoiceId },
      });

      if (!purchaseInvoice) {
        return apiError('ไม่พบใบซื้อ');
      }

      if (purchaseInvoice.vendorId !== validatedData.vendorId) {
        return apiError('ใบซื้อไม่ตรงกับผู้ขาย');
      }
    }

    // B1. Period Locking - Check if period is open for debit note date
    const periodCheck = await checkPeriodStatus(validatedData.debitNoteDate);
    if (!periodCheck.isValid) {
      return apiError(periodCheck.error || 'ไม่สามารถออกใบเพิ่มหนี้ในงวดที่ปิดแล้ว');
    }

    // Generate debit note number
    const debitNoteNo = await generateDocNumber('DEBIT_NOTE', 'DN');

    // Create debit note with status ISSUED
    const debitNote = await db.$transaction(async (tx) => {
      // Get system settings for configurable account IDs
      const settings = await tx.systemSettings.findFirst();

      // Look up required accounts by code
      const [purchasesAccount, vatInputAccount, apAccount] = await Promise.all([
        // Purchases/Expenses (5xxx) - Default to '5110' (Cost of Goods Sold)
        tx.chartOfAccount.findFirst({
          where: { code: settings?.purchaseAccountId || '5110' },
        }),
        // VAT Input (1145) - ภาษีมูลค่าเพิ่มซื้อ
        tx.chartOfAccount.findFirst({
          where: { code: settings?.vatInputAccountId || '1145' },
        }),
        // Accounts Payable (2xxx) - Default to '2110'
        tx.chartOfAccount.findFirst({
          where: { code: settings?.apAccountId || '2110' },
        }),
      ]);

      if (!purchasesAccount) {
        throw new Error(`Purchases account not found: ${settings?.purchaseAccountId || '5110'}`);
      }
      if (!vatInputAccount) {
        throw new Error(`VAT input account not found: ${settings?.vatInputAccountId || '1145'}`);
      }
      if (!apAccount) {
        throw new Error(`AP account not found: ${settings?.apAccountId || '2110'}`);
      }

      const note = await tx.debitNote.create({
        data: {
          debitNoteNo,
          debitNoteDate: validatedData.debitNoteDate,
          vendorId: validatedData.vendorId,
          purchaseInvoice: validatedData.purchaseInvoiceId
            ? { connect: { id: validatedData.purchaseInvoiceId } }
            : undefined,
          reason: validatedData.reason,
          subtotal: bahtToSatang(validatedData.subtotal),
          vatRate: validatedData.vatRate,
          vatAmount: bahtToSatang(validatedData.vatAmount),
          totalAmount: bahtToSatang(validatedData.totalAmount),
          status: 'ISSUED',
          notes: validatedData.notes,
        } as any,
        include: {
          vendor: true,
          purchaseInvoice: true,
        },
      });

      // Debit Note Accounting Entry:
      // Debit Purchases (5xxx) - Additional purchases
      // Debit VAT Input (1xxx) - Additional input VAT
      // Credit Accounts Payable (21xx) - Increase vendor debt
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo: await generateDocNumber('JOURNAL_ENTRY', 'JE'),
          date: validatedData.debitNoteDate,
          description: `ใบเพิ่มหนี้ ${debitNoteNo} - ${vendor.name}`,
          reference: debitNoteNo,
          documentType: 'DEBIT_NOTE',
          documentId: note.id,
          totalDebit: note.totalAmount,
          totalCredit: note.totalAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: purchasesAccount.id,
                description: `ค่าใช้จ่ายเพิ่มเติม ${debitNoteNo}`,
                debit: bahtToSatang(validatedData.subtotal),
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: vatInputAccount.id,
                description: `VAT ใบเพิ่มหนี้ ${debitNoteNo}`,
                debit: bahtToSatang(validatedData.vatAmount),
                credit: 0,
              },
              {
                lineNo: 3,
                accountId: apAccount.id,
                description: `เพิ่มหนี้ผู้ขาย ${vendor.name}`,
                debit: 0,
                credit: note.totalAmount,
              },
            ],
          },
        },
      });

      // Update debit note with journal entry ID
      await tx.debitNote.update({
        where: { id: note.id },
        data: { journalEntryId: journalEntry.id },
      });

      // Create VAT INPUT record (ภาษีซื้อ) for debit notes from suppliers
      await tx.vatRecord.create({
        data: {
          type: 'INPUT',
          documentNo: debitNoteNo,
          documentDate: validatedData.debitNoteDate,
          documentType: 'DEBIT_NOTE',
          referenceId: note.id,
          vendorId: validatedData.vendorId,
          vendorName: vendor.name,
          vendorTaxId: vendor.taxId,
          description: `ใบเพิ่มหนี้จากผู้ขาย ${debitNoteNo}`,
          subtotal: bahtToSatang(validatedData.subtotal),
          vatRate: validatedData.vatRate,
          vatAmount: bahtToSatang(validatedData.vatAmount),
          totalAmount: bahtToSatang(validatedData.totalAmount),
          taxMonth: validatedData.debitNoteDate.getMonth() + 1,
          taxYear: validatedData.debitNoteDate.getFullYear(),
        },
      });

      return note;
    });

    // ✅ OPTIMIZED: Handle stock additions for returned goods in batch (outside transaction)
    if (validatedData.reason === 'RETURNED_GOODS') {
      // Filter lines that have products
      const productLines = validatedData.lines.filter((line) => line.productId);

      if (productLines.length > 0) {
        try {
          // Get or create default warehouse ONCE (not in loop)
          let warehouse = await db.warehouse.findFirst({
            where: { type: 'MAIN', isActive: true },
          });

          if (!warehouse) {
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

          // Batch create all stock movements in parallel
          await Promise.all(
            productLines.map((line) =>
              db.stockMovement.create({
                data: {
                  productId: line.productId!,
                  warehouseId: warehouse.id,
                  type: 'RECEIVE',
                  quantity: line.quantity,
                  unitCost: line.unitPrice,
                  totalCost: line.quantity * line.unitPrice,
                  date: validatedData.debitNoteDate,
                  referenceId: debitNote.id,
                  referenceNo: debitNoteNo,
                  notes: `รับสินค้าคืนจากใบเพิ่มหนี้ ${debitNoteNo}`,
                  sourceChannel: 'DEBIT_NOTE',
                },
              })
            )
          );
        } catch (stockError) {
          // Log but don't fail the debit note
          console.error('Stock receipt error:', stockError);
        }
      }
    }

    // Fetch complete debit note with relations
    const completeDebitNote = await db.debitNote.findUnique({
      where: { id: debitNote.id },
      include: {
        vendor: true,
        purchaseInvoice: true,
      },
    });

    // Convert Satang to Baht for response
    if (!completeDebitNote) {
      return apiError('เกิดข้อผิดพลาดในการสร้างใบเพิ่มหนี้', 500);
    }
    const debitNoteInBaht = {
      ...completeDebitNote,
      subtotal: satangToBaht(completeDebitNote.subtotal),
      vatAmount: satangToBaht(completeDebitNote.vatAmount),
      totalAmount: satangToBaht(completeDebitNote.totalAmount),
    };

    return apiResponse({ success: true, data: debitNoteInBaht }, 201);
  } catch (error) {
    console.error('Debit Note Creation Error:', error);
    if (
      error instanceof AuthError ||
      (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต'))
    ) {
      return unauthorizedError();
    }
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return apiError(`ข้อมูลไม่ถูกต้อง: ${issues}`, 400);
    }
    if (error instanceof Error && error.message.includes('account not found')) {
      return apiError(`บัญชีไม่ถูกต้อง: ${error.message}`, 400);
    }
    console.error('Error message:', (error as any)?.message);
    return apiError('เกิดข้อผิดพลาดในการสร้างใบเพิ่มหนี้');
  }
}
