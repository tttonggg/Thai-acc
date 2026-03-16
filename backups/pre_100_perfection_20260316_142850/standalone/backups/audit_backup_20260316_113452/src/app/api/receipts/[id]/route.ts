import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'
import { generateDocumentNumber } from '@/lib/thai-accounting'

// Validation schema for receipt allocation
const receiptAllocationSchema = z.object({
  invoiceId: z.string().min(1, 'กรุณาระบุใบกำกับภาษี'),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
})

// Validation schema for receipt
const receiptSchema = z.object({
  receiptDate: z.string().transform((val) => new Date(val)),
  customerId: z.string().min(1, 'กรุณาเลือกลูกค้า'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'TRANSFER', 'CREDIT', 'OTHER']).default('CASH'),
  bankAccountId: z.string().optional().nullable(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  amount: z.number().min(0, 'จำนวนเงินต้องไม่ติดลบ'),
  notes: z.string().optional(),
  allocations: z.array(receiptAllocationSchema).optional().default([]),
})

// GET - Get single receipt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const { id } = await params

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        customer: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: {
              include: {
                customer: true,
              }
            }
          }
        },
        journalEntry: true,
      }
    })

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสร็จรับเงิน' },
        { status: 404 }
      )
    }

    // Calculate totals
    const totalAllocated = receipt.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    const totalWht = receipt.allocations.reduce((sum, alloc) => sum + alloc.whtAmount, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...receipt,
        totalAllocated,
        totalWht,
        remaining: receipt.amount - totalAllocated,
      }
    })
  } catch (error: any) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// PUT - Update receipt (draft only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const { id } = await params
    const body = await request.json()
    const validatedData = receiptSchema.parse(body)

    // Check if receipt exists and is draft
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        allocations: true,
      }
    })

    if (!existingReceipt) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสร็จรับเงิน' },
        { status: 404 }
      )
    }

    if (existingReceipt.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'สามารถแก้ไขได้เฉพาะสถานะร่างเท่านั้น' },
        { status: 400 }
      )
    }

    // Validate that total allocations don't exceed amount
    const totalAllocation = validatedData.allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    const totalWht = validatedData.allocations.reduce((sum, alloc) => sum + alloc.whtAmount, 0)

    if (totalAllocation > validatedData.amount) {
      return NextResponse.json(
        { success: false, error: 'ยอดจัดจ่ายเกินกว่ายอดรับเงิน' },
        { status: 400 }
      )
    }

    // Validate bank account for non-cash payments
    if ((validatedData.paymentMethod === 'TRANSFER' || validatedData.paymentMethod === 'CHEQUE') && !validatedData.bankAccountId) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุบัญชีธนาคาร' },
        { status: 400 }
      )
    }

    // Calculate unallocated amount
    const unallocated = validatedData.amount - totalAllocation

    // Delete existing allocations
    await prisma.receiptAllocation.deleteMany({
      where: { receiptId: id }
    })

    // Update receipt
    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        receiptDate: validatedData.receiptDate,
        customerId: validatedData.customerId,
        paymentMethod: validatedData.paymentMethod,
        bankAccountId: validatedData.bankAccountId,
        chequeNo: validatedData.chequeNo,
        chequeDate: validatedData.chequeDate,
        amount: validatedData.amount,
        whtAmount: totalWht,
        unallocated,
        notes: validatedData.notes,
        allocations: {
          create: validatedData.allocations.map(alloc => ({
            invoiceId: alloc.invoiceId,
            amount: alloc.amount,
            whtRate: alloc.whtRate,
            whtAmount: alloc.whtAmount,
          }))
        }
      },
      include: {
        customer: true,
        bankAccount: true,
        allocations: {
          include: {
            invoice: true,
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: receipt })
  } catch (error: any) {
    console.error('Error updating receipt:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการแก้ไขใบเสร็จรับเงิน' },
      { status: 500 }
    )
  }
}

// DELETE - Delete receipt (admin only, draft only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const { id } = await params

    // Check if receipt exists
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    })

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบใบเสร็จรับเงิน' },
        { status: 404 }
      )
    }

    // Only draft receipts can be deleted
    if (receipt.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'สามารถลบได้เฉพาะสถานะร่างเท่านั้น' },
        { status: 400 }
      )
    }

    // Delete receipt (allocations will be cascade deleted)
    await prisma.receipt.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'ลบใบเสร็จรับเงินเรียบร้อยแล้ว' })
  } catch (error: any) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบใบเสร็จรับเงิน' },
      { status: 500 }
    )
  }
}
