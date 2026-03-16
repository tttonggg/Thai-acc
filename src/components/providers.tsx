'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query/devtools'
import { useState } from 'react'
import { WebSocketProvider } from '@/components/websocket/websocket-provider'
import { PWAProvider } from '@/components/pwa/pwa-provider'
import { OfflineSyncProvider } from '@/components/offline-sync/offline-sync-provider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WebSocketProvider>
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
          </WebSocketProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
