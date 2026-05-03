// Leave Management Service (Phase 3b)
// Handles leave types, balances, requests, and approvals
import prisma from '@/lib/db';

/**
 * Get all active leave types
 */
export async function getLeaveTypes() {
  return await prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });
}

/**
 * Get leave type by ID
 */
export async function getLeaveTypeById(id: string) {
  return await prisma.leaveType.findUnique({
    where: { id },
  });
}

/**
 * Initialize leave balances for an employee for a given year
 * Creates default balances from leave types
 */
export async function initializeEmployeeBalances(employeeId: string, year: number) {
  const leaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
  });

  const balances = await Promise.all(
    leaveTypes.map((lt) =>
      prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId: lt.id,
          year,
          totalDays: lt.defaultDays,
          usedDays: 0,
          pendingDays: 0,
        },
      })
    )
  );

  return balances;
}

/**
 * Get employee's leave balances for a year
 */
export async function getEmployeeBalances(employeeId: string, year: number) {
  return await prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: true },
  });
}

/**
 * Get employee's leave history (all requests)
 */
export async function getEmployeeLeaveHistory(employeeId: string, year?: number) {
  const where: any = { employeeId };
  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    where.startDate = { gte: startOfYear };
    where.endDate = { lte: endOfYear };
  }

  return await prisma.leaveRequest.findMany({
    where,
    include: { leaveType: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Submit a leave request
 * Validates that sufficient balance exists (totalDays <= availableDays)
 */
export async function requestLeave(params: {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
}) {
  const { employeeId, leaveTypeId, startDate, endDate, totalDays, reason } = params;

  // Get the year from start date
  const year = startDate.getFullYear();

  // Find or create balance for this employee/year
  let balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year,
      },
    },
  });

  if (!balance) {
    // Initialize balance for this employee/year
    const newBalances = await initializeEmployeeBalances(employeeId, year);
    balance = newBalances.find((b) => b.leaveTypeId === leaveTypeId) ?? null;
  }

  if (!balance) {
    throw new Error('ไม่พบข้อมูลวันลาของพนักงาน');
  }

  // Check available days (totalDays - usedDays - pendingDays)
  const availableDays = balance.totalDays - balance.usedDays - balance.pendingDays;
  if (totalDays > availableDays) {
    throw new Error(`วันลาคงเหลือไม่เพียงพอ (คงเหลือ ${availableDays} วัน, ขอ ${totalDays} วัน)`);
  }

  // Create the leave request and update pending days in a transaction
  return await prisma.$transaction(async (tx) => {
    const leaveRequest = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        balanceId: balance!.id,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'PENDING',
      },
    });

    // Update pending days on balance
    await tx.leaveBalance.update({
      where: { id: balance!.id },
      data: { pendingDays: { increment: totalDays } },
    });

    return leaveRequest;
  });
}

/**
 * Approve a leave request
 */
export async function approveLeave(requestId: string, approvedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('ไม่พบคำขอลา');
    }

    if (request.status !== 'PENDING') {
      throw new Error('สถานะคำขอลาไม่ถูกต้อง ต้องเป็น PENDING');
    }

    // Update request status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Move days from pending to used
    await tx.leaveBalance.update({
      where: { id: request.balanceId },
      data: {
        usedDays: { increment: request.totalDays },
        pendingDays: { decrement: request.totalDays },
      },
    });

    return updatedRequest;
  });
}

/**
 * Reject a leave request
 */
export async function rejectLeave(requestId: string, approvedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('ไม่พบคำขอลา');
    }

    if (request.status !== 'PENDING') {
      throw new Error('สถานะคำขอลาไม่ถูกต้อง ต้องเป็น PENDING');
    }

    // Update request status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Remove days from pending
    await tx.leaveBalance.update({
      where: { id: request.balanceId },
      data: { pendingDays: { decrement: request.totalDays } },
    });

    return updatedRequest;
  });
}

/**
 * Cancel a leave request (by employee)
 */
export async function cancelLeave(requestId: string, employeeId: string) {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('ไม่พบคำขอลา');
    }

    if (request.employeeId !== employeeId) {
      throw new Error('คุณไม่มีสิทธิ์ยกเลิกคำขอลานี้');
    }

    if (request.status !== 'PENDING') {
      throw new Error('สามารถยกเลิกได้เฉพาะคำขอที่รอการอนุมัติเท่านั้น');
    }

    // Update request status
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    // Remove days from pending
    await tx.leaveBalance.update({
      where: { id: request.balanceId },
      data: { pendingDays: { decrement: request.totalDays } },
    });

    return updatedRequest;
  });
}

/**
 * Get a leave request by ID
 */
export async function getLeaveRequestById(id: string) {
  return await prisma.leaveRequest.findUnique({
    where: { id },
    include: { leaveType: true, balance: true },
  });
}

/**
 * Get all pending leave requests (for manager approval)
 */
export async function getPendingLeaveRequests() {
  return await prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    include: { leaveType: true },
    orderBy: { createdAt: 'asc' },
  });
}
