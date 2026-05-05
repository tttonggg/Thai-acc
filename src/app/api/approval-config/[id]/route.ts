import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-utils';

const updateConfigSchema = z.object({
  approverRole: z.string().min(1).optional(),
  approvalOrder: z.number().int().min(1).optional(),
});

// GET /api/approval-config/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN', 'ACCOUNTANT']);
    const { id } = await params;

    const config = await db.documentApproverConfig.findUnique({ where: { id } });
    if (!config) {
      return NextResponse.json({ success: false, error: 'ไม่พบการตั้งค่า' }, { status: 404 });
    }

    const role = await db.role.findUnique({ where: { id: config.roleId } });

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        role: role ?? { id: config.roleId, name: '?', displayName: null },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
    }
    console.error('Approval Config Get Error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

// PUT /api/approval-config/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN']);
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const validated = updateConfigSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.approvalOrder !== undefined) updateData.approvalOrder = validated.approvalOrder;
    if (validated.approverRole !== undefined) {
      const role = await db.role.findFirst({ where: { name: validated.approverRole } });
      if (!role) {
        return NextResponse.json(
          { success: false, error: `ไม่พบ role: ${validated.approverRole}` },
          { status: 400 }
        );
      }
      updateData.roleId = role.id;
    }

    const config = await db.documentApproverConfig.update({
      where: { id },
      data: updateData,
    });

    const role = await db.role.findUnique({ where: { id: config.roleId } });

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        role: role ?? { id: config.roleId, name: '?', displayName: null },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
    }
    console.error('Approval Config Update Error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

// DELETE /api/approval-config/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN']);
    const { id } = await params;

    await db.documentApproverConfig.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'ลบการตั้งค่าการอนุมัติเรียบร้อยแล้ว' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
    }
    console.error('Approval Config Delete Error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
