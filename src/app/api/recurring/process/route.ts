import { NextRequest, NextResponse } from 'next/server';
import { processRecurringDocuments, getDueDocuments } from '@/lib/recurring-document-service';
import { requireAuth } from '@/lib/api-utils';
import { getSchedulerStatus, triggerManualCheck } from '@/lib/scheduler';

// POST /api/recurring/process - Manually trigger processing
// This endpoint is used by cron/scheduler to process due recurring documents
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    // Get current scheduler status
    const status = getSchedulerStatus();

    // Trigger manual processing
    const result = await triggerManualCheck();

    return NextResponse.json({
      success: true,
      data: {
        schedulerStatus: status,
        processingResult: result,
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    if (error.message === 'Processing already in progress') {
      return NextResponse.json(
        { success: false, error: 'กำลังประมวลผลอยู่ กรุณารอสักครู่' },
        { status: 409 }
      );
    }
    console.error('Recurring process API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการประมวลผลเอกสารที่เกิดซ้ำ' },
      { status: 500 }
    );
  }
}

// GET /api/recurring/process - Get processing status
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const status = getSchedulerStatus();
    const dueDocuments = await getDueDocuments();

    return NextResponse.json({
      success: true,
      data: {
        scheduler: status,
        dueDocumentsCount: dueDocuments.length,
        dueDocuments: dueDocuments.map((d: any) => ({
          id: d.id,
          title: d.title,
          type: d.type,
          nextRunAt: d.nextRunAt,
        })),
      },
    });
  } catch (error: any) {
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    console.error('Recurring process API error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงสถานะ' },
      { status: 500 }
    );
  }
}
