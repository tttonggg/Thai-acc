'use client'

import React, { Component, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LoadingErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface LoadingErrorBoundaryState {
  hasError: boolean
  isLoading: boolean
}

export class LoadingErrorBoundary extends Component<LoadingErrorBoundaryProps, LoadingErrorBoundaryState> {
  constructor(props: LoadingErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, isLoading: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, isLoading: false }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LoadingErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-red-600 font-semibold mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                  <p className="text-sm text-gray-600">กรุณาลองโหลดข้อมูลใหม่อีกครั้ง</p>
                </div>
                <Button
                  onClick={() => this.setState({ hasError: false, isLoading: false })}
                  variant="outline"
                >
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
