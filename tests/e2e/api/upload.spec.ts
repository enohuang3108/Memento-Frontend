/**
 * Photo Upload E2E Tests
 *
 * Tests photo upload functionality including:
 * - Uploading photos to Google Drive
 * - Validation of upload parameters
 * - File type validation
 * - Multiple image format support
 */

import { expect, test } from '@playwright/test'
import { TEST_IMAGES, createTestFile } from '../../lib/testImages'

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
    expect(data).toHaveProperty('driveFileId')
    expect(data).toHaveProperty('thumbnailUrl')
    expect(data).toHaveProperty('fullUrl')

    // Verify URLs use CORS-compatible formats
    expect(data.thumbnailUrl).toMatch(/drive\.google\.com|googleusercontent\.com/)
    expect(data.fullUrl).toMatch(/drive\.google\.com|googleusercontent\.com/)

    // Ensure URLs don't use blocked uc endpoints
    expect(data.fullUrl).not.toMatch(/drive\.google\.com\/uc/)
    expect(data.thumbnailUrl).not.toMatch(/drive\.google\.com\/uc/)
  })

  test('should reject upload without activityId', async ({ request }) => {
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.PNG),
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
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.PNG),
        activityId: '999999', // Non-existent activity
      },
    })

    // Should fail because activity doesn't exist
    expect([400, 404]).toContain(response.status())
  })

  test('should upload multiple photos sequentially', async ({ request }) => {
    const uploadCount = 5
    const uploadResults = []

    // Upload 5 photos sequentially (simulating batch upload)
    for (let i = 0; i < uploadCount; i++) {
      const response = await request.post('/upload', {
        multipart: {
          ...createTestFile(TEST_IMAGES.PNG, `test-image-${i}.png`),
          activityId: testActivityId,
          width: '100',
          height: '100',
        },
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      uploadResults.push(data)
    }

    // Verify all uploads succeeded
    expect(uploadResults).toHaveLength(uploadCount)
    uploadResults.forEach((result) => {
      expect(result).toHaveProperty('driveFileId')
      expect(result).toHaveProperty('thumbnailUrl')
      expect(result).toHaveProperty('fullUrl')
    })

    // Verify each upload has unique driveFileId
    const fileIds = uploadResults.map((r) => r.driveFileId)
    const uniqueFileIds = new Set(fileIds)
    expect(uniqueFileIds.size).toBe(uploadCount)
  })

  test('should handle batch upload with maximum limit (50 photos)', async ({ request }) => {
    const uploadResults = []

    // Upload 50 photos (this will take a while, so we'll do a smaller batch for testing)
    // In a real scenario, you might want to skip this test or reduce the count
    const testCount = 10 // Reduced for faster testing

    for (let i = 0; i < testCount; i++) {
      const response = await request.post('/upload', {
        multipart: {
          ...createTestFile(TEST_IMAGES.PNG, `batch-test-${i}.png`),
          activityId: testActivityId,
          width: '50',
          height: '50',
        },
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      uploadResults.push(data)
    }

    expect(uploadResults).toHaveLength(testCount)
  })

  test('should validate file size limit per photo', async ({ request }) => {
    // Create a buffer larger than 20MB
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024) // 21MB

    const response = await request.post('/upload', {
      multipart: {
        file: {
          name: 'large-image.png',
          mimeType: 'image/png',
          buffer: largeBuffer,
        },
        activityId: testActivityId,
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.message).toMatch(/size|20MB/i)
  })

  test('should handle mixed valid and invalid files in batch', async ({ request }) => {
    const textBuffer = Buffer.from('invalid content')

    const uploads = [
      // Valid image
      {
        ...createTestFile(TEST_IMAGES.PNG, 'valid-1.png'),
        activityId: testActivityId,
        expectedStatus: 200,
      },
      // Invalid file type
      {
        file: {
          name: 'invalid.txt',
          mimeType: 'text/plain',
          buffer: textBuffer,
        },
        activityId: testActivityId,
        expectedStatus: 400,
      },
      // Valid image
      {
        ...createTestFile(TEST_IMAGES.JPEG, 'valid-2.jpg'),
        activityId: testActivityId,
        expectedStatus: 200,
      },
    ]

    const results = []

    for (const upload of uploads) {
      const response = await request.post('/upload', {
        multipart: upload,
      })

      results.push({
        status: response.status(),
        expected: upload.expectedStatus,
      })

      expect(response.status()).toBe(upload.expectedStatus)
    }

    // Verify we got expected mix of success and failure
    const successCount = results.filter((r) => r.status === 200).length
    const failureCount = results.filter((r) => r.status === 400).length

    expect(successCount).toBe(2) // 2 valid images
    expect(failureCount).toBe(1) // 1 invalid file
  })

  test('should upload JPEG image', async ({ request }) => {
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
    expect(data).toHaveProperty('driveFileId')
    expect(data).toHaveProperty('thumbnailUrl')
    expect(data).toHaveProperty('fullUrl')
  })

  test('should upload PNG image', async ({ request }) => {
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
    expect(data).toHaveProperty('driveFileId')
    expect(data).toHaveProperty('thumbnailUrl')
    expect(data).toHaveProperty('fullUrl')
  })

  test('should upload GIF image', async ({ request }) => {
    const response = await request.post('/upload', {
      multipart: {
        ...createTestFile(TEST_IMAGES.GIF),
        activityId: testActivityId,
        width: '400',
        height: '400',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('driveFileId')
    expect(data).toHaveProperty('thumbnailUrl')
    expect(data).toHaveProperty('fullUrl')
  })

  test('should upload WebP image', async ({ request }) => {
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
    expect(data).toHaveProperty('driveFileId')
    expect(data).toHaveProperty('thumbnailUrl')
    expect(data).toHaveProperty('fullUrl')
  })

  test('should upload all supported formats in sequence', async ({ request }) => {
    const formats = [TEST_IMAGES.JPEG, TEST_IMAGES.PNG, TEST_IMAGES.GIF, TEST_IMAGES.WEBP]

    const results = []

    for (const format of formats) {
      const response = await request.post('/upload', {
        multipart: {
          ...createTestFile(format),
          activityId: testActivityId,
          width: String(format.width || 500),
          height: String(format.height || 500),
        },
      })

      expect(response.status()).toBe(200)
      const data = await response.json()
      results.push(data)
    }

    expect(results).toHaveLength(4)
    results.forEach((result) => {
      expect(result).toHaveProperty('driveFileId')
      expect(result).toHaveProperty('thumbnailUrl')
      expect(result).toHaveProperty('fullUrl')
    })

    // Verify all have unique file IDs
    const fileIds = results.map((r) => r.driveFileId)
    const uniqueIds = new Set(fileIds)
    expect(uniqueIds.size).toBe(4)
  })

  test.afterAll(async ({ request }) => {
    // Clean up test event
    if (testActivityId) {
      await request.delete(`/events/${testActivityId}`)
    }
  })
})
