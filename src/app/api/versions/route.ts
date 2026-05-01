/**
 * API Versions Endpoint
 * Phase D: API Mastery - API Versioning
 *
 * Returns information about available API versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  API_VERSIONS,
  LATEST_VERSION,
  MINIMUM_VERSION,
  getMigrationGuide,
} from '@/lib/api-version';

// GET /api/versions - List all API versions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // If from and to are provided, return migration guide
    if (from && to) {
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const guide = getMigrationGuide(from, to);
      return NextResponse.json({
        success: true,
        from,
        to,
        ...guide,
      });
    }

    // Return all versions info
    return NextResponse.json({
      success: true,
      versions: API_VERSIONS,
      latest: LATEST_VERSION,
      minimum: MINIMUM_VERSION,
      documentation: '/api/docs',
      graphql: '/api/graphql',
      endpoints: {
        v1: {
          base: '/api/v1',
          invoices: '/api/v1/invoices',
        },
        v2: {
          base: '/api/v2',
          invoices: '/api/v2/invoices',
          features: [
            'field-selection',
            'cursor-pagination',
            'include-relations',
            'graphql-support',
          ],
        },
      },
    });
  } catch (error) {
    console.error('Error fetching API versions:', error);
    return NextResponse.json({ error: 'Failed to fetch API versions' }, { status: 500 });
  }
}
