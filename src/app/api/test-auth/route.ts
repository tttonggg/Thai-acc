import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Test database connection
    const creditNoteCount = await db.creditNote.count();
    const debitNoteCount = await db.debitNote.count();
    const stockTakeCount = await db.stockTake.count();

    return NextResponse.json({
      success: true,
      message: 'Authentication and database working!',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      database: {
        creditNoteCount,
        debitNoteCount,
        stockTakeCount,
      },
    });
  } catch (error: unknown) {
    console.error('Test API Error:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message;
    const stack = err.stack;
    return NextResponse.json(
      {
        success: false,
        error: message,
        stack,
      },
      { status: 500 }
    );
  }
}
