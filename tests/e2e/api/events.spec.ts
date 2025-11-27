/**
 * Event Management E2E Tests
 *
 * Tests event lifecycle including:
 * - Creating events
 * - Getting event details
 * - Ending events
 * - Health check endpoint
 */

import { test, expect } from '@playwright/test'

const TEST_DRIVE_FOLDER_ID = '1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6'

test.describe('Health Check', () => {
  test('should return 200 OK with timestamp', async ({ request }) => {
    const response = await request.get('/health')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
    expect(typeof data.timestamp).toBe('number')
  })
})

test.describe('Event Management', () => {
  let testActivityId: string

  test('should create new event', async ({ request }) => {
    const response = await request.post('/events', {
      data: {
        title: 'Test Event',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })

    expect(response.status()).toBe(201)

    const data = await response.json()
    expect(data).toHaveProperty('event')
    expect(data.event).toHaveProperty('id')
    expect(data.event.id).toMatch(/^\d{6}$/)
    expect(data.event.status).toBe('active')
    expect(data.event.driveFolderId).toBe(TEST_DRIVE_FOLDER_ID)

    // Store for later tests
    testActivityId = data.event.id
  })

  test('should reject event creation without driveFolderId', async ({ request }) => {
    const response = await request.post('/events', {
      data: {
        title: 'Invalid Event',
      },
    })

    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('should get event details', async ({ request }) => {
    // First create an event
    const createResponse = await request.post('/events', {
      data: {
        title: 'Test Event for Get',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })
    const createData = await createResponse.json()
    const activityId = createData.event.id

    // Now get it
    const response = await request.get(`/events/${activityId}`)
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('event')
    expect(data).toHaveProperty('photos')
    expect(data).toHaveProperty('activeConnections')

    const { event } = data
    expect(event.id).toBe(activityId)
    expect(event.status).toBe('active')
  })

  test('should return 404 for non-existent event', async ({ request }) => {
    const response = await request.get('/events/999999')
    expect(response.status()).toBe(404)
  })

  test('should end event', async ({ request }) => {
    // First create an event
    const createResponse = await request.post('/events', {
      data: {
        title: 'Test Event for End',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })
    const createData = await createResponse.json()
    const activityId = createData.event.id

    // Now end it
    const response = await request.delete(`/events/${activityId}`)
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('success', true)
    expect(data.event.status).toBe('ended')
  })

  test('should handle ended event appropriately', async ({ request }) => {
    // First create and end an event
    const createResponse = await request.post('/events', {
      data: {
        title: 'Test Event for Ended State',
        driveFolderId: TEST_DRIVE_FOLDER_ID,
      },
    })
    const createData = await createResponse.json()
    const activityId = createData.event.id

    await request.delete(`/events/${activityId}`)

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Try to get ended event
    const response = await request.get(`/events/${activityId}`)
    // Ended events might still return data but with status 'ended'
    // or return 404 depending on implementation
    expect([200, 404]).toContain(response.status())
  })
})
