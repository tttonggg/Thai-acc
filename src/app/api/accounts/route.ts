import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    // Transform data for the component
    const transformedAccounts = accounts.map((a: any) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      nameEn: a.nameEn,
      type: a.type,
      level: a.level,
      parentId: a.parentId,
      isDetail: a.isDetail,
      isActive: a.isActive,
      notes: a.notes,
    }));

    return NextResponse.json(transformedAccounts);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch accounts',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Check if code already exists
    const existing = await prisma.chartOfAccount.findFirst({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'รหัสบัญชีนี้มีอยู่แล้วในระบบ',
        },
        { status: 400 }
      );
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        code: data.code,
        name: data.name,
        nameEn: data.nameEn || null,
        type: data.type,
        level: data.level || data.code.length,
        parentId: data.parentId || null,
        isDetail: data.isDetail ?? true,
        isActive: data.isActive ?? true,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({
      id: account.id,
      code: account.code,
      name: account.name,
      nameEn: account.nameEn,
      type: account.type,
      level: account.level,
      parentId: account.parentId,
      isDetail: account.isDetail,
      isActive: account.isActive,
      notes: account.notes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create account',
      },
      { status: 500 }
    );
  }
}
