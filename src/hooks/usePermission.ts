'use client';

import { useSession } from 'next-auth/react';

const ROLE_PERMISSIONS: Record<string, string[]> = {
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

function checkPermission(session: NonNullable<ReturnType<typeof useSession>['data']>, code: string): boolean {
  if (session.user.role === 'ADMIN') return true;
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
  if (session.user.role === 'ADMIN') return true;
  return permissionCodes.some(code => checkPermission(session, code));
}

export function useAllPermissions(permissionCodes: string[]): boolean {
  const { data: session, status } = useSession();
  if (status !== 'authenticated' || !session?.user) return false;
  if (session.user.role === 'ADMIN') return true;
  return permissionCodes.every(code => checkPermission(session, code));
}
