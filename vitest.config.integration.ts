import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run integration tests sequentially (not in parallel)
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 60000, // 60 seconds for integration tests
    hookTimeout: 60000,
  },
})
