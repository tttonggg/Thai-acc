"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

const publicPaths = ["/login", "/register"];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = publicPaths.includes(pathname || "");

  useEffect(() => {
    if (isPublic) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
    }
  }, [isPublic, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">
        {/* Print-only header */}
        <div className="hidden print:block px-8 pt-8 pb-2">
          <h1 className="text-xl font-bold text-gray-900">Thai ACC</h1>
          <p className="text-sm text-gray-500">ระบบบัญชีออนไลน์</p>
        </div>
        {children}
      </main>
    </div>
  );
}
