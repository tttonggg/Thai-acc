import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-utils';

const createConfigSchema = z.object({
  documentType: z.string().min(1),
  approverRole: z.string().min(1),
});

// GET /api/approval-config - List all configs
export async function GET() {
  try {
    await requireRole(['ADMIN', 'ACCOUNTANT']);

    const configs = await db.documentApproverConfig.findMany({
      orderBy: [{ documentType: 'asc' }, { approvalOrder: 'asc' }],
    });

    // Fetch all roles referenced in configs
    const roleIds = [...new Set(configs.map((c) => c.roleId))];
    const roles = await db.role.findMany({ where: { id: { in: roleIds } } });
    const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

    const result = configs.map((c) => ({
      ...c,
      role: roleMap[c.roleId] ?? { id: c.roleId, name: '?', displayName: null },
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
    }
    console.error('Approval Config List Error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

// POST /api/approval-config - Create config
export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN']);

    const body = await request.json().catch(() => null);
    const validated = createConfigSchema.parse(body);

    // Get next approval order for this document type
    const lastConfig = await db.documentApproverConfig.findFirst({
      where: { documentType: validated.documentType },
      orderBy: { approvalOrder: 'desc' },
    });
    const nextOrder = (lastConfig?.approvalOrder ?? 0) + 1;

    // Resolve roleId from role name
    const role = await db.role.findFirst({
      where: { name: validated.approverRole },
    });
    if (!role) {
      return NextResponse.json(
        { success: false, error: `ไม่พบ role: ${validated.approverRole}` },
        { status: 400 }
      );
    }

    const config = await db.documentApproverConfig.create({
      data: {
        documentType: validated.documentType,
        roleId: role.id,
        approvalOrder: nextOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...config,
          role: { id: role.id, name: role.name, displayName: role.description },
        },
      },
      { status: 201 }
    );
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
    console.error('Approval Config Create Error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
