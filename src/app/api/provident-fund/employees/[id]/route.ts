// GET /api/provident-fund/employees/[id] - Get employee contributions
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { getEmployeeContributions } from '@/lib/provident-fund-service';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id: employeeId } = await params;
    const contributions = await getEmployeeContributions(employeeId);
    return NextResponse.json({ success: true, data: contributions });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
