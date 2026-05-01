'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PWAContextType {
  isInstalled: boolean
  canInstall: boolean
  install: () => Promise<void>
  isOffline: boolean
  serviceWorkerRegistration: ServiceWorkerRegistration | null
  updateAvailable: boolean
  applyUpdate: () => void
}

const PWAContext = createContext<PWAContextType | null>(null)

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider')
  }
  return context
}

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      queueMicrotask(() => setIsInstalled(true))
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed
    const handleAppInstalled = () => {
      queueMicrotask(() => setIsInstalled(true))
      queueMicrotask(() => setCanInstall(false))
      queueMicrotask(() => setDeferredPrompt(null))
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    // Online/offline detection
    const handleOnline = () => queueMicrotask(() => setIsOffline(false))
    const handleOffline = () => queueMicrotask(() => setIsOffline(true))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    queueMicrotask(() => setIsOffline(!navigator.onLine))

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          queueMicrotask(() => setRegistration(reg))

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  queueMicrotask(() => setUpdateAvailable(true))
                  queueMicrotask(() => setWaitingWorker(newWorker))
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error)
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'UPDATE_AVAILABLE') {
          queueMicrotask(() => setUpdateAvailable(true))
        }
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setCanInstall(false)
    }
  }

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        canInstall,
        install,
        isOffline,
        serviceWorkerRegistration: registration,
        updateAvailable,
        applyUpdate,
      }}
    >
      {children}
    </PWAContext.Provider>
  )
}

// Add to Home Screen prompt component
export function InstallPrompt() {
  const { canInstall, install, isInstalled } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (isInstalled || !canInstall || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">ติดตั้ง Thai Accounting ERP</p>
          <p className="text-sm opacity-90">เพิ่มลงหน้าจอหลักเพื่อเข้าถึงได้เร็วขึ้น</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-sm opacity-80 hover:opacity-100"
          >
            ภายหลัง
          </button>
          <button
            onClick={install}
            className="px-4 py-1.5 bg-background text-foreground rounded text-sm font-medium hover:bg-background/90"
          >
            ติดตั้ง
          </button>
        </div>
      </div>
    </div>
  )
}

// Offline indicator
export function OfflineIndicator() {
  const { isOffline } = usePWA()

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium z-50 animate-in slide-in-from-top">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        คุณออฟไลน์อยู่ - ข้อมูลจะซิงค์เมื่อกลับออนไลน์
      </span>
    </div>
  )
}

// Update available notification
export function UpdateNotification() {
  const { updateAvailable, applyUpdate } = usePWA()

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">มีอัปเดตใหม่</p>
          <p className="text-sm opacity-90">ระบบมีการปรับปรุงใหม่พร้อมใช้งาน</p>
        </div>
        <button
          onClick={applyUpdate}
          className="px-4 py-1.5 bg-background text-foreground rounded text-sm font-medium hover:bg-background/90"
        >
          อัปเดตตอนนี้
        </button>
      </div>
    </div>
  )
}

// Type definition for BeforeInstallPromptEvent
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
    appinstalled: Event
  }
}
