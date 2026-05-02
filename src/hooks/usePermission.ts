'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

/**
 * usePermission - Check if current user has a specific permission
 *
 * Usage:
 *   const canCreate = usePermission('invoice.create');
 *   const canApprove = usePermission('journal.approve');
 *
 * Returns true if user has the permission, false otherwise.
 * Unauthenticated users always return false.
 */
export function usePermission(permissionCode: string): boolean {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Not yet loaded - assume no permission until confirmed
    if (status === 'loading') {
      setHasPermission(false);
      return;
    }

    // Not authenticated
    if (!session?.user) {
      setHasPermission(false);
      return;
    }

    // ADMIN role has all permissions (override)
    if (session.user.role === 'ADMIN') {
      setHasPermission(true);
      return;
    }

    // For non-admin users, check against permissions array if available
    // The permissions array would come from the session callback
    // For now, we check against common role-based permissions
    const userRole = session.user.role;

    // Define common permissions by role (fallback for backward compat)
    const rolePermissions: Record<string, string[]> = {
      ACCOUNTANT: [
        'invoice.create', 'invoice.read', 'invoice.update', 'invoice.post',
        'receipt.create', 'receipt.read', 'receipt.update', 'receipt.post',
        'journal.create', 'journal.read', 'journal.post',
        'report.read', 'customer.read', 'vendor.read',
        'wht.read', 'wht.create', 'vat.read', 'vat.create',
        'asset.read', 'asset.create', 'asset.update',
        'banking.read', 'banking.create',
        'pettycash.read', 'pettycash.create',
        'payroll.read', 'payroll.create',
      ],
      USER: [
        'pr.create', 'pr.read', 'pr.update', 'pr.submit',
        'po.read', 'customer.read', 'product.read',
        'quotation.create', 'quotation.read', 'quotation.update',
        'report.read',
      ],
      VIEWER: [
        'report.read', 'customer.read', 'vendor.read', 'product.read',
      ],
    };

    const allowedPerms = rolePermissions[userRole] || [];
    setHasPermission(allowedPerms.includes(permissionCode));
  }, [session, status, permissionCode]);

  return hasPermission;
}

/**
 * useAnyPermission - Check if user has ANY of the specified permissions
 *
 * Usage:
 *   const canDoSomething = useAnyPermission(['invoice.create', 'invoice.approve']);
 */
export function useAnyPermission(permissionCodes: string[]): boolean {
  return permissionCodes.some(code => usePermission(code));
}

/**
 * useAllPermissions - Check if user has ALL of the specified permissions
 *
 * Usage:
 *   const canEditAll = useAllPermissions(['invoice.edit', 'invoice.delete']);
 */
export function useAllPermissions(permissionCodes: string[]): boolean {
  return permissionCodes.every(code => usePermission(code));
}