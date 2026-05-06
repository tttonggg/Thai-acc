'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuthStore } from '@/stores/portal-auth-store';

/**
 * Portal Layout
 * Protects all /portal/* routes - redirects to /portal/login if not authenticated.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = usePortalAuthStore();

  useEffect(() => {
    // Skip check during loading (hydration)
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/portal/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
