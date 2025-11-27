import viteTsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteTsConfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    // Include unit and integration tests
    include: ['tests/workers/**/*.test.ts', 'tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    // Increase timeout for integration tests
    testTimeout: 60000, // 60 seconds
    hookTimeout: 60000, // 60 seconds for beforeAll/afterAll
    // Run workers tests sequentially to avoid race conditions
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
    },
  },
})
