import { expect, test } from '@playwright/test';
import { TEST_DRIVE_ID } from '../constants';

test.describe('Display Page', () => {
  const ACTIVITY_ID = 'test-activity-id';

  // Mock data
  const MOCK_EVENT = {
    id: ACTIVITY_ID,
    title: 'Test Event',
    createdAt: Date.now(),
    status: 'active',
    driveFolderId: TEST_DRIVE_ID,
    photoCount: 5,
    participantCount: 2,
  };

  const MOCK_PHOTOS = Array.from({ length: 5 }).map((_, i) => ({
    id: `photo-${i}`,
    activityId: ACTIVITY_ID,
    sessionId: 'session-1',
    driveFileId: `file-${i}`,
    thumbnailUrl: `https://placehold.co/400x300?text=Photo+${i}`,
    fullUrl: `https://placehold.co/800x600?text=Photo+${i}`,
    uploadedAt: Date.now() - i * 1000, // Staggered times
    width: 800,
    height: 600,
  }));

  test.beforeEach(async ({ page }) => {
    // Mock the API response for getting the event
    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: MOCK_EVENT,
          photos: MOCK_PHOTOS,
          activeConnections: 2,
        }),
      });
    });

    // Mock WebSocket connection (prevent connection errors)
    // We can't easily mock WS in Playwright yet, but we can ensure the page doesn't crash
    // The frontend will try to connect to ws://localhost:8787... which might fail if backend isn't running
    // but that shouldn't break the UI test if we are testing initial load.
  });

  test('should load display page and show photos', async ({ page }) => {
    await page.goto(`/event/${ACTIVITY_ID}/display`);

    // Check if photos are rendered
    // In slideshow mode (default), we expect to see images
    const images = page.locator('img');
    await expect(images.first()).toBeVisible();

    // Check if debug info is present (since we are not in fullscreen)
    await expect(page.getByText(/Total: 5/)).toBeVisible();
    await expect(page.getByText(/Valid: 5/)).toBeVisible();
  });

  test('should auto-advance slideshow', async ({ page }) => {
    await page.goto(`/event/${ACTIVITY_ID}/display`);

    // Get the source of the first image
    const firstImage = page.locator('img').first();
    await expect(firstImage).toBeVisible();

    // Wait for slideshow interval (default 5000ms)
    // We can speed this up by mocking the timer or just waiting
    // For stability, let's just wait a bit more than 5s or check if a new image appears
    // Better: Check if the "Debug: 1/5" text changes to "Debug: 2/5"

    await expect(page.getByText('Debug: 1/5')).toBeVisible();

    // Fast-forward time is hard in E2E. We'll just wait.
    // To make test faster, we could override the interval prop if we could,
    // but we can't easily pass props to the page component in E2E.
    // We will wait for the text update.
    await expect(page.getByText('Debug: 2/5')).toBeVisible({ timeout: 10000 });
  });

  test('should handle broken images gracefully', async ({ page }) => {
    // Override the route for this specific test to include a broken image
    const photosWithBroken = [
      ...MOCK_PHOTOS.slice(0, 1),
      {
        ...MOCK_PHOTOS[1],
        id: 'broken-photo',
        fullUrl: 'https://invalid-url-that-fails.com/image.jpg',
      },
      ...MOCK_PHOTOS.slice(2),
    ];

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: MOCK_EVENT,
          photos: photosWithBroken,
          activeConnections: 2,
        }),
      });
    });

    await page.goto(`/event/${ACTIVITY_ID}/display`);

    // Initial state: 5 total
    await expect(page.getByText('Total: 5')).toBeVisible();

    // Wait for the broken image to be processed (it might be preloaded or loaded when shown)
    // Since we prefetch, it might be detected early or when it tries to render.
    // The current logic filters `validPhotos` based on `failedPhotoIds`.
    // `failedPhotoIds` is updated by `onError` of the `img` tag.
    // So the image must be *attempted* to render for `onError` to fire.

    // We might need to wait for the slideshow to reach the broken image (index 1)
    // Or, since we prefetch, maybe prefetch triggers it?
    // No, `new Image().src = ...` prefetch doesn't trigger the React component's onError.
    // Only the rendered `<img>` tag triggers the component's onError.

    // So we need to wait for the slideshow to advance to the broken image.
    // Index 0: Valid
    // Index 1: Broken -> onError -> removed from validPhotos -> Index 1 becomes the *next* valid photo?

    // Actually, if it fails, it's added to `failedPhotoIds`.
    // `validPhotos` is re-calculated.
    // `sortedPhotos` is re-calculated.
    // The slideshow continues with the new list.

    // We expect "Failed: 1" to appear eventually.
    // Since it's index 1, it will be rendered after 5 seconds.
    // This makes the test slow.

    // Optimization: We can make the broken image the *first* one (index 0).
    const photosWithBrokenFirst = [
      {
        ...MOCK_PHOTOS[0],
        id: 'broken-photo-first',
        fullUrl: 'https://invalid-url-that-fails.com/image.jpg',
      },
      ...MOCK_PHOTOS.slice(1),
    ];

    await page.route(`**/events/${ACTIVITY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: MOCK_EVENT,
          photos: photosWithBrokenFirst,
          activeConnections: 2,
        }),
      });
    });

    await page.reload();

    // The first image attempts to load, fails, triggers onError.
    // "Failed: 1" should appear quickly.
    await expect(page.getByText('Failed: 1')).toBeVisible({ timeout: 5000 });

    // And "Valid: 4"
    await expect(page.getByText('Valid: 4')).toBeVisible();
  });
});
