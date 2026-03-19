import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      // SPA Routing - rewrite all module paths to root
      { source: '/accounts', destination: '/' },
      { source: '/journal', destination: '/' },
      { source: '/invoices', destination: '/' },
      { source: '/vat', destination: '/' },
      { source: '/wht', destination: '/' },
      { source: '/customers', destination: '/' },
      { source: '/vendors', destination: '/' },
      { source: '/purchase-requests', destination: '/' },
      { source: '/purchase-orders', destination: '/' },
      { source: '/purchases', destination: '/' },
      { source: '/payments', destination: '/' },
      { source: '/credit-notes', destination: '/' },
      { source: '/debit-notes', destination: '/' },
      { source: '/inventory', destination: '/' },
      { source: '/products', destination: '/' },
      { source: '/warehouses', destination: '/' },
      { source: '/stock-takes', destination: '/' },
      { source: '/banking', destination: '/' },
      { source: '/assets', destination: '/' },
      { source: '/payroll', destination: '/' },
      { source: '/employees', destination: '/' },
      { source: '/petty-cash', destination: '/' },
      { source: '/reports', destination: '/' },
      { source: '/settings', destination: '/' },
      { source: '/users', destination: '/' },
    ];
  },
};

export default nextConfig;
