import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/branches — list all branches for current user's company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const systemSettings = await db.systemSettings.findFirst();
    const companyId = systemSettings?.companyId;
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'No company found' }, { status: 400 });
    }

    const branches = await db.branch.findMany({
      where: {
        companyId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    console.error('GET /api/branches error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/branches — create a new branch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, address } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: 'code and name are required' }, { status: 400 });
    }

    const systemSettings = await db.systemSettings.findFirst();
    const companyId = systemSettings?.companyId;
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'No company found' }, { status: 400 });
    }

    const existing = await db.branch.findFirst({
      where: { companyId, code },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Branch code already exists' }, { status: 409 });
    }

    const branch = await db.branch.create({
      data: { companyId, code, name, address },
    });

    return NextResponse.json({ success: true, data: branch }, { status: 201 });
  } catch (error) {
    console.error('POST /api/branches error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
