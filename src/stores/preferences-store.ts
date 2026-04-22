import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type Density = 'compact' | 'normal' | 'comfortable'
export type Language = 'th' | 'en'

export interface UserPreferences {
  // Theme
  theme: Theme
  
  // Language
  language: Language
  
  // Table/Display density
  density: Density
  
  // Pagination
  defaultPageSize: number
  
  // Date format
  dateFormat: string
  
  // Number format
  numberFormat: {
    decimalSeparator: string
    thousandSeparator: string
    decimalPlaces: number
  }
  
  // Notifications
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
    sound: boolean
  }
  
  // Accessibility
  accessibility: {
    reducedMotion: boolean
    highContrast: boolean
    largeText: boolean
  }
  
  // Sidebar
  sidebar: {
    collapsed: boolean
    autoHide: boolean
    showRecentItems: boolean
  }
  
  // Dashboard
  dashboard: {
    defaultView: 'grid' | 'list'
    showQuickStats: boolean
    autoRefresh: boolean
    refreshInterval: number
  }
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'th',
  density: 'normal',
  defaultPageSize: 25,
  dateFormat: 'DD/MM/YYYY',
  numberFormat: {
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2,
  },
  notifications: {
    email: true,
    push: true,
    desktop: true,
    sound: false,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
  },
  sidebar: {
    collapsed: false,
    autoHide: false,
    showRecentItems: true,
  },
  dashboard: {
    defaultView: 'grid',
    showQuickStats: true,
    autoRefresh: false,
    refreshInterval: 300000, // 5 minutes
  },
}

interface PreferencesState extends UserPreferences {
  // Actions
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setDensity: (density: Density) => void
  setDefaultPageSize: (size: number) => void
  setDateFormat: (format: string) => void
  setNumberFormat: (format: UserPreferences['numberFormat']) => void
  updateNotifications: (notifications: Partial<UserPreferences['notifications']>) => void
  updateAccessibility: (accessibility: Partial<UserPreferences['accessibility']>) => void
  updateSidebar: (sidebar: Partial<UserPreferences['sidebar']>) => void
  updateDashboard: (dashboard: Partial<UserPreferences['dashboard']>) => void
  setPreferences: (preferences: Partial<UserPreferences>) => void
  resetPreferences: () => void
  
  // Computed
  getDensityClass: () => string
  getSpacingClass: () => string
  getTableDensityClass: () => string
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      // Actions
      setTheme: (theme) => set({ theme }),
      
      setLanguage: (language) => set({ language }),
      
      setDensity: (density) => set({ density }),
      
      setDefaultPageSize: (defaultPageSize) => set({ defaultPageSize }),
      
      setDateFormat: (dateFormat) => set({ dateFormat }),
      
      setNumberFormat: (numberFormat) => set({ numberFormat }),
      
      updateNotifications: (notifications) => 
        set((state) => ({ 
          notifications: { ...state.notifications, ...notifications } 
        })),
      
      updateAccessibility: (accessibility) => 
        set((state) => ({ 
          accessibility: { ...state.accessibility, ...accessibility } 
        })),
      
      updateSidebar: (sidebar) => 
        set((state) => ({ 
          sidebar: { ...state.sidebar, ...sidebar } 
        })),
      
      updateDashboard: (dashboard) => 
        set((state) => ({ 
          dashboard: { ...state.dashboard, ...dashboard } 
        })),
      
      setPreferences: (preferences) => set((state) => ({ ...state, ...preferences })),
      
      resetPreferences: () => set(defaultPreferences),

      // Computed helpers
      getDensityClass: () => {
        const { density } = get()
        switch (density) {
          case 'compact':
            return 'space-y-2'
          case 'comfortable':
            return 'space-y-6'
          case 'normal':
          default:
            return 'space-y-4'
        }
      },
      
      getSpacingClass: () => {
        const { density } = get()
        switch (density) {
          case 'compact':
            return 'p-2'
          case 'comfortable':
            return 'p-6'
          case 'normal':
          default:
            return 'p-4'
        }
      },
      
      getTableDensityClass: () => {
        const { density } = get()
        switch (density) {
          case 'compact':
            return '[&_th]:py-2 [&_td]:py-1.5 [&_th]:px-2 [&_td]:px-2 text-sm'
          case 'comfortable':
            return '[&_th]:py-4 [&_td]:py-3 [&_th]:px-4 [&_td]:px-4'
          case 'normal':
          default:
            return '[&_th]:py-3 [&_td]:py-2.5 [&_th]:px-3 [&_td]:px-3'
        }
      },
    }),
    {
      name: 'thai-erp-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        density: state.density,
        defaultPageSize: state.defaultPageSize,
        dateFormat: state.dateFormat,
        numberFormat: state.numberFormat,
        notifications: state.notifications,
        accessibility: state.accessibility,
        sidebar: state.sidebar,
        dashboard: state.dashboard,
      }),
    }
  )
)

// Hook for using preferences with server sync
export function useUserPreferences(userId?: string) {
  const preferences = usePreferencesStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load preferences from server if userId is provided
  useEffect(() => {
    if (!userId) return

    const loadPreferences = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/user/preferences`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          preferences.setPreferences(data.preferences)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [userId])

  // Save preferences to server
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    preferences.setPreferences(newPreferences)

    if (userId) {
      try {
        await fetch(`/api/user/preferences`, { credentials: 'include', 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPreferences),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save preferences')
      }
    }
  }, [userId, preferences])

  return {
    ...preferences,
    isLoading,
    error,
    savePreferences,
  }
}

// Import useState and useEffect for the hook
import { useState, useEffect, useCallback } from 'react'

// Helper function to format number based on preferences
export function formatNumberWithPreferences(
  value: number,
  preferences: UserPreferences
): string {
  const { decimalSeparator, thousandSeparator, decimalPlaces } = preferences.numberFormat
  
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
  
  // Replace separators based on preferences
  if (thousandSeparator !== ',' || decimalSeparator !== '.') {
    return formatted
      .replace(/,/g, thousandSeparator)
      .replace(/\./g, decimalSeparator)
  }
  
  return formatted
}

// Helper function to format currency based on preferences
export function formatCurrencyWithPreferences(
  value: number,
  preferences: UserPreferences,
  currency: string = 'THB'
): string {
  const numberStr = formatNumberWithPreferences(value, preferences)
  
  if (preferences.language === 'th') {
    return `฿${numberStr}`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}
