/**
 * Photo URL Format Tests
 *
 * Tests that photo URLs use CORS-compatible formats to avoid OpaqueResponseBlocking errors.
 *
 * Background:
 * - Google Drive's `drive.google.com/uc` URLs are blocked by CORS
 * - `lh3.googleusercontent.com` (thumbnailLink) URLs support CORS
 * - `drive.google.com/thumbnail` API also supports CORS
 */

import { expect, test } from '@playwright/test'
import { TEST_IMAGES, createTestFile } from '../../lib/testImages'

const TEST_DRIVE_FOLDER_ID = '1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6'

test.describe('Photo URL Format Validation', () => {
  let testActivityId: string

  test.beforeAll(async ({ request }) => {
    // Create test event
    const response = await request.post('/events', {
      data: {
        title: 'Test Event for URL Format',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })

    if (response.ok()) {
      const data = await response.json()
      testActivityId = data.event.id
    }
  })

  test('should return CORS-compatible fullUrl (not uc URLs)', async ({ request }) => {
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.PNG),
        activityId: testActivityId,
        width: String(TEST_IMAGES.PNG.width),
        height: String(TEST_IMAGES.PNG.height),
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()

    // fullUrl should NOT use uc URLs (they are blocked by CORS)
    expect(data.fullUrl).not.toMatch(/drive\.google\.com\/uc/)

    // fullUrl should use either:
    // 1. googleusercontent.com (thumbnailLink with =s0)
    // 2. drive.google.com/thumbnail (thumbnail API)
    expect(data.fullUrl).toMatch(/googleusercontent\.com|drive\.google\.com\/thumbnail/)
  })

  test('should return thumbnailUrl with CORS support', async ({ request }) => {
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.JPEG),
        activityId: testActivityId,
        width: String(TEST_IMAGES.JPEG.width),
        height: String(TEST_IMAGES.JPEG.height),
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()

    // thumbnailUrl should use CORS-compatible URLs
    expect(data.thumbnailUrl).toMatch(/googleusercontent\.com|drive\.google\.com\/thumbnail/)
  })

  test('should use =s0 parameter for full-size images', async ({ request }) => {
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.PNG),
        activityId: testActivityId,
        width: String(TEST_IMAGES.PNG.width),
        height: String(TEST_IMAGES.PNG.height),
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()

    // If using googleusercontent.com, should have =s0 for original size
    if (data.fullUrl.includes('googleusercontent.com')) {
      expect(data.fullUrl).toMatch(/=s0/)
    }

    // If using thumbnail API, should have sz=s0 parameter
    if (data.fullUrl.includes('drive.google.com/thumbnail')) {
      expect(data.fullUrl).toMatch(/sz=s0/)
    }
  })

  test('should not use export=view or export=download parameters', async ({ request }) => {
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.WEBP),
        activityId: testActivityId,
        width: String(TEST_IMAGES.WEBP.width),
        height: String(TEST_IMAGES.WEBP.height),
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()

    // Should not use export parameters (they cause CORS issues)
    expect(data.fullUrl).not.toMatch(/export=view/)
    expect(data.fullUrl).not.toMatch(/export=download/)
  })

  test.afterAll(async ({ request }) => {
    // Clean up test event
    if (testActivityId) {
      await request.delete(`/events/${testActivityId}`)
    }
  })
})
