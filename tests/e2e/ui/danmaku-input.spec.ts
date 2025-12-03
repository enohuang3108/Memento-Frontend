import { expect, test } from '@playwright/test'

test.describe('Danmaku Input Feature', () => {
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

  test.beforeEach(async ({ page }) => {
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

    // Inject Mock WebSocket
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
            (window as any).__mockWebSocket = this;
          }, 10);
        }

        send(data: any) {
          // Store sent messages for verification
          if (!(window as any).__sentMessages) {
            (window as any).__sentMessages = [];
          }
          (window as any).__sentMessages.push(JSON.parse(data));
        }
        close() {}
        addEventListener() {}
        removeEventListener() {}
      }
      (window as any).WebSocket = MockWebSocket;
    });

    await page.goto(`/event/${ACTIVITY_ID}`);
    await page.waitForTimeout(2000); // Wait for connection
  })

  test('should display emoji buttons', async ({ page }) => {
    const emojis = ['👍', '❤️', '😂', '😮', '🎉']
    for (const emoji of emojis) {
      await expect(page.getByRole('button', { name: emoji })).toBeVisible()
    }
  })

  test('should send emoji immediately on click', async ({ page }) => {
    await page.getByRole('button', { name: '👍' }).click()

    // Verify message sent
    const messages = await page.evaluate(() => (window as any).__sentMessages)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      type: 'danmaku',
      content: '👍'
    })
  })

  test('should allow long messages', async ({ page }) => {
    const input = page.getByPlaceholder('發送彈幕...')

    // Verify maxLength is removed
    await expect(input).not.toHaveAttribute('maxLength')

    const longMessage = 'a'.repeat(60)
    await input.fill(longMessage)

    // Verify value
    await expect(input).toHaveValue(longMessage)

    await page.getByRole('button', { name: '發送' }).click()

    const messages = await page.evaluate(() => (window as any).__sentMessages)
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe(longMessage)
  })

  test('should allow sending multiple messages quickly', async ({ page }) => {
    await page.getByRole('button', { name: '❤️' }).click()
    await page.getByRole('button', { name: '😂' }).click()
    await page.getByRole('button', { name: '🎉' }).click()

    const messages = await page.evaluate(() => (window as any).__sentMessages)
    expect(messages).toHaveLength(3)
    expect(messages[0].content).toBe('❤️')
    expect(messages[1].content).toBe('😂')
    expect(messages[2].content).toBe('🎉')
  })
})
