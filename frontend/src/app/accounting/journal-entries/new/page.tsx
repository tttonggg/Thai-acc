import { Suspense } from "react";
import JournalEntryForm from "./JournalEntryForm";

export default function CreateJournalEntryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">กำลังโหลด...</div>}>
      <JournalEntryForm />
    </Suspense>
  );
}
