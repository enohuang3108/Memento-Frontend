/**
 * System OAuth E2E Tests
 *
 * Tests system-level OAuth token management including:
 * - Token status endpoint
 * - Authorization URL generation
 */

import { test, expect } from '@playwright/test'

test.describe('System OAuth', () => {
  test('should return system token status', async ({ request }) => {
    const response = await request.get('/admin/token/status')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('authorized')
    expect(typeof data.authorized).toBe('boolean')

    if (data.authorized) {
      expect(data).toHaveProperty('hasRefreshToken')
      expect(data).toHaveProperty('expiresAt')
      expect(data).toHaveProperty('source')
    }
  })

  test('should provide authorization URL', async ({ request }) => {
    const response = await request.get('/admin/auth/google')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('authUrl')
    expect(data.authUrl).toContain('accounts.google.com')
    expect(data.authUrl).toContain('oauth2')
  })
})
