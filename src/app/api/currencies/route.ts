// B2. Currencies API
// API สำหรับจัดการสกุลเงิน

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiResponse, errorResponse } from '@/lib/api-utils';
import {
  initializeDefaultCurrencies,
  getExchangeRate,
  convertCurrency,
} from '@/lib/currency-service';
import { z } from 'zod';

const currencySchema = z.object({
  code: z.string().min(3).max(3),
  name: z.string(),
  nameTh: z.string().optional(),
  symbol: z.string(),
  isBase: z.boolean().default(false),
  decimalPlaces: z.number().int().min(0).max(4).default(2),
  isActive: z.boolean().default(true),
});

// GET /api/currencies - List all currencies
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return errorResponse('Unauthorized', 401);

  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true';

    const currencies = await prisma.currency.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        exchangeRates: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ isBase: 'desc' }, { code: 'asc' }],
    });

    return apiResponse({ currencies });
  } catch (error: unknown) {
    console.error('Error fetching currencies:', error);
    return errorResponse('Failed to fetch currencies', 500);
  }
}

// POST /api/currencies - Create or update currency
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return errorResponse('Unauthorized', 401);

  // Only ADMIN and ACCOUNTANT can manage currencies
  if (!['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
    return errorResponse('Forbidden', 403);
  }

  try {
    const body = await req.json();

    // Handle initialization action
    if (body.action === 'initialize') {
      await initializeDefaultCurrencies();
      return apiResponse({ message: 'Default currencies initialized' });
    }

    const data = currencySchema.parse(body);

    // If setting as base, unset other base currencies
    if (data.isBase) {
      await prisma.currency.updateMany({
        where: { isBase: true },
        data: { isBase: false },
      });
    }

    const currency = await prisma.currency.upsert({
      where: { code: data.code },
      update: data,
      create: data,
    });

    return apiResponse({ currency });
  } catch (error: unknown) {
    console.error('Error creating/updating currency:', error);
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    return errorResponse('Failed to create/update currency', 500);
  }
}
