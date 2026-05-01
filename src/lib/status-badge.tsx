/**
 * Standardized Status Badge Configuration
 * Ensures consistent badge colors and labels across all modules
 */

import { Badge, BadgeProps } from '@/components/ui/badge';

export interface StatusConfig {
  variant: BadgeProps['variant'];
  label: string;
}

/**
 * Standard status configuration for all modules
 * Use this mapping to ensure consistency across the application
 */
export const statusConfig: Record<string, StatusConfig> = {
  // Draft states
  DRAFT: { variant: 'secondary', label: 'ร่าง' },

  // Pending/Waiting states
  PENDING: { variant: 'outline', label: 'รออนุมัติ' },
  PENDING_APPROVAL: { variant: 'outline', label: 'รออนุมัติ' },
  AWAITING_APPROVAL: { variant: 'outline', label: 'รออนุมัติ' },

  // Sent/Submitted states
  SENT: { variant: 'default', label: 'ส่งแล้ว' },
  SUBMITTED: { variant: 'default', label: 'ส่งแล้ว' },

  // Approved/Confirmed states
  APPROVED: { variant: 'default', label: 'อนุมัติแล้ว' },
  CONFIRMED: { variant: 'default', label: 'ยืนยันแล้ว' },
  ACCEPTED: { variant: 'default', label: 'ตกลงแล้ว' },

  // Active/Published states
  ISSUED: { variant: 'default', label: 'ออกแล้ว' },
  POSTED: { variant: 'default', label: 'ลงบัญชีแล้ว' },
  PUBLISHED: { variant: 'default', label: 'เผยแพร่แล้ว' },
  ACTIVE: { variant: 'default', label: 'ใช้งานอยู่' },

  // Paid/Completed states
  PAID: { variant: 'default', label: 'ชำระแล้ว' },
  COMPLETED: { variant: 'default', label: 'เสร็จสิ้น' },
  DELIVERED: { variant: 'default', label: 'จัดส่งแล้ว' },
  RECEIVED: { variant: 'default', label: 'รับแล้ว' },

  // Partial states
  PARTIAL: { variant: 'outline', label: 'บางส่วน' },
  PARTIALLY_PAID: { variant: 'outline', label: 'ชำระบางส่วน' },
  RECEIVING: { variant: 'outline', label: 'รับของบางส่วน' },

  // In Progress states
  ORDERED: { variant: 'default', label: 'สั่งซื้อแล้ว' },

  // Overdue/Critical states
  OVERDUE: { variant: 'destructive', label: 'เกินกำหนด' },
  OVERPAYMENT: { variant: 'destructive', label: 'จ่ายเกิน' },

  // Cancelled/Rejected states
  CANCELLED: { variant: 'destructive', label: 'ยกเลิก' },
  CANCELED: { variant: 'destructive', label: 'ยกเลิก' },
  REJECTED: { variant: 'destructive', label: 'ปฏิเสธ' },
  VOID: { variant: 'destructive', label: 'ลงรายการยกเลิก' },

  // Closed/Inactive states
  CLOSED: { variant: 'secondary', label: 'ปิดแล้ว' },
  INACTIVE: { variant: 'secondary', label: 'ไม่ใช้งาน' },
  ARCHIVED: { variant: 'secondary', label: 'จัดเก็บ' },

  // Quotation-specific states
  REVISED: { variant: 'outline', label: 'แก้ไขแล้ว' },
  EXPIRED: { variant: 'secondary', label: 'หมดอายุ' },
  CONVERTED: { variant: 'default', label: 'แปลงเป็นใบกำกับภาษี' },

  // Payment-specific states
  UNPAID: { variant: 'outline', label: 'ยังไม่จ่าย' },
};

/**
 * Get status badge props for a given status
 * Falls back to secondary variant and original status text if not found
 */
export function getStatusBadgeProps(status: string): StatusConfig {
  return statusConfig[status] || { variant: 'secondary', label: status };
}

/**
 * StatusBadge Component
 * Renders a standardized badge for any status
 */
export function StatusBadge({ status }: { status: string }) {
  const config = getStatusBadgeProps(status);

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Hook for using status badges in components
 * Provides convenient access to status configuration
 */
export function useStatusBadge() {
  return {
    getStatusBadgeProps,
    statusConfig,
  };
}
