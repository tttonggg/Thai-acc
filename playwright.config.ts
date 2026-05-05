import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration (Headless-Optimized)
 *
 * Focus:
 * - Headless browser execution (faster, CI-friendly)
 * - Code quality and API testing
 * - Database query validation
 * - Performance monitoring
 * - Minimal UI overhead
 *
 * Features:
 * - Headless execution by default
 * - Screenshot capture on failure
 * - Video recording for failed tests
 * - Trace capture on first retry
 * - Detailed HTML reports
 * - Automatic dev server startup
 * - Rate limiting bypass for tests
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Test timeout (60 seconds per test)
  timeout: 60 * 1000,

  // Expect timeout
  expect: {
    timeout: 10 * 1000,
  },

  // Run tests in parallel (faster execution)
  fullyParallel: true,

  // Fail on test.only in CI
  forbidOnly: !!process.env.CI,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Worker configuration (limit to 1 in CI for stability)
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
        host: 'localhost',
        port: 9323,
      },
    ],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Test configuration
  use: {
    // Base URL for tests
    baseURL: 'https://acc.k56mm.uk',

    // Trace configuration (capture on first retry)
    trace: 'on-first-retry',

    // Screenshot configuration (only on failure)
    screenshot: 'only-on-failure',

    // Video configuration (only on failure)
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Collect trace on failure
    // Headless mode: enabled by default for faster CI/CD execution
    // Set HEADED=true environment variable to disable headless mode for debugging
    launchOptions: {
      headless: process.env.HEADED !== 'true',
      slowMo: process.env.SLOW_MO ? Number(process.env.SLOW_MO) : 0,
    },

    // Extra HTTP headers (bypass rate limiting)
    extraHTTPHeaders: {
      'x-playwright-test': 'true',
    },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Locale settings
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
  },

  // Test projects
  projects: [
    // Primary CI/CD project - Chromium only, headless-optimized
    {
      name: 'ci-headless',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          headless: true, // Always headless for CI
        },
      },
    },

    // Desktop browsers (for local development with HEADED=true)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
        },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Microsoft Edge
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
        channel: 'msedge',
      },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'iPhone SE',
      use: {
        ...devices['iPhone SE'],
      },
    },
    {
      name: 'Galaxy S8',
      use: {
        ...devices['Galaxy S8'],
      },
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad (gen 6)'],
      },
    },
    {
      name: 'iPad Pro',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
  ],

  // Dev server configuration (used by webServer in CI)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Metadata
  metadata: {
    project: 'Thai Accounting ERP',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});
