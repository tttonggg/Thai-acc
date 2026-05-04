'use client';

import { useSession } from 'next-auth/react';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [], // Full access — handled by checkPermission bypass
  SENIOR_ACCOUNTANT: [
    'invoice.create',
    'invoice.read',
    'invoice.post',
    'invoice.approve',
    'invoice.void',
    'receipt.create',
    'receipt.read',
    'receipt.approve',
    'receipt.void',
    'journal.create',
    'journal.read',
    'journal.post',
    'journal.void',
    'journal.approve',
    'purchase.create',
    'purchase.read',
    'purchase.approve',
    'purchase.void',
    'report.read',
    'employee.read',
    'customer.read',
    'vendor.read',
    'product.read',
    'payroll.read',
  ],
  ACCOUNTANT: [
    'invoice.create',
    'invoice.read',
    'receipt.create',
    'receipt.read',
    'journal.create',
    'journal.read',
    'purchase.create',
    'purchase.read',
    'report.read',
    'customer.read',
    'vendor.read',
  ],
  USER: ['customer.read', 'product.read', 'quotation.create', 'quotation.read', 'report.read'],
  VIEWER: ['report.read'],
};

function checkPermission(
  session: NonNullable<ReturnType<typeof useSession>['data']>,
  code: string
): boolean {
  if (session.user.role === 'OWNER' || session.user.role === 'ADMIN') return true;
  const allowed = ROLE_PERMISSIONS[session.user.role] || [];
  return allowed.includes(code);
}

export function usePermission(permissionCode: string): boolean {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return false;
  return checkPermission(session, permissionCode);
}

export function useAnyPermission(permissionCodes: string[]): boolean {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return false;
  if (session.user.role === 'OWNER' || session.user.role === 'ADMIN') return true;
  return permissionCodes.some((code) => checkPermission(session, code));
}

export function useAllPermissions(permissionCodes: string[]): boolean {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return false;
  if (session.user.role === 'OWNER' || session.user.role === 'ADMIN') return true;
  return permissionCodes.every((code) => checkPermission(session, code));
}
