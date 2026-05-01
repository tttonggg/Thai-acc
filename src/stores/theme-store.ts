'use client';

// ============================================
// 🌸 Keerati ERP Theme Store
// Pastel Theme Customization
// FIXED: Proper theme application and dark mode handling
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeVariant =
  | 'default'
  | 'mint'
  | 'lavender'
  | 'peach'
  | 'sky'
  | 'lemon'
  | 'coral'
  | 'professional';

export interface ThemeState {
  // Theme variant
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;

  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;

  // Sidebar collapsed
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Menu group expansion
  expandedGroups: string[];
  toggleGroup: (group: string) => void;
  setExpandedGroups: (groups: string[]) => void;

  // Accent color intensity
  accentIntensity: 'soft' | 'medium' | 'vibrant';
  setAccentIntensity: (intensity: 'soft' | 'medium' | 'vibrant') => void;

  // Border radius preference
  borderRadius: 'sm' | 'md' | 'lg' | 'xl';
  setBorderRadius: (radius: 'sm' | 'md' | 'lg' | 'xl') => void;

  // Animation enabled
  animationsEnabled: boolean;
  toggleAnimations: () => void;

  // Initialize theme (for SSR/hydration)
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Default theme
      theme: 'default',
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
          // Force a reflow to ensure CSS variables are recalculated
          document.documentElement.style.setProperty('--theme-updated', Date.now().toString());
        }
      },

      // Dark mode
      isDarkMode: false,
      toggleDarkMode: () => {
        const newValue = !get().isDarkMode;
        set({ isDarkMode: newValue });
        if (typeof document !== 'undefined') {
          if (newValue) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          // Force reflow for CSS variable recalculation
          document.documentElement.style.setProperty('--theme-updated', Date.now().toString());
        }
      },
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        if (typeof document !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          // Force reflow for CSS variable recalculation
          document.documentElement.style.setProperty('--theme-updated', Date.now().toString());
        }
      },

      // Sidebar
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      // Menu groups
      expandedGroups: ['sales', 'purchase', 'inventory', 'accounting', 'reports'],
      toggleGroup: (group) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(group)
            ? state.expandedGroups.filter((g) => g !== group)
            : [...state.expandedGroups, group],
        })),
      setExpandedGroups: (groups) => set({ expandedGroups: groups }),

      // Accent intensity
      accentIntensity: 'medium',
      setAccentIntensity: (intensity) => set({ accentIntensity: intensity }),

      // Border radius
      borderRadius: 'lg',
      setBorderRadius: (radius) => {
        set({ borderRadius: radius });
        // Apply to CSS variable
        if (typeof document !== 'undefined') {
          const radiusMap = { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' };
          document.documentElement.style.setProperty('--radius', radiusMap[radius]);
        }
      },

      // Animations
      animationsEnabled: true,
      toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),

      // Initialize theme - call this in useEffect on app mount
      initializeTheme: () => {
        if (typeof document === 'undefined') return;

        const state = get();

        // Apply theme attribute
        document.documentElement.setAttribute('data-theme', state.theme);

        // Apply dark mode class
        if (state.isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Apply border radius
        const radiusMap = { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' };
        document.documentElement.style.setProperty('--radius', radiusMap[state.borderRadius]);

        // Force reflow to ensure all CSS variables are recalculated
        document.documentElement.style.setProperty('--theme-updated', Date.now().toString());
      },
    }),
    {
      name: 'keerati-theme-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydrate from localStorage
        if (state && typeof document !== 'undefined') {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            document.documentElement.setAttribute('data-theme', state.theme);
            if (state.isDarkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            const radiusMap = { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1rem' };
            document.documentElement.style.setProperty('--radius', radiusMap[state.borderRadius]);
          }, 0);
        }
      },
    }
  )
);

// Theme colors for UI display
export const themeColors: Record<
  ThemeVariant,
  { name: string; nameTh: string; color: string; gradient: string }
> = {
  default: {
    name: 'Pink Blossom',
    nameTh: 'ชมพูพาสเทล',
    color: '#ffb6c1',
    gradient: 'linear-gradient(135deg, #ffd1dc, #ffb6c1)',
  },
  mint: {
    name: 'Fresh Mint',
    nameTh: 'มิ้นท์สดชื่น',
    color: '#98ddca',
    gradient: 'linear-gradient(135deg, #b5eadd, #98ddca)',
  },
  lavender: {
    name: 'Lavender Dream',
    nameTh: 'ลาเวนเดอร์',
    color: '#dcd0ff',
    gradient: 'linear-gradient(135deg, #e6e6fa, #dcd0ff)',
  },
  peach: {
    name: 'Sweet Peach',
    nameTh: 'พีชหวาน',
    color: '#ffdab9',
    gradient: 'linear-gradient(135deg, #ffe4d6, #ffdab9)',
  },
  sky: {
    name: 'Sky Blue',
    nameTh: 'ฟ้าสดใส',
    color: '#87ceeb',
    gradient: 'linear-gradient(135deg, #b5eaff, #87ceeb)',
  },
  lemon: {
    name: 'Lemon Zest',
    nameTh: 'เลมอนสด',
    color: '#fff68f',
    gradient: 'linear-gradient(135deg, #fffacd, #fff68f)',
  },
  coral: {
    name: 'Coral Reef',
    nameTh: 'คอรัลพีช',
    color: '#ff9e8d',
    gradient: 'linear-gradient(135deg, #ffb6b0, #ff9e8d)',
  },
  professional: {
    name: 'Professional Amber',
    nameTh: 'อาชีพแอมเบอร์',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
  },
};
