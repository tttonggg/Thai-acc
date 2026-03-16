import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vitest Configuration for Unit Tests
 * Separate config for running unit tests only
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/lib/__tests__/**/*.test.ts',
      'src/components/__tests__/**/*.test.tsx',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '.next',
      'tests/**',
      'e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/**/*.d.ts',
        'src/test/**/*',
        'src/**/__mocks__/**',
        'src/components/ui/**/*',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
    // Standard timeout for unit tests
    testTimeout: 10000,
    // Retry flaky tests
    retry: 2,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
