import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { db } from "./db"
import type { UserRole } from "@prisma/client"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ")
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
    const lineVat = lineAmount * (line.vatRate / 100)
    subtotal += lineAmount
    totalVat += lineVat
  }
  
  const discountFromPercent = subtotal * (discountPercent / 100)
  const totalDiscount = discountAmount + discountFromPercent
  const netSubtotal = subtotal - totalDiscount
  const netVat = totalVat - (totalVat * (discountPercent / 100))
  const totalAmount = netSubtotal + netVat
  const withholdingAmount = netSubtotal * (withholdingRate / 100)
  const netAmount = totalAmount - withholdingAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    vatAmount: Math.round(netVat * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    withholdingAmount: Math.round(withholdingAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
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
