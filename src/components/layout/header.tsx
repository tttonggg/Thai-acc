'use client';

import { Menu, Bell, User, Search, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ดูเท่านั้น',
};

export function Header({
  sidebarOpen,
  setSidebarOpen,
  userName = 'ผู้ใช้',
  userRole = 'VIEWER',
  onLogout,
}: HeaderProps) {
  const today = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h2 className="text-lg font-semibold text-gray-800">ระบบบัญชีมาตรฐานไทย</h2>
            <p className="text-sm text-gray-500">{today}</p>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="mx-8 hidden max-w-md flex-1 items-center md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="ค้นหา..." className="border-gray-200 bg-gray-50 pl-10" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative h-11 w-11">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8 bg-blue-600">
                    <AvatarFallback className="bg-blue-600 text-sm text-white">
                      {userName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium text-gray-700">{userName}</p>
                    <p className="text-xs text-gray-500">{roleLabels[userRole] || userRole}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userRole === 'ADMIN' && (
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    ตั้งค่าระบบ
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
