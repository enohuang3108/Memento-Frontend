import { expect, test } from '@playwright/test'
import { TEST_DRIVE_ID } from '../constants'

test.describe('Photo Queue System E2E', () => {
  const ACTIVITY_ID = 'test-queue-activity'

  const createMockPhoto = (id: string, index: number) => ({
    id,
    activityId: ACTIVITY_ID,
    sessionId: 'session-1',
    driveFileId: `file-${id}`,
    thumbnailUrl: `https://placehold.co/400x300?text=Photo+${index}`,
    fullUrl: `https://placehold.co/800x600?text=Photo+${index}`,
    uploadedAt: Date.now() - index * 1000,
    width: 800,
    height: 600,
  })

  const MOCK_EVENT = {
    id: ACTIVITY_ID,
    title: 'Queue Test Event',
    createdAt: Date.now(),
    status: 'active',
    driveFolderId: TEST_DRIVE_ID,
    photoCount: 0,
    participantCount: 1,
  }

  test('should display queue status in debug info', async ({ page }) => {
    const initialPhotos = Array.from({ length: 10 }, (_, i) =>
      createMockPhoto(`initial-${i}`, i)
    )

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: { ...MOCK_EVENT, photoCount: initialPhotos.length },
          photos: initialPhotos,
          activeConnections: 1,
        }),
      })
    })

    await page.goto(`/event/${ACTIVITY_ID}/display`)

    // Check debug info shows queue status
    await expect(page.getByText(/Priority Queue: \d+/)).toBeVisible()
    await expect(page.getByText(/Regular Queue: \d+/)).toBeVisible()
    await expect(page.getByText(/Total Photos: 10/)).toBeVisible()
  })

  test('should shuffle initial photos into regular queue', async ({ page }) => {
    const initialPhotos = Array.from({ length: 5 }, (_, i) =>
      createMockPhoto(`photo-${i}`, i)
    )

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: { ...MOCK_EVENT, photoCount: initialPhotos.length },
          photos: initialPhotos,
          activeConnections: 1,
        }),
      })
    })

    await page.goto(`/event/${ACTIVITY_ID}/display`)

    // Wait for initial load
    await expect(page.getByText(/Total Photos: 5/)).toBeVisible()

    // Check that regular queue has all photos (shuffled)
    await expect(page.getByText(/Regular Queue: 5/)).toBeVisible()

    // Priority queue should be empty initially
    await expect(page.getByText(/Priority Queue: 0/)).toBeVisible()
  })

  test('should handle slideshow progression through queue', async ({ page }) => {
    const photos = Array.from({ length: 3 }, (_, i) =>
      createMockPhoto(`photo-${i}`, i)
    )

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: { ...MOCK_EVENT, photoCount: photos.length },
          photos,
          activeConnections: 1,
        }),
      })
    })

    await page.goto(`/event/${ACTIVITY_ID}/display`)

    // Check initial position
    await expect(page.getByText(/Position: 1\/3/)).toBeVisible()

    // Wait for slideshow to advance (default 5s interval)
    await expect(page.getByText(/Position: 2\/3/)).toBeVisible({ timeout: 10000 })
  })

  test('should display all photos in playback queue', async ({ page }) => {
    const photos = Array.from({ length: 20 }, (_, i) =>
      createMockPhoto(`photo-${i}`, i)
    )

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: { ...MOCK_EVENT, photoCount: photos.length },
          photos,
          activeConnections: 1,
        }),
      })
    })

    await page.goto(`/event/${ACTIVITY_ID}/display`)

    // Check that all photos are in the queue
    await expect(page.getByText(/Total Photos: 20/)).toBeVisible()
    await expect(page.getByText(/Regular Queue: 20/)).toBeVisible()

    // Verify playback queue size matches
    await expect(page.getByText(/Position: 1\/20/)).toBeVisible()
  })

  test('should handle empty photo list gracefully', async ({ page }) => {
    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: MOCK_EVENT,
          photos: [],
          activeConnections: 1,
        }),
      })
    })

    await page.goto(`/event/${ACTIVITY_ID}/display`)

    // Should show empty state
    await expect(page.getByText(/等待照片上傳/)).toBeVisible()
  })

  test('should filter out failed photos from queue', async ({ page }) => {
    const photos = [
      createMockPhoto('valid-1', 0),
      {
        ...createMockPhoto('broken-1', 1),
        fullUrl: 'https://invalid-url-that-will-fail.com/image.jpg',
      },
      createMockPhoto('valid-2', 2),
    ]

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: { ...MOCK_EVENT, photoCount: photos.length },
          photos,
          activeConnections: 1,
        }),
      })
    })

    await page.goto(`/event/${ACTIVITY_ID}/display`)

    // Initial state
    await expect(page.getByText(/Total Photos: 3/)).toBeVisible()

    // Wait for broken image to be detected
    // The broken image will trigger onError when it tries to load
    await expect(page.getByText(/Failed: 1/)).toBeVisible({ timeout: 10000 })

    // Valid photos should be reduced
    await expect(page.getByText(/Valid: 2/)).toBeVisible()
  })
})
