import { expect, test } from '@playwright/test'

test.describe('Danmaku Feature', () => {
  let activityId: string

  test.beforeAll(async () => {
    // Create an event via API using native fetch to avoid Playwright context issues
    const response = await fetch('http://127.0.0.1:8787/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Event',
        driveFolderId: 'test-folder-id-123456789012345',
      }),
    })

    expect(response.ok).toBeTruthy()
    const data = await response.json() as any
    activityId = data.event.id
  })

  test('should send and display danmaku message', async ({ browser }) => {
    // Create two contexts: one for participant, one for display
    const participantContext = await browser.newContext()
    const displayContext = await browser.newContext()

    const participantPage = await participantContext.newPage()
    const displayPage = await displayContext.newPage()

    // Debug: Log console messages from browser
    participantPage.on('console', msg => console.log(`[Participant Console] ${msg.text()}`))
    displayPage.on('console', msg => console.log(`[Display Console] ${msg.text()}`))

    console.log('Activity ID:', activityId)

    // 0. Check Connectivity
    console.log('Checking API connectivity...')
    try {
      await participantPage.goto('http://localhost:8787/health', { timeout: 5000 })
      const text = await participantPage.textContent('body')
      console.log('API localhost health:', text)
    } catch (e) {
      console.error('API localhost health failed:', e)
    }

    try {
      await participantPage.goto('http://127.0.0.1:8787/health', { timeout: 5000 })
      const text = await participantPage.textContent('body')
      console.log('API 127.0.0.1 health:', text)
    } catch (e) {
      console.error('API 127.0.0.1 health failed:', e)
    }

    // 1. Open Display Page
    console.log('Navigating to display page...')
    await displayPage.goto(`/event/${activityId}/display`, { timeout: 10000 })
    await expect(displayPage.getByText('E2E Test Event')).toBeVisible()

    // 2. Open Participant Page
    console.log('Navigating to participant page...')
    await participantPage.goto(`/event/${activityId}`, { timeout: 10000, waitUntil: 'domcontentloaded' })
    await expect(participantPage.getByText('E2E Test Event')).toBeVisible()

    // 3. Send Danmaku
    const message = `Hello E2E ${Date.now()}`
    const input = participantPage.getByPlaceholder('發送彈幕...')
    await input.fill(message)
    await participantPage.getByRole('button', { name: '發送' }).click()

    // 4. Verify message appears on Display Page
    // Danmaku is rendered on canvas, so we can't select it by text easily in DOM
    // But we can check if the canvas exists and maybe check logs if we had them exposed
    // Or we can check if the input cleared, indicating success
    await expect(input).toBeEmpty()

    // For canvas verification, it's hard.
    // However, we can check if the WebSocket received the message if we intercept network
    // Or we can check if the "DanmakuCanvas" component is mounted.
    await expect(displayPage.locator('canvas')).toBeVisible()

    // Wait a bit for animation
    await displayPage.waitForTimeout(1000)

    // Optional: Snapshot testing for canvas (might be flaky)
    // await expect(displayPage).toHaveScreenshot()
  })
})
