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
  permissions: string[] // RBAC permissions from database
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setPermissions: (permissions: string[]) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hasPermission: (module: string, action: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),

      setPermissions: (permissions) => set({ permissions }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => {
        set({
          user: null,
          permissions: [],
          isAuthenticated: false,
          isLoading: false
        })
      },

      // Check if user has a specific permission
      hasPermission: (module: string, action: string) => {
        const state = get()
        // ADMIN has all permissions
        if (state.user?.role === 'ADMIN') return true
        // Check permission code format: module.action
        const code = `${module}.${action}`
        return state.permissions.includes(code)
      },
    }),
    {
      name: 'thai-accounting-auth',
      // Only persist user/auth state, NOT permissions - permissions come from API on each session
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// Permission helpers
export const hasPermission = (userRole: UserRole, requiredRoles?: UserRole[]): boolean => {
  if (!requiredRoles || !Array.isArray(requiredRoles)) {
    return false
  }
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

  // Inventory
  INVENTORY_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  INVENTORY_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  INVENTORY_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  INVENTORY_DELETE: ['ADMIN'] as UserRole[],

  // Banking
  BANKING_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  BANKING_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  BANKING_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  BANKING_DELETE: ['ADMIN'] as UserRole[],

  // Assets
  ASSETS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  ASSETS_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  ASSETS_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  ASSETS_DELETE: ['ADMIN'] as UserRole[],

  // Payroll
  PAYROLL_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  PAYROLL_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  PAYRUN_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  PAYROLL_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  PAYROLL_DELETE: ['ADMIN'] as UserRole[],

  // Petty Cash
  PETTY_CASH_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  PETTY_CASH_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  PETTY_CASH_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  PETTY_CASH_DELETE: ['ADMIN'] as UserRole[],

  // Payments & Receipts
  PAYMENTS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  PAYMENTS_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  PAYMENTS_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  PAYMENTS_DELETE: ['ADMIN'] as UserRole[],

  RECEIPTS_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  RECEIPTS_CREATE: ['ADMIN', 'ACCOUNTANT', 'USER'] as UserRole[],
  RECEIPTS_EDIT: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  RECEIPTS_DELETE: ['ADMIN'] as UserRole[],

  // Credit Notes & Debit Notes
  CREDIT_NOTES_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  CREDIT_NOTES_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],
  DEBIT_NOTES_VIEW: ['ADMIN', 'ACCOUNTANT', 'USER', 'VIEWER'] as UserRole[],
  DEBIT_NOTES_CREATE: ['ADMIN', 'ACCOUNTANT'] as UserRole[],

  // Settings & User Management - Admin only
  SETTINGS_VIEW: ['ADMIN'] as UserRole[],
  SETTINGS_EDIT: ['ADMIN'] as UserRole[],
  USER_MANAGEMENT: ['ADMIN'] as UserRole[],
} as const

export type PermissionKey = keyof typeof PERMISSIONS

export const checkPermission = (userRole: UserRole | undefined, permission: PermissionKey): boolean => {
  if (!userRole) {
    return false
  }
  const requiredRoles = PERMISSIONS[permission]
  if (!requiredRoles || !Array.isArray(requiredRoles)) {
    return false
  }
  return hasPermission(userRole, requiredRoles)
}
