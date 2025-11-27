import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Configuration for Snap Wall
 *
 * This configuration supports both UI and API E2E tests.
 * - API tests run against Cloudflare Workers at localhost:8787
 * - UI tests run against frontend at localhost:3000
 *
 * Run API tests: pnpm test:e2e:api
 * Run UI tests: pnpm test:e2e:ui
 * Run all E2E tests: pnpm test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions with Durable Objects
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // API Tests - Run against Cloudflare Workers
    {
      name: 'api-tests',
      testMatch: /api\/.*\.spec\.ts/,
      timeout: 60000, // 60 seconds for API tests with file uploads
      use: {
        baseURL: process.env.VITE_API_URL || 'http://localhost:8787',
      },
    },
    // UI Tests - Run against frontend in browser
    {
      name: 'ui-chromium',
      testMatch: /ui\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'ui-mobile',
      testMatch: /ui\/.*\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
        baseURL: 'http://localhost:3000',
      },
    },
  ],

  // Start worker if not running (for API tests)
  webServer: process.env.TEST_TYPE === 'api' || process.env.TEST_TYPE === undefined
    ? {
        command: 'pnpm wrangler dev',
        url: 'http://localhost:8787/health',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes for worker startup
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
})
