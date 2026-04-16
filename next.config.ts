import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable standalone mode to fix static file serving
  // output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    const modulePaths = [
      '/accounts', '/journal', '/invoices', '/vat', '/wht',
      '/customers', '/vendors', '/purchase-requests', '/purchase-orders',
      '/purchases', '/payments', '/credit-notes', '/debit-notes',
      '/inventory', '/products', '/warehouses', '/stock-takes',
      '/banking', '/assets', '/payroll', '/employees',
      '/petty-cash', '/reports', '/settings', '/users',
    ];

    return [
      // SPA Routing - rewrite module paths to root
      // CRITICAL: Do not rewrite _next/static, _next/image, or static assets
      ...modulePaths.map(path => ({
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
