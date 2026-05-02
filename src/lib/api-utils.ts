import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { db } from "./db"
import type { UserRole } from "@prisma/client"
import { calculatePercent } from "./currency"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    const err = new Error("ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ")
    err.statusCode = 401
    throw err
  }
  return user
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role as UserRole)) {
    throw new Error("ไม่มีสิทธิ์เข้าถึง - ต้องมีบทบาทที่เหมาะสม")
  }
  return user
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === "ADMIN"
}

export async function canEdit() {
  const user = await getCurrentUser()
  return user?.role === "ADMIN" || user?.role === "ACCOUNTANT"
}

export async function canView() {
  const user = await getCurrentUser()
  return !!user // Any authenticated user can view
}

// ============================================
// RBAC Permission System
// ============================================

export interface PermissionContext {
  departmentId?: string
}

/**
 * Check if current user has a specific permission
 * Uses User.role as fallback for backward compatibility
 * ADMIN role always has access (override)
 */
export async function checkUserPermission(
  module: string,
  action: string,
  options?: PermissionContext
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // ADMIN always has access
  if (user.role === 'ADMIN') return true

  // Get user's employee roles
  const userEmployee = await db.userEmployee.findUnique({
    where: { userId: user.id },
    include: {
      employee: {
        include: {
          employeeRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!userEmployee) {
    // Fallback to legacy role check
    return legacyRoleCheck(user.role, module, action)
  }

  // Check permissions from employee's roles
  // Permission codes are in format: module.entity.action (e.g., admin.roles.read)
  for (const er of userEmployee.employee.employeeRoles) {
    // If department-specific, check department match
    if (options?.departmentId && er.departmentId !== options.departmentId) {
      continue
    }

    for (const rp of er.role.rolePermissions) {
      const perm = rp.permission
      // Match: exact code (admin.roles) or module.entity with any action (admin.roles.*)
      // Also match: module.action format (admin.manage)
      const code = perm.code
      if (code === `${module}.${action}`) {
        return true
      }
      if (code.startsWith(`${module}.${action}.`)) {
        return true
      }
      // Check if module.entity matches (any action)
      if (code.startsWith(`${module}.${action}`)) {
        return true
      }
    }
  }

  return false
}

/**
 * Require a specific permission - throws if not allowed
 */
export async function requirePermission(
  module: string,
  action: string,
  options?: PermissionContext
): Promise<NonNullable<ReturnType<typeof getCurrentUser>>> {
  const user = await requireAuth()
  const hasPermission = await checkUserPermission(module, action, options)
  if (!hasPermission) {
    throw new Error(`ไม่มีสิทธิ์ - ต้องการสิทธิ์ ${module}.${action}`)
  }
  return user
}

/**
 * Get all permissions for current user (for UI filtering)
 */
export async function getUserPermissions(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []

  // ADMIN gets all permissions
  if (user.role === 'ADMIN') {
    const allPerms = await db.permission.findMany()
    return allPerms.map(p => p.code)
  }

  const userEmployee = await db.userEmployee.findUnique({
    where: { userId: user.id },
    include: {
      employee: {
        include: {
          employeeRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!userEmployee) return []

  const perms = new Set<string>()
  for (const er of userEmployee.employee.employeeRoles) {
    for (const rp of er.role.rolePermissions) {
      perms.add(rp.permission.code)
    }
  }

  return Array.from(perms)
}

/**
 * Check if user can manage roles (assign/edit roles to other users)
 * Only roles with canManageRoles=true can manage roles
 * This prevents privilege escalation (admin cannot give themselves super_admin)
 */
export async function canManageRoles(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // ADMIN always has access to role management
  if (user.role === 'ADMIN') return true

  // Check if user's employee roles have canManageRoles flag
  const userEmployee = await db.userEmployee.findUnique({
    where: { userId: user.id },
    include: {
      employee: {
        include: {
          employeeRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  })

  if (!userEmployee) return false

  return userEmployee.employee.employeeRoles.some(er => er.role.canManageRoles)
}

/**
 * Require canManageRoles permission - throws if not allowed
 */
export async function requireCanManageRoles(): Promise<NonNullable<Awaited<ReturnType<typeof requireAuth>>>> {
  const user = await requireAuth()
  const hasPermission = await canManageRoles()
  if (!hasPermission) {
    throw new Error("ไม่มีสิทธิ์จัดการบทบาท - ต้องการสิทธิ์ admin.roles")
  }
  return user
}

/**
 * Legacy role check for backward compatibility
 * Maps old UserRole to module.action permissions
 */
function legacyRoleCheck(role: string, module: string, action: string): boolean {
  const rolePerms: Record<string, Array<{ module: string; action: string }>> = {
    ACCOUNTANT: [
      { module: 'invoice', action: 'create' },
      { module: 'invoice', action: 'read' },
      { module: 'invoice', action: 'update' },
      { module: 'invoice', action: 'post' },
      { module: 'receipt', action: 'create' },
      { module: 'receipt', action: 'read' },
      { module: 'receipt', action: 'update' },
      { module: 'receipt', action: 'post' },
      { module: 'journal', action: 'create' },
      { module: 'journal', action: 'read' },
      { module: 'journal', action: 'post' },
      { module: 'report', action: 'read' },
    ],
    USER: [
      { module: 'pr', action: 'create' },
      { module: 'pr', action: 'read' },
      { module: 'pr', action: 'update' },
      { module: 'pr', action: 'submit' },
      { module: 'po', action: 'create' },
      { module: 'po', action: 'read' },
      { module: 'po', action: 'update' },
      { module: 'report', action: 'read' },
    ],
    VIEWER: [
      { module: 'report', action: 'read' },
    ],
  }

  const perms = rolePerms[role] || []
  return perms.some(p => p.module === module && p.action === action)
}

// API Response helpers - Standardized format
// Success: { success: true, data: T }
// Error: { success: false, error: string }

export function apiResponse<T>(data: T, status: number = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ success: false, error: message }, { status })
}

// Alias for compatibility
export const errorResponse = apiError

export function unauthorizedError() {
  return apiError("ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ", 401)
}

export function forbiddenError() {
  return apiError("ไม่มีสิทธิ์เข้าถึง", 403)
}

export function notFoundError(message: string = "ไม่พบข้อมูล") {
  return apiError(message, 404)
}

export function serverError(message: string = "เกิดข้อผิดพลาดในเซิร์ฟเวอร์") {
  return apiError(message, 500)
}

// Generate document number with transaction safety
// FIXED: Wrapped in transaction to prevent race condition in concurrent requests
export async function generateDocNumber(type: string, prefix: string): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")

  // ✅ Use transaction to ensure atomicity and prevent duplicate numbers
  return await db.$transaction(
    async (tx) => {
      // Lock the document number row for this transaction
      let docNumber = await tx.documentNumber.findUnique({
        where: { type }
      })

      if (!docNumber) {
        docNumber = await tx.documentNumber.create({
          data: {
            type,
            prefix,
            currentNo: 0,
            format: "{prefix}{yyyy}{mm}-{0000}",
            resetMonthly: true,
            resetYearly: false,
          }
        })
      }

      // Increment the number within the transaction
      const newNo = docNumber.currentNo + 1

      await tx.documentNumber.update({
        where: { type },
        data: { currentNo: newNo }
      })

      const numStr = newNo.toString().padStart(4, "0")
      return `${prefix}${year}${month}-${numStr}`
    },
    {
      // Maximum time to wait for transaction to start
      maxWait: 5000, // 5 seconds
      // Maximum time for transaction to complete
      timeout: 10000, // 10 seconds
    }
  )
}

// Calculate totals for invoice
// CRITICAL: All inputs and outputs are in Satang
export function calculateInvoiceTotals(
  lines: Array<{
    quantity: number
    unitPrice: number
    discount: number
    vatRate: number
  }>,
  discountAmount: number = 0,
  discountPercent: number = 0,
  withholdingRate: number = 0
) {
  let subtotal = 0
  let totalVat = 0

  for (const line of lines) {
    const lineAmount = (line.quantity * line.unitPrice) - line.discount
    const lineVat = calculatePercent(lineAmount, line.vatRate)
    subtotal += lineAmount
    totalVat += lineVat
  }

  const discountFromPercent = calculatePercent(subtotal, discountPercent)
  const totalDiscount = discountAmount + discountFromPercent
  const netSubtotal = subtotal - totalDiscount
  const netVat = totalVat - calculatePercent(totalVat, discountPercent)
  const totalAmount = netSubtotal + netVat
  const withholdingAmount = calculatePercent(netSubtotal, withholdingRate)
  const netAmount = totalAmount - withholdingAmount

  return {
    subtotal: Math.round(subtotal),
    totalDiscount: Math.round(totalDiscount),
    vatAmount: Math.round(netVat),
    totalAmount: Math.round(totalAmount),
    withholdingAmount: Math.round(withholdingAmount),
    netAmount: Math.round(netAmount),
  }
}

// Calculate journal entry totals
export function calculateJournalTotals(lines: Array<{ debit: number; credit: number }>) {
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  return {
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
  }
}

// Get client IP address from request headers
export function getClientIp(headers: Headers): string {
  // Check various header sources for the client IP
  const forwarded = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const cfConnectingIp = headers.get('cf-connecting-ip')

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  if (realIp) {
    return realIp
  }

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  return 'unknown'
}
