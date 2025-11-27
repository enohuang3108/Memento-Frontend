/**
 * Photo Upload E2E Tests
 *
 * Tests photo upload functionality including:
 * - Uploading photos to Google Drive
 * - Validation of upload parameters
 * - File type validation
 */

import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

const TEST_DRIVE_FOLDER_ID = '1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6'

test.describe('Photo Upload', () => {
  let testActivityId: string

  test.beforeAll(async ({ request }) => {
    // Create test event for upload tests
    const response = await request.post('/events', {
      data: {
        title: 'Test Event for Upload',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })

    if (response.ok()) {
      const data = await response.json()
      testActivityId = data.event.id
    }
  })

  test('should upload photo to Google Drive', async ({ request }) => {
    // Read test image
    const imagePath = join(process.cwd(), 'tests/fixtures/test-image.png')
    const imageBuffer = readFileSync(imagePath)

    // Create multipart form data
    const formData = new FormData()
    formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'test-image.png')
    formData.append('activityId', testActivityId)
    formData.append('width', '1')
    formData.append('height', '1')

    const response = await request.post('/upload', {
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer,
        },
        activityId: testActivityId,
        width: '1',
        height: '1',
      },
    })

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('driveFileId')
    expect(data).toHaveProperty('thumbnailUrl')
    expect(data).toHaveProperty('fullUrl')
    expect(data.width).toBe(1)
    expect(data.height).toBe(1)

    // Verify URLs (Google may use different domains)
    expect(data.thumbnailUrl).toMatch(/drive\.google\.com|googleusercontent\.com/)
    expect(data.fullUrl).toMatch(/drive\.google\.com|googleusercontent\.com/)
  })

  test('should reject upload without activityId', async ({ request }) => {
    // Read test image
    const imagePath = join(process.cwd(), 'tests/fixtures/test-image.png')
    const imageBuffer = readFileSync(imagePath)

    const response = await request.post('/upload', {
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer,
        },
        // Missing activityId
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.message).toContain('activityId')
  })

  test('should reject non-image files', async ({ request }) => {
    const textBuffer = Buffer.from('test content')

    const response = await request.post('/upload', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: textBuffer,
        },
        activityId: testActivityId,
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('should reject upload with invalid activityId', async ({ request }) => {
    // Read test image
    const imagePath = join(process.cwd(), 'tests/fixtures/test-image.png')
    const imageBuffer = readFileSync(imagePath)

    const response = await request.post('/upload', {
      multipart: {
        file: {
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: imageBuffer,
        },
        activityId: '999999', // Non-existent activity
      },
    })

    // Should fail because activity doesn't exist
    expect([400, 404]).toContain(response.status())
  })

  test.afterAll(async ({ request }) => {
    // Clean up test event
    if (testActivityId) {
      await request.delete(`/events/${testActivityId}`)
    }
  })
})
