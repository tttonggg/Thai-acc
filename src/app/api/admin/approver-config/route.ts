import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-utils';
import { db } from '@/lib/db';

// GET /api/admin/approver-config - List all approver configurations
export async function GET() {
  try {
    await requirePermission('admin', 'manage');

    const configs = await db.documentApproverConfig.findMany({
      orderBy: [{ documentType: 'asc' }, { approvalOrder: 'asc' }],
    });

    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approver configs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/approver-config - Create approver configuration
export async function POST(request: NextRequest) {
  try {
    await requirePermission('admin', 'manage');

    const body = await request.json();
    const { documentType, approvalOrder, roleId } = body;

    if (!documentType || !approvalOrder || !roleId) {
      return NextResponse.json(
        { success: false, error: 'documentType, approvalOrder, and roleId are required' },
        { status: 400 }
      );
    }

    const config = await db.documentApproverConfig.create({
      data: {
        documentType,
        approvalOrder,
        roleId,
      },
    });

    return NextResponse.json({ success: true, data: config }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create approver config' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/approver-config - Update approver configuration
export async function PUT(request: NextRequest) {
  try {
    await requirePermission('admin', 'manage');

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Config ID is required' }, { status: 400 });
    }

    const config = await db.documentApproverConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update approver config' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/approver-config - Delete approver configuration
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('admin', 'manage');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Config ID is required' }, { status: 400 });
    }

    await db.documentApproverConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete approver config' },
      { status: 500 }
    );
  }
}
