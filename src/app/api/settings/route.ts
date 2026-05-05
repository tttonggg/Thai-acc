import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schemas
const taxRatesSchema = z.object({
  vatRate: z.number().min(0).max(100),
  whtPnd53Service: z.number().min(0).max(100),
  whtPnd53Rent: z.number().min(0).max(100),
  whtPnd53Prof: z.number().min(0).max(100),
  whtPnd53Contract: z.number().min(0).max(100),
  whtPnd53Advert: z.number().min(0).max(100),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFromEmail: z.string().optional(),
  smtpFromName: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDays1: z.number().min(1).optional(),
  reminderDays2: z.number().min(1).optional(),
  reminderDays3: z.number().min(1).optional(),
});

const documentNumberFormatSchema = z.object({
  type: z.string(),
  prefix: z.string(),
  format: z.string(),
  resetMonthly: z.boolean(),
  resetYearly: z.boolean(),
});

const settingsUpdateSchema = z.object({
  taxRates: taxRatesSchema.optional(),
  documentNumbers: z.array(documentNumberFormatSchema).optional(),
  emailSettings: emailSettingsSchema.optional(),
});

// GET /api/settings - Fetch all settings
export async function GET(req: NextRequest) {
  try {
    // Require authentication for settings
    await requireAuth();

    // Get company with system settings
    const company = await db.company.findFirst({
      include: {
        systemSettings: true,
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลบริษัท' }, { status: 404 });
    }

    // Get all document number formats
    const documentNumbers = await db.documentNumber.findMany({
      orderBy: { type: 'asc' },
    });

    // Prepare response
    const settings = {
      company: {
        id: company.id,
        name: company.name,
        nameEn: company.nameEn,
        taxId: company.taxId,
        branchCode: company.branchCode,
        address: company.address,
        subDistrict: company.subDistrict,
        district: company.district,
        province: company.province,
        postalCode: company.postalCode,
        phone: company.phone,
        fax: company.fax,
        email: company.email,
        website: company.website,
        logo: company.logo,
        fiscalYearStart: company.fiscalYearStart,
      },
      taxRates: company.systemSettings
        ? {
            vatRate: company.systemSettings.vatRate,
            whtPnd53Service: company.systemSettings.whtPnd53Service,
            whtPnd53Rent: company.systemSettings.whtPnd53Rent,
            whtPnd53Prof: company.systemSettings.whtPnd53Prof,
            whtPnd53Contract: company.systemSettings.whtPnd53Contract,
            whtPnd53Advert: company.systemSettings.whtPnd53Advert,
          }
        : {
            vatRate: 7,
            whtPnd53Service: 3,
            whtPnd53Rent: 5,
            whtPnd53Prof: 3,
            whtPnd53Contract: 1,
            whtPnd53Advert: 2,
          },
      emailSettings: company.systemSettings
        ? {
            smtpHost: company.systemSettings.smtpHost ?? '',
            smtpPort: company.systemSettings.smtpPort ?? 587,
            smtpUser: company.systemSettings.smtpUser ?? '',
            smtpPassword: company.systemSettings.smtpPassword ?? '',
            smtpFromEmail: company.systemSettings.smtpFromEmail ?? '',
            smtpFromName: company.systemSettings.smtpFromName ?? '',
            reminderEnabled: company.systemSettings.reminderEnabled ?? false,
            reminderDays1: company.systemSettings.reminderDays1 ?? 7,
            reminderDays2: company.systemSettings.reminderDays2 ?? 14,
            reminderDays3: company.systemSettings.reminderDays3 ?? 30,
          }
        : {
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            smtpFromEmail: '',
            smtpFromName: '',
            reminderEnabled: false,
            reminderDays1: 7,
            reminderDays2: 14,
            reminderDays3: 30,
          },
      documentNumbers: documentNumbers.map((doc) => ({
        type: doc.type,
        prefix: doc.prefix,
        format: doc.format,
        resetMonthly: doc.resetMonthly,
        resetYearly: doc.resetYearly,
        currentNo: doc.currentNo,
      })),
    };

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลตั้งค่าได้' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(req: NextRequest) {
  try {
    // Require ADMIN role for settings updates
    await requireRole(['ADMIN']);

    const body = await req.json();
    const validated = settingsUpdateSchema.parse(body);

    // Get company
    const company = await db.company.findFirst();

    if (!company) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลบริษัท' }, { status: 404 });
    }

    // Update tax rates if provided
    if (validated.taxRates) {
      if ((company as any).systemSettings) {
        // Update existing
        await db.systemSettings.update({
          where: { companyId: company.id },
          data: validated.taxRates,
        });
      } else {
        // Create new
        await db.systemSettings.create({
          data: {
            companyId: company.id,
            ...validated.taxRates,
          },
        });
      }
    }

    // Update email settings if provided
    if (validated.emailSettings) {
      if ((company as any).systemSettings) {
        await db.systemSettings.update({
          where: { companyId: company.id },
          data: validated.emailSettings,
        });
      } else {
        await db.systemSettings.create({
          data: {
            companyId: company.id,
            ...validated.emailSettings,
          },
        });
      }
    }

    // Update document numbers if provided
    if (validated.documentNumbers) {
      for (const docFormat of validated.documentNumbers) {
        await db.documentNumber.upsert({
          where: { type: docFormat.type },
          update: {
            prefix: docFormat.prefix,
            format: docFormat.format,
            resetMonthly: docFormat.resetMonthly,
            resetYearly: docFormat.resetYearly,
          },
          create: {
            type: docFormat.type,
            prefix: docFormat.prefix,
            format: docFormat.format,
            resetMonthly: docFormat.resetMonthly,
            resetYearly: docFormat.resetYearly,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'บันทึกตั้งค่าเรียบร้อยแล้ว' });
  } catch (error: unknown) {
    // Check for auth errors first
    if (error instanceof AuthError || error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (error?.statusCode === 403) {
      return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    console.error('Error updating settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถบันทึกตั้งค่าได้' },
      { status: 500 }
    );
  }
}
