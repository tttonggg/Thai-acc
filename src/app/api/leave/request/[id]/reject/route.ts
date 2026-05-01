// Reject Leave Request API (Phase 3b)
import { NextRequest, NextResponse } from 'next/server';
import { rejectLeave } from '@/lib/leave-service';
import { requireAuth } from '@/lib/api-utils';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const result = await rejectLeave(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
