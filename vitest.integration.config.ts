import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vitest Configuration for Integration Tests
 * Separate config for running integration tests only
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Use node for integration tests
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '.next',
      'src/lib/__tests__/**',
      'src/components/__tests__/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/**/*.d.ts',
        'src/test/**/*',
        'src/**/__mocks__/**',
        'src/components/ui/**/*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    // Longer timeout for integration tests
    testTimeout: 60000,
    // No retry for integration tests (they should be deterministic)
    retry: 0,
    // Run sequentially to avoid database conflicts
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
