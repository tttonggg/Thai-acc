import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-utils';
import { AuthError } from '@/lib/api-auth';
import { handleApiError } from '@/lib/api-error-handler';

// Validation schema for company info
const companyInfoSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อบริษัท'),
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
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  website: z.string().optional(),
  logo: z.string().optional(),
});

// GET /api/company - Fetch company info
export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const company = await db.company.findFirst();

    if (!company) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลบริษัท' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
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
    });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (error instanceof AuthError || err?.name === 'AuthError' || err?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถดึงข้อมูลบริษัทได้' },
      { status: 500 }
    );
  }
}

// PUT /api/company - Update company info
export async function PUT(req: NextRequest) {
  try {
    // Require ADMIN role for company updates
    await requireRole(['ADMIN']);

    const body = await req.json();
    const validated = companyInfoSchema.parse(body);

    // Get company
    const company = await db.company.findFirst();

    if (!company) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลบริษัท' }, { status: 404 });
    }

    // Update company
    const updated = await db.company.update({
      where: { id: company.id },
      data: {
        name: validated.name,
        nameEn: validated.nameEn,
        taxId: validated.taxId,
        branchCode: validated.branchCode,
        address: validated.address,
        subDistrict: validated.subDistrict,
        district: validated.district,
        province: validated.province,
        postalCode: validated.postalCode,
        phone: validated.phone,
        fax: validated.fax,
        email: validated.email,
        website: validated.website,
        logo: validated.logo,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลบริษัทเรียบร้อยแล้ว',
      data: {
        id: updated.id,
        name: updated.name,
        nameEn: updated.nameEn,
        taxId: updated.taxId,
        branchCode: updated.branchCode,
        address: updated.address,
        subDistrict: updated.subDistrict,
        district: updated.district,
        province: updated.province,
        postalCode: updated.postalCode,
        phone: updated.phone,
        fax: updated.fax,
        email: updated.email,
        website: updated.website,
        logo: updated.logo,
      },
    });
  } catch (error: unknown) {
    const err = error as { name?: string; statusCode?: number; message?: string };
    if (error instanceof AuthError || err?.name === 'AuthError' || err?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (err?.statusCode === 403) {
      return NextResponse.json({ success: false, error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    console.error('Error updating company:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถบันทึกข้อมูลบริษัทได้' },
      { status: 500 }
    );
  }
}
