'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ApiError {
  message: string
  status?: number
  code?: string
}

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: ApiError | null
}

export class APIErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's an API error
    if (error.name === 'ApiError') {
      return { hasError: true, error: error as unknown as ApiError }
    }
    return { hasError: true, error: { message: error.message } }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('APIErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error } = this.state

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">ไม่สามารถดึงข้อมูลได้</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง
                </p>
                <Button onClick={() => window.location.reload()} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  ลองใหม่
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
