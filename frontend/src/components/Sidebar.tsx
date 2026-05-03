"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  Settings,
  FolderKanban,
  ChevronRight,
  LogOut,
  User,
  BookOpen,
  BarChart3,
  Landmark,
  ArrowLeftRight,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "หน้าแรก", icon: LayoutDashboard },
  { href: "/contacts", label: "ลูกค้า & ผู้ติดต่อ", icon: Users },
  { href: "/products", label: "สินค้า", icon: Package },
  { href: "/stock-adjustments", label: "ปรับสต็อก", icon: Boxes },
  { href: "/projects", label: "โครงการ", icon: FolderKanban },
  { href: "/expenses", label: "รายจ่าย", icon: Receipt },
  { href: "/income", label: "รายรับ", icon: FileText },
  { href: "/bank-accounts", label: "ธนาคาร", icon: Landmark },
  { href: "/accounting", label: "บัญชี", icon: BookOpen },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/exchange-rates", label: "อัตราแลกเปลี่ยน", icon: ArrowLeftRight },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-peak-purple to-peak-teal flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Thai ACC</h1>
            <p className="text-xs text-gray-500">บัญชีออนไลน์</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-peak-purple/10 to-peak-teal/10 text-peak-purple"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-peak-purple to-peak-teal flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
        <div className="text-xs text-gray-400 px-2">
          Thai ACC v0.3.0-alpha
        </div>
      </div>
    </aside>
  );
}
