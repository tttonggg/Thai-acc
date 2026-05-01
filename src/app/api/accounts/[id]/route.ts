import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions for consistent API responses
function apiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function apiError(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return apiError('ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ', 401);
  }

  try {
    const { id } = await params;

    // Check if account has children
    const children = await prisma.chartOfAccount.findFirst({
      where: { parentId: id },
    });

    if (children) {
      return apiError('ไม่สามารถลบบัญชีที่มีบัญชีย่อยได้ กรุณาลบบัญชีย่อยก่อน', 400);
    }

    // Check if account is used in journal entries
    const journalLines = await prisma.journalLine.findFirst({
      where: { accountId: id },
    });

    if (journalLines) {
      return apiError('ไม่สามารถลบบัญชีที่มีรายการบันทึกบัญชีได้', 400);
    }

    // Soft delete by setting isActive to false
    await prisma.chartOfAccount.update({
      where: { id: id },
      data: { isActive: false },
    });

    return apiResponse({ message: 'ลบบัญชีสำเร็จ' });
  } catch (error) {
    return apiError('เกิดข้อผิดพลาดในการลบบัญชี', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiError('ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ', 401);
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const account = await prisma.chartOfAccount.update({
      where: { id: id },
      data: {
        name: data.name,
        nameEn: data.nameEn || null,
        type: data.type,
        isDetail: data.isDetail,
        isActive: data.isActive,
        notes: data.notes || null,
      },
    });

    return apiResponse({
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
    return apiError('เกิดข้อผิดพลาดในการอัปเดตบัญชี', 500);
  }
}
