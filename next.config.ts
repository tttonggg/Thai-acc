import type { NextConfig } from 'next';

let buildHash = 'unknown';
let buildTime = new Date().toISOString();

try {
  buildHash = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  buildHash = 'docker-build';
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_HASH: buildHash,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
  // Enable standalone mode for production deployment
  output: 'standalone',
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Trust host header when behind reverse proxy (nginx/Caddy on VPS)
  trustHostHeader: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  async rewrites() {
    const modulePaths = [
      '/accounts',
      '/journal',
      '/invoices',
      '/vat',
      '/wht',
      '/customers',
      '/vendors',
      '/purchase-requests',
      '/purchase-orders',
      '/purchases',
      '/payments',
      '/credit-notes',
      '/debit-notes',
      '/inventory',
      '/products',
      '/warehouses',
      '/stock-takes',
      '/banking',
      '/assets',
      '/payroll',
      '/employees',
      '/petty-cash',
      '/reports',
      '/settings',
      '/users',
      '/cash-flow',
      '/recurring',
    ];

    return [
      // SPA Routing - rewrite module paths to root
      // CRITICAL: Do not rewrite _next/static, _next/image, or static assets
      ...modulePaths.map((path) => ({
        source: path,
        destination: '/',
      })),
    ];
  },
  // Ensure static files are served correctly
  generateEtags: true,
  compress: true,
};

export default nextConfig;
