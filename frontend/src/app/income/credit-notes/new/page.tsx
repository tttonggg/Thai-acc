import { Suspense } from "react";
import CreditNoteForm from "./CreditNoteForm";

export default function CreateCreditNotePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">กำลังโหลด...</div>}>
      <CreditNoteForm />
    </Suspense>
  );
}
