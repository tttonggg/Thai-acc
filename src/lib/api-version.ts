/**
 * API Version Management
 * Phase D: API Mastery - API Versioning
 *
 * Features:
 * - URL-based versioning (/api/v1/, /api/v2/)
 * - Deprecation warnings
 * - Version migration guide
 * - Sunset dates for deprecated versions
 */

import { NextRequest, NextResponse } from 'next/server';

// API Version Configuration
export interface ApiVersion {
  name: string;
  status: 'stable' | 'deprecated' | 'sunset';
  releasedAt: string;
  deprecatedAt?: string;
  sunsetAt?: string;
  migrationGuide?: string;
  changes: string[];
}

export const API_VERSIONS: Record<string, ApiVersion> = {
  v1: {
    name: 'v1',
    status: 'stable',
    releasedAt: '2024-01-01',
    changes: [
      'Initial API release',
      'Basic CRUD operations for invoices, customers, products',
      'Offset-based pagination',
    ],
  },
  v2: {
    name: 'v2',
    status: 'stable',
    releasedAt: '2024-03-01',
    changes: [
      'Field selection with ?fields parameter',
      'Cursor-based pagination',
      'Include relations with ?include parameter',
      'GraphQL query support',
      'Multi-currency support',
      'Enhanced invoice totals and summary',
    ],
  },
};

// Current latest version
export const LATEST_VERSION = 'v2';

// Minimum supported version
export const MINIMUM_VERSION = 'v1';

/**
 * Extract API version from URL path
 */
export function extractVersion(path: string): string | null {
  const match = path.match(/^\/api\/(v\d+)\//);
  return match ? match[1] : null;
}

/**
 * Get version info
 */
export function getVersionInfo(version: string): ApiVersion | null {
  return API_VERSIONS[version] || null;
}

/**
 * Check if version is supported
 */
export function isVersionSupported(version: string): boolean {
  const info = getVersionInfo(version);
  return info !== null && info.status !== 'sunset';
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  const info = getVersionInfo(version);
  return info?.status === 'deprecated';
}

/**
 * Generate deprecation warning header
 */
export function generateDeprecationHeader(version: string): string | null {
  const info = getVersionInfo(version);
  if (!info || info.status !== 'deprecated') return null;

  const parts = [
    `version="${version}"`,
    info.sunsetAt && `sunset="${info.sunsetAt}"`,
    info.migrationGuide && `migration="${info.migrationGuide}"`,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Version middleware - adds version headers and deprecation warnings
 */
export function addVersionHeaders(response: NextResponse, version: string): NextResponse {
  // Add API version header
  response.headers.set('X-API-Version', version);
  response.headers.set('X-API-Latest-Version', LATEST_VERSION);

  // Add deprecation warning if applicable
  const deprecationHeader = generateDeprecationHeader(version);
  if (deprecationHeader) {
    response.headers.set('Deprecation', deprecationHeader);
    response.headers.set('Sunset', API_VERSIONS[version].sunsetAt || '');
  }

  // Add link to latest version
  response.headers.set('Link', `</api/${LATEST_VERSION}>; rel="latest-version"`);

  return response;
}

/**
 * Create versioned response with appropriate headers
 */
export function createVersionedResponse(
  version: string,
  data: any,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addVersionHeaders(response, version);
}

/**
 * Get migration guide for a version transition
 */
export function getMigrationGuide(
  fromVersion: string,
  toVersion: string
): {
  steps: string[];
  breakingChanges: string[];
  newFeatures: string[];
} {
  const guide: Record<
    string,
    Record<
      string,
      {
        steps: string[];
        breakingChanges: string[];
        newFeatures: string[];
      }
    >
  > = {
    v1: {
      v2: {
        steps: [
          'Update base URL from /api/v1/ to /api/v2/',
          'Replace offset pagination with cursor pagination',
          'Add field selection to reduce response size',
          'Use include parameter for related data',
          'Handle multi-currency fields if applicable',
        ],
        breakingChanges: [
          'Pagination changed from offset to cursor-based',
          'Default response fields reduced - use ?fields to specify',
          'Relation nesting changed - use ?include',
        ],
        newFeatures: [
          'Field selection with ?fields',
          'Cursor-based pagination',
          'Relation inclusion with ?include',
          'GraphQL support',
          'Multi-currency support',
          'Automatic summary calculations',
        ],
      },
    },
  };

  return (
    guide[fromVersion]?.[toVersion] || {
      steps: ['Contact support for migration assistance'],
      breakingChanges: [],
      newFeatures: [],
    }
  );
}

/**
 * Version negotiation middleware for Next.js
 */
export async function versionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip versioned routes and special routes
  if (
    pathname.match(/^\/api\/v\d+\//) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/graphql') ||
    pathname.startsWith('/api/docs') ||
    pathname.startsWith('/api/analytics')
  ) {
    return NextResponse.next();
  }

  // Check for version override header
  const versionOverride = request.headers.get('X-API-Version');
  if (versionOverride && isVersionSupported(versionOverride)) {
    // Rewrite to versioned route
    const newPath = pathname.replace('/api/', `/api/${versionOverride}/`);
    const url = request.nextUrl.clone();
    url.pathname = newPath;

    const response = NextResponse.rewrite(url);
    return addVersionHeaders(response, versionOverride);
  }

  // Default to latest version for unversioned routes
  const response = NextResponse.next();
  response.headers.set('X-API-Latest-Version', LATEST_VERSION);

  // Add deprecation warning for unversioned API usage
  if (pathname.startsWith('/api/') && !pathname.includes('/v')) {
    response.headers.set(
      'Deprecation',
      'version="unversioned", sunset="2024-12-31", migration="/api/docs"'
    );
  }

  return response;
}

/**
 * Get all versions info for documentation
 */
export function getVersionsDocumentation(): {
  versions: ApiVersion[];
  latest: string;
  minimum: string;
} {
  return {
    versions: Object.values(API_VERSIONS),
    latest: LATEST_VERSION,
    minimum: MINIMUM_VERSION,
  };
}
