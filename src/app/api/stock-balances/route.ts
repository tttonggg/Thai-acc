// Stock Balance / Inventory Valuation API (Agent 03)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';
import { getInventoryValuation } from '@/lib/inventory-service';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const valuation = await getInventoryValuation(warehouseId);
    return NextResponse.json({ success: true, data: valuation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
