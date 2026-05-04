'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InvoiceDetailPage } from '@/components/invoices/invoice-detail-page';

export default function InvoiceDetailRoute() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const invoiceId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle back navigation - go to invoices list
  const handleBack = () => {
    router.push('/invoices');
  };

  // Client-side render after hydration to avoid 404 on direct access
  if (!mounted) {
    return null;
  }

  return (
    <InvoiceDetailPage
      invoiceId={invoiceId}
      onBack={handleBack}
      onEdit={() => {
        // Navigation handled by InvoiceDetailPage internally
      }}
    />
  );
}
