'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { PWAProvider } from '@/components/pwa/pwa-provider';
import { OfflineSyncProvider } from '@/components/offline-sync/offline-sync-provider';
import { Toaster } from 'sonner';
import dynamic from 'next/dynamic';

const WebSocketProviderDynamic = dynamic(
  () => import('@/components/websocket/websocket-provider').then((m) => m.WebSocketProvider),
  { ssr: false }
);

// WebSocket is optional - only load if enabled
function OptionalWebSocketProvider({ children }: { children: React.ReactNode }) {
  // Check if WebSocket is explicitly enabled via env
  const wsEnabled = process.env.NEXT_PUBLIC_WS_ENABLED === 'true';

  if (!wsEnabled) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={null}>
      <WebSocketProviderDynamic>{children}</WebSocketProviderDynamic>
    </Suspense>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <OptionalWebSocketProvider>
            <PWAProvider>
              <OfflineSyncProvider>
                {children}
                <Toaster
                  position="top-right"
                  richColors
                  closeButton
                  toastOptions={{
                    style: {
                      fontFamily: 'inherit',
                    },
                  }}
                />
              </OfflineSyncProvider>
            </PWAProvider>
          </OptionalWebSocketProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
