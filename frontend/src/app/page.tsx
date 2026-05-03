"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HomePage from "./home/page";

export default function RootPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/income");
    } else {
      setIsLoggedIn(false);
    }
  }, [router]);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HomePage />;
}
