import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  isActive: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false 
        })
      },
    }),
    {
      name: 'thai-accounting-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// Permission helpers
export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole)
}

// Role hierarchy for permission checks
export const roleHierarchy: Record<UserRole, number> = {
  ADMIN: 4,
  ACCOUNTANT: 3,
  USER: 2,
  VIEWER: 1,
}

export const hasRoleOrHigher = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole]
}

// Permission definitions
export const PERMISSIONS = {
  // Dashboard - all roles can view
  DASHBOARD_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  
  // Chart of Accounts
  ACCOUNTS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  ACCOUNTS_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  ACCOUNTS_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  ACCOUNTS_DELETE: ['ADMIN'] as UserRole[],
  
  // Journal Entry
  JOURNAL_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  JOURNAL_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  JOURNAL_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  JOURNAL_DELETE: ['ADMIN'] as UserRole[],
  JOURNAL_POST: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  
  // Invoices
  INVOICES_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  INVOICES_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  INVOICES_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  INVOICES_DELETE: ['ADMIN'] as UserRole[],
  INVOICES_ISSUE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  
  // VAT
  VAT_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  VAT_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  
  // WHT
  WHT_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  WHT_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  
  // Customers (AR)
  CUSTOMERS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  CUSTOMERS_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  CUSTOMERS_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  CUSTOMERS_DELETE: ['ADMIN'] as UserRole[],
  
  // Vendors (AP)
  VENDORS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  VENDORS_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  VENDORS_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  VENDORS_DELETE: ['ADMIN'] as UserRole[],
  
  // Reports
  REPORTS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  REPORTS_EXPORT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  
  // Settings & User Management - Admin only
  SETTINGS_VIEW: ['ADMIN'] as UserRole[],
  SETTINGS_EDIT: ['ADMIN'] as UserRole[],
  USER_MANAGEMENT: ['ADMIN'] as UserRole[],
} as const

export type PermissionKey = keyof typeof PERMISSIONS

export const checkPermission = (userRole: UserRole, permission: PermissionKey): boolean => {
  return hasPermission(userRole, PERMISSIONS[permission])
}
