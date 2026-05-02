import { Suspense } from "react";
import ReceiptForm from "./ReceiptForm";

export default function CreateReceiptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">กำลังโหลด...</div>}>
      <ReceiptForm />
    </Suspense>
  );
}
