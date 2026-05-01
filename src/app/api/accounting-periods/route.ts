// B1. Accounting Periods API
// API สำหรับจัดการงวดบัญชี

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse, errorResponse } from '@/lib/api-utils';
import {
  checkPeriodStatus,
  closePeriod,
  reopenPeriod,
  lockPeriod,
  generatePeriodReconciliationReport,
  initializeYearPeriods,
} from '@/lib/period-service';
import { z } from 'zod';
import { AccountingPeriodStatus } from '@prisma/client';

const periodStatusEnum = z.nativeEnum(AccountingPeriodStatus);

// GET /api/accounting-periods - List all periods
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return errorResponse('Unauthorized', 401);

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const status = searchParams.get('status') || undefined;

    const periods = await prisma.accountingPeriod.findMany({
      where: {
        ...(year && { year }),
        ...(status && { status: status as AccountingPeriodStatus }),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return apiResponse({ periods });
  } catch (error) {
    console.error('Error fetching periods:', error);
    return errorResponse('Failed to fetch periods', 500);
  }
}

// POST /api/accounting-periods - Create/Update period or perform action
const periodActionSchema = z.object({
  action: z.enum(['init-year', 'close', 'reopen', 'lock', 'reconcile']),
  year: z.number(),
  month: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return errorResponse('Unauthorized', 401);

  try {
    const body = await req.json();
    const { action, year, month } = periodActionSchema.parse(body);

    switch (action) {
      case 'init-year': {
        await initializeYearPeriods(year);
        return apiResponse({
          message: `Initialized periods for year ${year}`,
        });
      }

      case 'close': {
        if (!month) return errorResponse('Month is required', 400);
        const period = await closePeriod(year, month, session.user.id);
        return apiResponse({ period, message: `Closed period ${month}/${year}` });
      }

      case 'reopen': {
        if (!month) return errorResponse('Month is required', 400);
        const period = await reopenPeriod(year, month, session.user.id);
        return apiResponse({
          period,
          message: `Reopened period ${month}/${year}`,
        });
      }

      case 'lock': {
        if (!month) return errorResponse('Month is required', 400);
        const period = await lockPeriod(year, month, session.user.id);
        return apiResponse({ period, message: `Locked period ${month}/${year}` });
      }

      case 'reconcile': {
        if (!month) return errorResponse('Month is required', 400);
        const report = await generatePeriodReconciliationReport(year, month);
        return apiResponse({ report });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Error processing period action:', error);
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    return errorResponse('Failed to process request', 500);
  }
}
