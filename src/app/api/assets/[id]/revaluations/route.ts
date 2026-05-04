// GET /api/assets/[id]/revaluations - Get revaluation history for an asset
import { NextRequest, NextResponse } from 'next/server';
import { getAssetRevaluations } from '@/lib/asset-revaluation-service';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id: assetId } = await params;

    const revaluations = await getAssetRevaluations(assetId);

    return NextResponse.json({
      success: true,
      data: revaluations,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Get revaluations error:', error);
    return NextResponse.json(
      { success: false, error: err?.message ?? 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}
