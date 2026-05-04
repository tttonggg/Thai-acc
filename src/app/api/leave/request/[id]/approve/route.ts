// Approve Leave Request API (Phase 3b)
import { NextRequest, NextResponse } from 'next/server';
import { approveLeave } from '@/lib/leave-service';
import { requireAuth } from '@/lib/api-utils';
import { handleApiError } from '@/lib/api-error-handler';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const result = await approveLeave(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
