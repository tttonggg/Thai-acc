'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  loading?: boolean
  submitLabel?: string
  cancelLabel?: string
  showFooter?: boolean
  disableSubmit?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const maxWidthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  loading = false,
  submitLabel = 'บันทึก',
  cancelLabel = 'ยกเลิก',
  showFooter = true,
  disableSubmit = false,
  maxWidth = 'lg',
}: FormDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(e)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidthClasses[maxWidth]} aria-labelledby="form-dialog-title">
        <DialogHeader>
          <DialogTitle id="form-dialog-title">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">{children}</div>

          {showFooter && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                aria-label="ยกเลิก"
              >
                {cancelLabel}
              </Button>
              <Button 
                type="submit" 
                disabled={loading || disableSubmit}
                aria-label={loading ? 'กำลังบันทึก' : submitLabel}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    กำลังบันทึก...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
