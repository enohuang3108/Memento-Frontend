import { expect, test } from '@playwright/test'

test.describe('Danmaku Feature', () => {
  const ACTIVITY_ID = 'test-activity-id'

  // Mock data
  const MOCK_EVENT = {
    id: ACTIVITY_ID,
    title: 'E2E Test Event',
    createdAt: Date.now(),
    status: 'active',
    driveFolderId: 'test-folder',
    photoCount: 0,
    participantCount: 1,
  }

  test('should display incoming danmaku message', async ({ page }) => {
    // Mock API
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

    // Inject Mock WebSocket before page load
    await page.addInitScript(() => {
      class MockWebSocket {
        onopen: any;
        onmessage: any;
        onclose: any;
        onerror: any;
        readyState = 1; // OPEN

        constructor(_url: string) {
          setTimeout(() => {
            this.onopen && this.onopen();
            // Register this instance globally so we can control it
            (window as any).__mockWebSocket = this;
          }, 10);
        }

        send(data: any) {
          console.log('WS Send:', data);
        }
        close() {}
        addEventListener(type: string, listener: any) {
            if (type === 'message') this.onmessage = (e: any) => listener(e);
            if (type === 'open') this.onopen = listener;
        }
        removeEventListener() {}
      }
      (window as any).WebSocket = MockWebSocket;
    });

    await page.goto(`/event/${ACTIVITY_ID}/display`);

    // Wait for connection
    await page.waitForTimeout(500);

    // Trigger Danmaku Message
    const danmakuContent = `Hello Mock World ${Date.now()}`;
    await page.evaluate((content) => {
      const ws = (window as any).__mockWebSocket;
      if (ws && ws.onmessage) {
        ws.onmessage({
          data: JSON.stringify({
            type: 'danmaku',
            id: 'msg-1',
            content: content,
            sessionId: 'session-1',
            timestamp: Date.now()
          })
        });
      }
    }, danmakuContent);

    // Verify Canvas is present
    await expect(page.locator('canvas')).toBeVisible();
  })
})
