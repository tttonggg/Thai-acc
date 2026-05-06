/**
 * Portal Auth Store
 * Zustand store for customer portal authentication.
 * Uses localStorage key 'portal-auth' for persistence (no NextAuth).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  customerId: string;
  customerName?: string;
}

interface PortalAuthState {
  user: PortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: PortalUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'portal-auth',
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Login function - calls POST /api/portal/auth/login
 * and stores the returned user in Zustand persist store.
 */
export async function portalLogin(
  email: string,
  password: string
): Promise<{ success: boolean; user?: PortalUser; error?: string }> {
  try {
    const response = await fetch('/api/portal/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Portal login error:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
  }
}

/**
 * Logout function - calls POST /api/portal/auth/logout
 * and clears the localStorage store.
 */
export async function portalLogout(): Promise<void> {
  try {
    await fetch('/api/portal/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Portal logout error:', error);
  }
  // Always clear local state regardless of API result
  usePortalAuthStore.getState().logout();
}
