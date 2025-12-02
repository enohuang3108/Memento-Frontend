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

  test('should verify URLs are actually loadable in browser', async ({ page, request }) => {
    // Upload a photo
    const uploadResponse = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.PNG),
        activityId: testActivityId,
        width: String(TEST_IMAGES.PNG.width),
        height: String(TEST_IMAGES.PNG.height),
      },
    })

    expect(uploadResponse.status()).toBe(200)
    const uploadData = await uploadResponse.json()

    // Try to load the fullUrl in an img tag
    await page.setContent(`
      <html>
        <body>
          <img id="test-img" src="${uploadData.fullUrl}" />
          <div id="status">loading</div>
        </body>
      </html>
    `)

    // Add error handler
    await page.evaluate(() => {
      const img = document.getElementById('test-img') as HTMLImageElement
      const status = document.getElementById('status')!

      img.onload = () => {
        status.textContent = 'loaded'
      }

      img.onerror = (e) => {
        status.textContent = 'error'
        console.error('Image load error:', e)
      }
    })

    // Wait for image to load or fail
    await page.waitForFunction(
      () => {
        const status = document.getElementById('status')
        return status?.textContent !== 'loading'
      },
      { timeout: 10000 }
    )

    // Check if image loaded successfully
    const status = await page.locator('#status').textContent()
    expect(status).toBe('loaded')
  })

  test('should verify thumbnailUrl is also loadable', async ({ page, request }) => {
    // Upload a photo
    const uploadResponse = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.JPEG),
        activityId: testActivityId,
        width: String(TEST_IMAGES.JPEG.width),
        height: String(TEST_IMAGES.JPEG.height),
      },
    })

    expect(uploadResponse.status()).toBe(200)
    const uploadData = await uploadResponse.json()

    // Try to load the thumbnailUrl
    await page.setContent(`
      <html>
        <body>
          <img id="test-img" src="${uploadData.thumbnailUrl}" />
          <div id="status">loading</div>
        </body>
      </html>
    `)

    await page.evaluate(() => {
      const img = document.getElementById('test-img') as HTMLImageElement
      const status = document.getElementById('status')!

      img.onload = () => {
        status.textContent = 'loaded'
      }

      img.onerror = () => {
        status.textContent = 'error'
      }
    })

    await page.waitForFunction(
      () => {
        const status = document.getElementById('status')
        return status?.textContent !== 'loading'
      },
      { timeout: 10000 }
    )

    const status = await page.locator('#status').textContent()
    expect(status).toBe('loaded')
  })

  test.afterAll(async ({ request }) => {
    // Clean up test event
    if (testActivityId) {
      await request.delete(`/events/${testActivityId}`)
    }
  })
})
