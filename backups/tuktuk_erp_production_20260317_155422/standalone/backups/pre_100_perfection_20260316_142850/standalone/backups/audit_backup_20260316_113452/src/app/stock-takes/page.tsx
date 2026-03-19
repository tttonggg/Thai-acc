'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { StockTakePage } from '@/components/stock-takes/stock-take-page'

export default function StockTakesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (status === 'unauthenticated' || !session) {
    router.push('/')
    return null
  }

  // Check permissions - only ADMIN and ACCOUNTANT can access
  const userRole = session.user?.role as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'
  if (userRole !== 'ADMIN' && userRole !== 'ACCOUNTANT') {
    router.push('/')
    return null
  }

  // Render the Stock Take page
  return <StockTakePage />
}

// Note: Metadata cannot be exported from client components
// The page title is handled by the StockTakePage component internally

