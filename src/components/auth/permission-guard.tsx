'use client'

import { useAuthStore, checkPermission, PermissionKey } from '@/stores/auth-store'
import { useSession } from 'next-auth/react'

interface PermissionGuardProps {
  permission: PermissionKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { data: session } = useSession()
  const user = useAuthStore((state) => state.user)

  // Use session user role if available, otherwise use store
  const userRole = (session?.user?.role || user?.role) as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER' | undefined

  // Check if user is authenticated
  if (!userRole) {
    return fallback ? <>{fallback}</> : null
  }

  // Check permission
  if (!checkPermission(userRole, permission)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
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
