import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-utils';

// GET /api/approvals/pending - Get pending approvals for current user
export async function GET() {
  try {
    const user = await requireAuth();

    // Get all roles for this user via UserEmployee -> EmployeeRole -> Role
    const userEmployees = await db.userEmployee.findMany({
      where: { userId: user.id },
      include: {
        employee: {
          include: {
            employeeRoles: {
              include: { role: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    const userRoleNames = userEmployees.flatMap((ue) =>
      ue.employee.employeeRoles.map((er) => er.role.name)
    );
    const userRoleIds = userEmployees.flatMap((ue) =>
      ue.employee.employeeRoles.map((er) => er.role.id)
    );
    const isAdmin = userRoleNames.includes('ADMIN');
    const isAccountant = userRoleNames.includes('ACCOUNTANT');

    // Admins/Accountants see all pending PRs
    if (isAdmin || isAccountant) {
      const pendingPRs = await db.purchaseRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
          requestedByUser: { select: { id: true, name: true, email: true } },
          departmentData: { select: { id: true, name: true, code: true } },
          lines: {
            include: {
              product: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: pendingPRs.map((pr) => ({
          id: pr.id,
          documentType: 'PURCHASE_REQUEST',
          documentNo: pr.requestNo,
          status: pr.status,
          estimatedAmount: pr.estimatedAmount,
          reason: pr.reason,
          createdAt: pr.createdAt,
          requestedBy: pr.requestedByUser,
          department: pr.departmentData,
          lineCount: pr.lines.length,
        })),
      });
    }

    // Non-admin: show PRs matching user's role configs
    const matchingConfigs = await db.documentApproverConfig.findMany({
      where: {
        roleId: { in: userRoleIds },
        documentType: 'PURCHASE_REQUEST',
      },
    });

    if (matchingConfigs.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const pendingPRs = await db.purchaseRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedByUser: { select: { id: true, name: true, email: true } },
        departmentData: { select: { id: true, name: true, code: true } },
        lines: {
          include: {
            product: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: pendingPRs.map((pr) => ({
        id: pr.id,
        documentType: 'PURCHASE_REQUEST',
        documentNo: pr.requestNo,
        status: pr.status,
        estimatedAmount: pr.estimatedAmount,
        reason: pr.reason,
        createdAt: pr.createdAt,
        requestedBy: pr.requestedByUser,
        department: pr.departmentData,
        lineCount: pr.lines.length,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return NextResponse.json({ success: false, error: 'ไม่ได้รับอนุญาต' }, { status: 403 });
    }
    console.error('Approvals Pending Error:', error);
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
