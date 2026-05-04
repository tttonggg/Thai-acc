"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user_data");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await import("@/lib/api").then(({ authApi }) => authApi.logout());
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "/login";
  };

  return { user, isLoading, isAuthenticated: !!user, login, logout };
}
