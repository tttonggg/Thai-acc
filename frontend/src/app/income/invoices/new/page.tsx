import { Suspense } from "react";
import InvoiceForm from "./InvoiceForm";

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">กำลังโหลด...</div>}>
      <InvoiceForm />
    </Suspense>
  );
}
