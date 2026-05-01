/**
 * API Versioning Middleware for Thai Accounting ERP
 * Phase D: API Mastery - API Versioning
 *
 * Features:
 * - URL-based versioning (/api/v1/, /api/v2/)
 * - Version header support
 * - Deprecation notices
 * - Migration guides
 */

import { NextRequest, NextResponse } from 'next/server';

// Supported API versions
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

// Current stable version
export const CURRENT_VERSION: ApiVersion = 'v1';

// Deprecation status for versions
export const VERSION_STATUS: Record<
  string,
  {
    status: 'stable' | 'deprecated' | 'sunset';
    sunsetDate?: Date;
    migrationGuide?: string;
  }
> = {
  v1: {
    status: 'stable',
  },
};

// Version-specific behaviors
export const VERSION_BEHAVIORS: Record<
  string,
  {
    features: string[];
    breakingChanges?: string[];
  }
> = {
  v1: {
    features: [
      'Basic CRUD operations',
      'Invoice management',
      'Journal entries',
      'Customer/Vendor management',
      'Product management',
      'Reports',
    ],
  },
};

/**
 * Get API version from request
 */
export function getApiVersion(req: NextRequest): ApiVersion {
  // Check URL path first
  const urlVersion = req.nextUrl.pathname.match(/\/api\/(v\d+)\//)?.[1];
  if (urlVersion && Object.values(API_VERSIONS).includes(urlVersion as ApiVersion)) {
    return urlVersion as ApiVersion;
  }

  // Check Accept-Version header
  const headerVersion = req.headers.get('Accept-Version');
  if (headerVersion && Object.values(API_VERSIONS).includes(headerVersion as ApiVersion)) {
    return headerVersion as ApiVersion;
  }

  // Check X-API-Version header
  const customHeaderVersion = req.headers.get('X-API-Version');
  if (
    customHeaderVersion &&
    Object.values(API_VERSIONS).includes(customHeaderVersion as ApiVersion)
  ) {
    return customHeaderVersion as ApiVersion;
  }

  // Default to current version
  return CURRENT_VERSION;
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  return VERSION_STATUS[version]?.status === 'deprecated';
}

/**
 * Get deprecation headers for version
 */
export function getDeprecationHeaders(version: ApiVersion): Record<string, string> {
  const status = VERSION_STATUS[version];

  if (!status || status.status === 'stable') {
    return {};
  }

  const headers: Record<string, string> = {
    Deprecation: 'true',
    Sunset: status.sunsetDate?.toUTCString() || '',
  };

  if (status.migrationGuide) {
    headers['Link'] = `<${status.migrationGuide}>; rel="migration"`;
  }

  return headers;
}

/**
 * Version middleware wrapper
 */
export function withVersion(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    minVersion?: ApiVersion;
    maxVersion?: ApiVersion;
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const version = getApiVersion(req);

    // Check version constraints
    if (options?.minVersion) {
      const minV = parseInt(options.minVersion.replace('v', ''));
      const currentV = parseInt(version.replace('v', ''));
      if (currentV < minV) {
        return NextResponse.json(
          {
            error: 'Version too old',
            message: `This endpoint requires at least API version ${options.minVersion}`,
            currentVersion: version,
            documentation: '/api/docs',
          },
          { status: 400 }
        );
      }
    }

    if (options?.maxVersion) {
      const maxV = parseInt(options.maxVersion.replace('v', ''));
      const currentV = parseInt(version.replace('v', ''));
      if (currentV > maxV) {
        return NextResponse.json(
          {
            error: 'Version not supported',
            message: `This endpoint does not support API version ${version}`,
            supportedVersions: [options.minVersion, options.maxVersion].filter(Boolean),
            documentation: '/api/docs',
          },
          { status: 400 }
        );
      }
    }

    // Add version info to request headers for downstream use
    const headers = new Headers(req.headers);
    headers.set('x-api-version', version);

    // Create modified request with version header
    const modifiedReq = new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
    });

    // Execute handler
    const response = await handler(modifiedReq);

    // Add version headers to response
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-API-Version', version);
    responseHeaders.set('X-API-Current-Version', CURRENT_VERSION);

    // Add deprecation headers if applicable
    const deprecationHeaders = getDeprecationHeaders(version);
    Object.entries(deprecationHeaders).forEach(([key, value]) => {
      if (value) responseHeaders.set(key, value);
    });

    // Create new response with modified headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
}

/**
 * Create a versioned API response
 */
export function createVersionedResponse<T>(
  version: ApiVersion,
  data: T,
  options?: {
    deprecationMessage?: string;
    migrationGuide?: string;
  }
): NextResponse {
  const headers: Record<string, string> = {
    'X-API-Version': version,
    'X-API-Current-Version': CURRENT_VERSION,
  };

  if (isVersionDeprecated(version)) {
    headers['Deprecation'] = 'true';
    if (options?.deprecationMessage) {
      headers['Warning'] = `299 - "${options.deprecationMessage}"`;
    }
    if (options?.migrationGuide || VERSION_STATUS[version]?.migrationGuide) {
      headers['Link'] =
        `<${options?.migrationGuide || VERSION_STATUS[version]?.migrationGuide}>; rel="migration"`;
    }
  }

  return NextResponse.json(
    {
      version,
      data,
      meta: {
        deprecated: isVersionDeprecated(version),
        currentVersion: CURRENT_VERSION,
      },
    },
    { headers }
  );
}

/**
 * Version comparison utilities
 */
export function compareVersions(v1: ApiVersion, v2: ApiVersion): number {
  const n1 = parseInt(v1.replace('v', ''));
  const n2 = parseInt(v2.replace('v', ''));
  return n1 - n2;
}

export function isAtLeast(version: ApiVersion, minVersion: ApiVersion): boolean {
  return compareVersions(version, minVersion) >= 0;
}

export function isAtMost(version: ApiVersion, maxVersion: ApiVersion): boolean {
  return compareVersions(version, maxVersion) <= 0;
}

/**
 * Migration guide generator
 */
export function generateMigrationGuide(fromVersion: ApiVersion, toVersion: ApiVersion): string {
  const fromBehaviors = VERSION_BEHAVIORS[fromVersion];
  const toBehaviors = VERSION_BEHAVIORS[toVersion];

  if (!fromBehaviors || !toBehaviors) {
    return 'Migration guide not available for specified versions.';
  }

  const guide = [
    `# Migration Guide: ${fromVersion} to ${toVersion}`,
    '',
    '## New Features',
    ...toBehaviors.features.filter((f) => !fromBehaviors.features.includes(f)).map((f) => `- ${f}`),
    '',
  ];

  if (toBehaviors.breakingChanges?.length) {
    guide.push('## Breaking Changes', ...toBehaviors.breakingChanges.map((c) => `- ${c}`), '');
  }

  guide.push(
    '## API Changes',
    '- Update your API calls to use the new version in the URL',
    `- Base URL: /api/${toVersion}/`,
    '',
    '## Headers',
    '- Add `Accept-Version: ' + toVersion + '` header for version negotiation',
    ''
  );

  return guide.join('\n');
}

/**
 * API version info endpoint
 */
export function getVersionInfo(): {
  current: string;
  supported: string[];
  deprecated: string[];
  versions: Record<
    string,
    {
      status: string;
      features: string[];
      sunsetDate?: string;
    }
  >;
} {
  return {
    current: CURRENT_VERSION,
    supported: Object.keys(VERSION_STATUS).filter((v) => VERSION_STATUS[v].status !== 'sunset'),
    deprecated: Object.keys(VERSION_STATUS).filter(
      (v) => VERSION_STATUS[v].status === 'deprecated'
    ),
    versions: Object.fromEntries(
      Object.entries(VERSION_STATUS).map(([version, status]) => [
        version,
        {
          status: status.status,
          features: VERSION_BEHAVIORS[version]?.features || [],
          ...(status.sunsetDate && { sunsetDate: status.sunsetDate.toISOString() }),
        },
      ])
    ),
  };
}
