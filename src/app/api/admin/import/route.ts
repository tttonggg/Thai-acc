import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// GET - Import history
export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const dataType = searchParams.get('dataType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (dataType) {
      where.dataType = dataType;
    }

    const [imports, total] = await Promise.all([
      prisma.dataImport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          importedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.dataImport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: imports,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Import history error:', error);

    // Check for auth errors first
    if (
      error instanceof AuthError ||
      error?.name === 'AuthError' ||
      error?.statusCode === 401 ||
      error.message?.includes('Unauthorized')
    ) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (error?.statusCode === 403 || error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง (ต้องการสิทธิ์ผู้ดูแลระบบ)' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// Validation schemas for different data types
const customerSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสลูกค้า'),
  name: z.string().min(1, 'กรุณาระบุชื่อลูกค้า'),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  creditLimit: z.number().optional().default(0),
  creditDays: z.number().optional().default(30),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

const vendorSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสผู้ขาย'),
  name: z.string().min(1, 'กรุณาระบุชื่อผู้ขาย'),
  nameEn: z.string().optional(),
  taxId: z.string().optional(),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountName: z.string().optional(),
  creditDays: z.number().optional().default(30),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

const productSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสสินค้า'),
  name: z.string().min(1, 'กรุณาระบุชื่อสินค้า'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional().default('ชิ้น'),
  type: z.enum(['PRODUCT', 'SERVICE']).optional().default('PRODUCT'),
  salePrice: z.number().optional().default(0),
  costPrice: z.number().optional().default(0),
  vatRate: z.number().optional().default(7),
  vatType: z.enum(['EXCLUSIVE', 'INCLUSIVE', 'NONE']).optional().default('EXCLUSIVE'),
  isInventory: z.boolean().optional().default(false),
  quantity: z.number().optional().default(0),
  minQuantity: z.number().optional().default(0),
  incomeType: z.string().optional(),
  costingMethod: z.enum(['FIFO', 'WEIGHTED_AVERAGE']).optional().default('WEIGHTED_AVERAGE'),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

const chartOfAccountSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสบัญชี'),
  name: z.string().min(1, 'กรุณาระบุชื่อบัญชี'),
  nameEn: z.string().optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  level: z.number().optional().default(1),
  parentId: z.string().optional(),
  isDetail: z.boolean().optional().default(true),
  isSystem: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
});

type DataType = 'customers' | 'vendors' | 'products' | 'accounts';

interface ImportResult {
  success: boolean;
  totalRecords: number;
  created: number;
  updated: number;
  errors: number;
  errorDetails: Array<{ row: number; error: string; data?: any }>;
  preview?: Array<{ action: 'create' | 'update' | 'error'; data?: any; error?: string }>;
}

// Helper function to parse CSV
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  return lines;
}

// Helper function to parse Excel (basic CSV parser for simplicity)
async function parseExcel(file: File): Promise<string[][]> {
  const text = await file.text();
  return parseCSV(text);
}

// Helper function to parse JSON
function parseJSON(text: string): any[] {
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : [data];
}

// Validation function
function validateData(
  dataType: DataType,
  record: any
): { valid: boolean; errors: string[]; data?: any } {
  const errors: string[] = [];
  let validatedData: any;

  try {
    switch (dataType) {
      case 'customers':
        validatedData = customerSchema.parse(record);
        break;
      case 'vendors':
        validatedData = vendorSchema.parse(record);
        break;
      case 'products':
        validatedData = productSchema.parse(record);
        break;
      case 'accounts':
        validatedData = chartOfAccountSchema.parse(record);
        break;
      default:
        return { valid: false, errors: ['ไม่รู้จักประเภทข้อมูล'] };
    }

    return { valid: true, errors: [], data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    } else {
      errors.push(error instanceof Error ? error.message : 'ข้อมูลไม่ถูกต้อง');
    }
    return { valid: false, errors };
  }
}

// Import function for each data type
async function importData(
  dataType: DataType,
  records: any[],
  options: { skipDuplicates: boolean; updateExisting: boolean }
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRecords: records.length,
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
    preview: [],
  };

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const validation = validateData(dataType, record);

        if (!validation.valid) {
          result.errors++;
          result.errorDetails.push({
            row: i + 1,
            error: validation.errors.join(', '),
            data: record,
          });
          result.preview?.push({
            action: 'error',
            error: validation.errors.join(', '),
          });
          continue;
        }

        const data = validation.data!;
        let existingRecord: any = null;
        const code = data.code;

        try {
          switch (dataType) {
            case 'customers':
              existingRecord = await tx.customer.findUnique({
                where: { code },
              });
              break;
            case 'vendors':
              existingRecord = await tx.vendor.findUnique({
                where: { code },
              });
              break;
            case 'products':
              existingRecord = await tx.product.findUnique({
                where: { code },
              });
              break;
            case 'accounts':
              existingRecord = await tx.chartOfAccount.findUnique({
                where: { code },
              });
              break;
          }

          if (existingRecord) {
            if (options.skipDuplicates) {
              result.preview?.push({
                action: 'error',
                error: 'รหัสนี้มีอยู่แล้ว (ข้ามไป)',
              });
              continue;
            }

            if (options.updateExisting) {
              switch (dataType) {
                case 'customers':
                  await tx.customer.update({
                    where: { id: existingRecord.id },
                    data,
                  });
                  break;
                case 'vendors':
                  await tx.vendor.update({
                    where: { id: existingRecord.id },
                    data,
                  });
                  break;
                case 'products':
                  await tx.product.update({
                    where: { id: existingRecord.id },
                    data,
                  });
                  break;
                case 'accounts':
                  await tx.chartOfAccount.update({
                    where: { id: existingRecord.id },
                    data,
                  });
                  break;
              }
              result.updated++;
              result.preview?.push({
                action: 'update',
                data,
              });
            } else {
              result.preview?.push({
                action: 'error',
                error: 'รหัสนี้มีอยู่แล้ว (เลือกทับข้อมูลเดิมเพื่ออัปเดต)',
              });
            }
          } else {
            switch (dataType) {
              case 'customers':
                await tx.customer.create({ data });
                break;
              case 'vendors':
                await tx.vendor.create({ data });
                break;
              case 'products':
                await tx.product.create({ data });
                break;
              case 'accounts':
                await tx.chartOfAccount.create({ data });
                break;
            }
            result.created++;
            result.preview?.push({
              action: 'create',
              data,
            });
          }
        } catch (error: any) {
          result.errors++;
          result.errorDetails.push({
            row: i + 1,
            error: error.message || 'เกิดข้อผิดพลาด',
            data: record,
          });
          result.preview?.push({
            action: 'error',
            error: error.message || 'เกิดข้อผิดพลาด',
          });

          // Re-throw to rollback transaction
          throw error;
        }
      }
    });
  } catch (error: any) {
    result.success = false;
    result.errorDetails.push({
      row: 0,
      error: `การนำเข้าข้อมูลล้มเหลว: ${error.message}`,
    });
  }

  return result;
}

// POST - Import data
export async function POST(request: NextRequest) {
  let importRecord: any = null;

  try {
    // Check admin role
    const user = await requireRole(['ADMIN']);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as DataType;
    const skipDuplicates = formData.get('skipDuplicates') === 'true';
    const updateExisting = formData.get('updateExisting') === 'true';
    const dryRun = formData.get('dryRun') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: 'กรุณาเลือกไฟล์' }, { status: 400 });
    }

    if (!dataType) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุประเภทข้อมูล' }, { status: 400 });
    }

    // Create import record
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';

    if (!dryRun) {
      importRecord = await prisma.dataImport.create({
        data: {
          dataType,
          fileName: file.name,
          fileType: fileExtension,
          totalRecords: 0,
          createdCount: 0,
          updatedCount: 0,
          errorCount: 0,
          status: 'PROCESSING',
          importedById: user.id,
        },
      });
    }

    // Parse file based on type
    let records: any[] = [];

    // fileExtension already defined above on line 449

    if (fileExtension === 'csv' || fileExtension === 'txt') {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        return NextResponse.json({ success: false, error: 'ไฟล์ไม่มีข้อมูล' }, { status: 400 });
      }

      // First row is headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Convert to array of objects
      records = dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          const key = header.trim();
          const value = row[index] || '';
          // Try to convert to number if possible
          if (value && !isNaN(Number(value))) {
            obj[key] = Number(value);
          } else if (value === 'true') {
            obj[key] = true;
          } else if (value === 'false') {
            obj[key] = false;
          } else {
            obj[key] = value;
          }
        });
        return obj;
      });
    } else if (fileExtension === 'json') {
      const text = await file.text();
      records = parseJSON(text);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // For Excel files, we'll need a library like xlsx
      // For now, return error
      return NextResponse.json(
        { success: false, error: 'กรุณาบันทึกไฟล์ Excel เป็น CSV หรือ JSON' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'รูปแบบไฟล์ไม่รองรับ รองรับเฉพาะ CSV, JSON' },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลในไฟล์' }, { status: 400 });
    }

    // Dry run - just validate and preview
    if (dryRun) {
      const preview: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < Math.min(records.length, 100); i++) {
        const record = records[i];
        const validation = validateData(dataType, record);

        if (!validation.valid) {
          errors.push({
            row: i + 1,
            error: validation.errors.join(', '),
            data: record,
          });
          preview.push({
            action: 'error',
            error: validation.errors.join(', '),
          });
        } else {
          // Check if exists
          let existing = false;
          try {
            switch (dataType) {
              case 'customers':
                const cust = await prisma.customer.findUnique({
                  where: { code: record.code },
                });
                existing = !!cust;
                break;
              case 'vendors':
                const vend = await prisma.vendor.findUnique({
                  where: { code: record.code },
                });
                existing = !!vend;
                break;
              case 'products':
                const prod = await prisma.product.findUnique({
                  where: { code: record.code },
                });
                existing = !!prod;
                break;
              case 'accounts':
                const acc = await prisma.chartOfAccount.findUnique({
                  where: { code: record.code },
                });
                existing = !!acc;
                break;
            }

            preview.push({
              action: existing ? 'update' : 'create',
              data: validation.data,
            });
          } catch (error) {
            preview.push({
              action: 'error',
              error: 'ไม่สามารถตรวจสอบข้อมูลได้',
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        dryRun: true,
        totalRecords: records.length,
        preview: preview.slice(0, 10),
        validCount: preview.filter((p) => p.action !== 'error').length,
        errorCount: errors.length,
        errors: errors.slice(0, 10),
      });
    }

    // Actual import
    const result = await importData(dataType, records, {
      skipDuplicates,
      updateExisting,
    });

    // Update import record
    if (importRecord) {
      await prisma.dataImport.update({
        where: { id: importRecord.id },
        data: {
          totalRecords: result.totalRecords,
          createdCount: result.created,
          updatedCount: result.updated,
          errorCount: result.errors,
          status: result.success ? 'COMPLETED' : 'FAILED',
          errorMessage: result.success ? null : 'การนำเข้าข้อมูลล้มเหลว',
          errorDetails: result.errorDetails.slice(0, 100),
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      totalRecords: result.totalRecords,
      created: result.created,
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 50),
      importId: importRecord?.id,
    });
  } catch (error: any) {
    console.error('Import error:', error);

    // Update import record with error
    if (importRecord) {
      try {
        await prisma.dataImport.update({
          where: { id: importRecord.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message || 'เกิดข้อผิดพลาด',
          },
        });
      } catch (updateError) {
        console.error('Failed to update import record:', updateError);
      }
    }

    // Check for auth errors first
    if (
      error instanceof AuthError ||
      error?.name === 'AuthError' ||
      error?.statusCode === 401 ||
      error.message?.includes('Unauthorized')
    ) {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (error?.statusCode === 403 || error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง (ต้องการสิทธิ์ผู้ดูแลระบบ)' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล',
      },
      { status: 500 }
    );
  }
}
