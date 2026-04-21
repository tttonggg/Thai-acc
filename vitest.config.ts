import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '.next', 'e2e', 'backups', 'tests/examples', 'tests/unit', 'tests/api', 'tests/cheque-clearing.test.ts', 'tests/contracts', 'tests/db'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
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
    // Test timeout for integration tests
    testTimeout: 30000,
    // Retry flaky tests
    retry: 2,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
