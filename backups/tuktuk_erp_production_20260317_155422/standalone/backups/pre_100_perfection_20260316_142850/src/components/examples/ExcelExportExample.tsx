/**
 * Excel Export Button Component Example
 * Demonstrates how to add Excel export functionality to report pages
 */

'use client'

import { useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface ExcelExportButtonProps {
  reportType: 'trial-balance' | 'income-statement' | 'balance-sheet'
  params?: {
    asOfDate?: string
    startDate?: string
    endDate?: string
    accountId?: string
  }
  filename?: string
}

export function ExcelExportButton({
  reportType,
  params = {},
  filename,
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (params.asOfDate) {
        queryParams.set('asOfDate', params.asOfDate)
      }
      if (params.startDate) {
        queryParams.set('startDate', params.startDate)
      }
      if (params.endDate) {
        queryParams.set('endDate', params.endDate)
      }
      if (params.accountId) {
        queryParams.set('accountId', params.accountId)
      }

      // Fetch Excel file
      const response = await fetch(
        `/api/reports/${reportType}/export/excel?${queryParams.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to export Excel')
      }

      // Get blob and create download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Generate filename if not provided
      const defaultFilename = `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`
      a.download = filename || defaultFilename

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'ส่งออก Excel สำเร็จ',
        description: 'ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'ส่งออก Excel ไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาดในการส่งออกไฟล์',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          กำลังส่งออก...
        </>
      ) : (
        <>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          ส่งออก Excel
        </>
      )}
    </Button>
  )
}

/**
 * Multi-Report Export Button
 * Allows exporting multiple report types
 */

interface MultiReportExportButtonProps {
  reportType: 'trial-balance' | 'income-statement' | 'balance-sheet'
  params?: {
    asOfDate?: string
    startDate?: string
    endDate?: string
  }
}

export function MultiReportExportButton({
  reportType,
  params = {},
}: MultiReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const exportAs = async (format: 'excel' | 'pdf') => {
    setIsExporting(true)

    try {
      const queryParams = new URLSearchParams()
      if (params.asOfDate) {
        queryParams.set('asOfDate', params.asOfDate)
      }
      if (params.startDate) {
        queryParams.set('startDate', params.startDate)
      }
      if (params.endDate) {
        queryParams.set('endDate', params.endDate)
      }

      const endpoint =
        format === 'excel'
          ? `/api/reports/${reportType}/export/excel`
          : `/api/reports/${reportType}/export/pdf`

      const response = await fetch(`${endpoint}?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to export ${format.toUpperCase()}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: `ส่งออก ${format === 'excel' ? 'Excel' : 'PDF'} สำเร็จ`,
        description: `ดาวน์โหลดไฟล์ ${format === 'excel' ? 'Excel' : 'PDF'} เรียบร้อยแล้ว`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'ส่งออกไม่สำเร็จ',
        description: 'เกิดข้อผิดพลาดในการส่งออกไฟล์',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังส่งออก...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              ส่งออกรายงาน
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportAs('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          ส่งออกเป็น Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAs('pdf')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          ส่งออกเป็น PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Usage Example in Report Page:
 *
 * ```tsx
 * import { ExcelExportButton } from '@/components/examples/ExcelExportExample'
 *
 * export default function TrialBalancePage() {
 *   const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
 *
 *   return (
 *     <div>
 *       <div className="flex justify-between items-center">
 *         <h1>งบทดลอง</h1>
 *         <ExcelExportButton
 *           reportType="trial-balance"
 *           params={{ asOfDate }}
 *           filename={`trial-balance-${asOfDate}.xlsx`}
 *         />
 *       </div>
 *
 *       {/* Report content *\/}
 *     </div>
 *   )
 * }
 * ```
 */
