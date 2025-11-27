/**
 * CORS Headers E2E Tests
 *
 * Tests Cross-Origin Resource Sharing (CORS) configuration including:
 * - CORS headers in responses
 * - OPTIONS preflight requests
 */

import { test, expect } from '@playwright/test'

test.describe('CORS Headers', () => {
  test('should include CORS headers in responses', async ({ request }) => {
    const response = await request.get('/health', {
      headers: {
        'Origin': 'http://localhost:3000',
      },
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['access-control-allow-origin']).toBeTruthy()
    expect(response.headers()['access-control-allow-methods']).toBeTruthy()
  })

  test('should handle OPTIONS preflight requests', async ({ request }) => {
    const response = await request.fetch('/events', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['access-control-allow-origin']).toBeTruthy()
    expect(response.headers()['access-control-allow-methods']).toContain('POST')
  })

  test('should allow all common HTTP methods', async ({ request }) => {
    const response = await request.fetch('/events', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    })

    expect(response.status()).toBe(200)
    const allowedMethods = response.headers()['access-control-allow-methods']
    expect(allowedMethods).toContain('GET')
    expect(allowedMethods).toContain('POST')
    expect(allowedMethods).toContain('DELETE')
  })
})
