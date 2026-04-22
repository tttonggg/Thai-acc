'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useSession } from 'next-auth/react'

// Legacy support: PermissionKey for old PERMISSIONS system
type PermissionKey = string

interface PermissionGuardProps {
  // Either legacy permission key OR module/action pair
  permission?: PermissionKey
  module?: string
  action?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ permission, module, action, children, fallback }: PermissionGuardProps) {
  const { data: session } = useSession()
  const user = useAuthStore((state) => state.user)
  const storeHasPermission = useAuthStore((state) => state.hasPermission)

  // Use session user role if available, otherwise use store
  const userRole = (session?.user?.role || user?.role) as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER' | undefined

  // Check if user is authenticated
  if (!userRole) {
    return fallback ? <>{fallback}</> : null
  }

  // ADMIN bypasses all permission checks
  if (userRole === 'ADMIN') {
    return <>{children}</>
  }

  // New RBAC: module + action check
  if (module && action) {
    if (storeHasPermission(module, action)) {
      return <>{children}</>
    }
    return fallback ? <>{fallback}</> : null
  }

  // Legacy: permission key check
  if (permission) {
    // Map old permission keys to module.action
    const permMap: Record<string, { module: string; action: string }> = {
      'INVOICES_CREATE': { module: 'invoice', action: 'create' },
      'INVOICES_EDIT': { module: 'invoice', action: 'update' },
      'INVOICES_VIEW': { module: 'invoice', action: 'read' },
      'JOURNAL_CREATE': { module: 'journal', action: 'create' },
      'JOURNAL_POST': { module: 'journal', action: 'post' },
      'REPORTS_VIEW': { module: 'report', action: 'read' },
      'SETTINGS_VIEW': { module: 'admin', action: 'manage' },
      'USER_MANAGEMENT': { module: 'admin', action: 'users' },
    }

    const mapped = permMap[permission]
    if (mapped && storeHasPermission(mapped.module, mapped.action)) {
      return <>{children}</>
    }
  }

  return fallback ? <>{fallback}</> : null
}

interface RoleGuardProps {
  minimumRole: 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ minimumRole, children, fallback }: RoleGuardProps) {
  const { data: session } = useSession()
  const user = useAuthStore((state) => state.user)
  
  const userRole = (session?.user?.role || user?.role) as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER' | undefined
  
  const roleHierarchy = {
    ADMIN: 4,
    ACCOUNTANT: 3,
    USER: 2,
    VIEWER: 1,
  }
  
  if (!userRole || roleHierarchy[userRole] < roleHierarchy[minimumRole]) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

// HOC for wrapping components with permission check
export function withPermission<P extends object>(
  permission: PermissionKey,
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard
        permission={permission}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }
}

// HOC with module + action
export function withPermissionMA<P extends object>(
  module: string,
  action: string,
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard
        module={module}
        action={action}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }
}
