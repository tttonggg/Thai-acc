"use client";

import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { BookOpen, List, FilePlus } from "lucide-react";

export default function AccountingPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">บัญชี</h1>
          <p className="text-gray-500 mt-1">ผังบัญชี และ สมุดรายวัน</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/accounting/chart-of-accounts"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-peak-purple to-peak-teal flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ผังบัญชี</h2>
                <p className="text-sm text-gray-500">Chart of Accounts</p>
              </div>
            </div>
            <p className="text-gray-600">
              ดูและจัดการผังบัญชีทั้งหมด แบ่งตามประเภทบัญชี สินทรัพย์ หนี้สิน ทุน รายได้ ค่าใช้จ่าย
            </p>
          </Link>

          <Link
            href="/accounting/journal-entries"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-peak-purple to-peak-teal flex items-center justify-center">
                <List className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">สมุดรายวัน</h2>
                <p className="text-sm text-gray-500">Journal Entries</p>
              </div>
            </div>
            <p className="text-gray-600">
              ดูรายการบันทึกบัญชีทั้งหมด และบันทึกบัญชีแบบ Manual Journal Entry
            </p>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
