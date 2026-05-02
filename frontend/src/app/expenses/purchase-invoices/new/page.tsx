import { Suspense } from "react";
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";

export default function CreatePurchaseInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">กำลังโหลด...</div>}>
      <PurchaseInvoiceForm />
    </Suspense>
  );
}
