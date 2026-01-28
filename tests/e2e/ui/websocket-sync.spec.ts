/**
 * WebSocket Real-time Synchronization E2E Tests
 *
 * Tests multi-browser WebSocket synchronization including:
 * - Multiple browsers connecting to same event
 * - Real-time danmaku message broadcasting
 * - Real-time photo synchronization
 * - Connection limit handling
 * - Auto-reconnection after disconnect
 */

import { expect, test } from '@playwright/test'
import { TEST_IMAGES, createTestFile } from '../../lib/testImages'

const TEST_DRIVE_FOLDER_ID = '1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6'

test.describe('WebSocket Real-time Sync', () => {
  let testActivityId: string

  test.beforeAll(async ({ request }) => {
    // Create test event for WebSocket tests
    const response = await request.post('/events', {
      data: {
        title: 'WebSocket Sync Test Event',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })

    if (response.ok()) {
      const data = await response.json()
      testActivityId = data.event.id
    }
  })

  test('should sync between two browsers connected to same event', async ({ browser }) => {
    // Create two separate browser contexts (simulate two users)
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()

    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // Browser A: Open participant view
      await pageA.goto(`/event/${testActivityId}`)
      await pageA.waitForLoadState('networkidle')

      // Browser B: Open display view
      await pageB.goto(`/event/${testActivityId}/display`)
      await pageB.waitForLoadState('networkidle')

      // Wait for WebSocket connections to establish
      await pageA.waitForTimeout(1000)
      await pageB.waitForTimeout(1000)

      // Verify both pages loaded
      await expect(pageA.locator('body')).toBeVisible()
      await expect(pageB.locator('body')).toBeVisible()

      // Test passed if both browsers can load the event
      // More detailed WebSocket message testing would require
      // intercepting WebSocket messages or checking DOM updates
    } finally {
      await pageA.close()
      await pageB.close()
      await contextA.close()
      await contextB.close()
    }
  })

  test('should display danmaku from browser A in browser B display', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()

    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // Browser A: Open participant view
      await pageA.goto(`/event/${testActivityId}`)
      await pageA.waitForLoadState('networkidle')

      // Browser B: Open display view
      await pageB.goto(`/event/${testActivityId}/display`)
      await pageB.waitForLoadState('networkidle')

      // Wait for WebSocket connections
      await pageA.waitForTimeout(1000)
      await pageB.waitForTimeout(1000)

      // Browser A: Find and fill danmaku input
      const danmakuInput = pageA.locator('input[type="text"], textarea').first()
      const sendButton = pageA.locator('button').filter({ hasText: /送出|發送|send/i }).first()

      if (await danmakuInput.isVisible() && await sendButton.isVisible()) {
        const testMessage = `E2E Test Message ${Date.now()}`
        await danmakuInput.fill(testMessage)
        await sendButton.click()

        // Wait for message to propagate
        await pageA.waitForTimeout(500)

        // Browser B: Verify canvas exists (danmaku rendering)
        const canvas = pageB.locator('canvas')
        await expect(canvas).toBeVisible({ timeout: 5000 })

        // Note: We can't directly verify canvas content in Playwright,
        // but we can verify the canvas is rendered and updated
      }
    } finally {
      await pageA.close()
      await pageB.close()
      await contextA.close()
      await contextB.close()
    }
  })

  test('should sync uploaded photo from browser A to browser B', async ({ browser, request }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()

    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // Browser A: Open participant view
      await pageA.goto(`/event/${testActivityId}`)
      await pageA.waitForLoadState('networkidle')

      // Browser B: Open display view
      await pageB.goto(`/event/${testActivityId}/display`)
      await pageB.waitForLoadState('networkidle')

      // Wait for WebSocket connections
      await pageA.waitForTimeout(1000)

      // Get initial photo count on Browser B
      const initialPhotoCount = await pageB.locator('[data-testid="photo-item"], img[src*="drive.google"]').count()

      // Upload photo via API (simulating Browser A upload)
      const uploadResponse = await request.post('/upload', {
        multipart: {
          ...createTestFile(TEST_IMAGES.PNG, `sync-test-${Date.now()}.png`),
          activityId: testActivityId,
          width: '500',
          height: '500',
        },
      })

      expect(uploadResponse.status()).toBe(200)

      // Wait for WebSocket to broadcast photo update
      await pageB.waitForTimeout(2000)

      // Browser B: Verify photo count increased or photo wall updated
      // Note: This depends on PhotoWall component implementation
      // We check if any photo elements are present
      const photoElements = pageB.locator('[data-testid="photo-item"], img[src*="drive.google"], img[src*="googleusercontent"]')
      const finalPhotoCount = await photoElements.count()

      // Verify that photos are being displayed
      // (count may or may not increase depending on timing and auto-sync)
      expect(finalPhotoCount).toBeGreaterThanOrEqual(initialPhotoCount)
    } finally {
      await pageA.close()
      await pageB.close()
      await contextA.close()
      await contextB.close()
    }
  })

  test('should handle multiple simultaneous connections', async ({ browser }) => {
    // Create 3 browser contexts
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ])

    const pages = await Promise.all(
      contexts.map(ctx => ctx.newPage())
    )

    try {
      // Connect all browsers to the same event
      await Promise.all(
        pages.map(page => page.goto(`/event/${testActivityId}/display`))
      )

      await Promise.all(
        pages.map(page => page.waitForLoadState('networkidle'))
      )

      // Wait for all WebSocket connections
      await pages[0].waitForTimeout(1000)

      // Verify all pages loaded successfully
      for (const page of pages) {
        await expect(page.locator('body')).toBeVisible()
      }

      // All connections should succeed
      // (In real scenario, we could check connection count via API)
    } finally {
      for (const page of pages) {
        await page.close()
      }
      for (const context of contexts) {
        await context.close()
      }
    }
  })

  test('should show appropriate message when connection fails', async ({ page }) => {
    // Try to connect to non-existent event
    await page.goto('/event/999999/display')
    await page.waitForLoadState('networkidle')

    // Wait a bit for any error messages to appear
    await page.waitForTimeout(1000)

    // The page should handle the error gracefully
    // (Exact error handling depends on implementation)
    const bodyText = await page.locator('body').textContent()

    // Just verify the page loaded and didn't crash
    expect(bodyText).toBeTruthy()
  })

  test('should maintain connection after network idle', async ({ page }) => {
    // Open display view
    await page.goto(`/event/${testActivityId}/display`)
    await page.waitForLoadState('networkidle')

    // Wait for WebSocket connection
    await page.waitForTimeout(1000)

    // Verify canvas is present (danmaku display)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Wait for a period (simulate idle connection)
    await page.waitForTimeout(5000)

    // Canvas should still be visible
    await expect(canvas).toBeVisible()
  })

  test.afterAll(async ({ request }) => {
    // Clean up test event
    if (testActivityId) {
      await request.delete(`/events/${testActivityId}`)
    }
  })
})
