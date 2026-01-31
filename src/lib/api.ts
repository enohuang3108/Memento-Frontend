/**
 * API client for Workers backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787'

export interface Event {
  id: string
  title?: string
  createdAt: number
  expiresAt?: number
  status: 'active' | 'ended'
  driveFolderId?: string
  photoCount: number
  participantCount: number
}

export interface CreateEventRequest {
  title?: string
  driveFolderId: string // Required: Google Drive folder ID for photo storage
}

export interface CreateEventResponse {
  event: Event
  qrCodeUrl: string
}

export interface GetEventResponse {
  event: Event
  photos: Photo[]
  activeConnections: number
}

export interface Photo {
  id: string
  activityId: string
  sessionId: string
  driveFileId: string
  thumbnailUrl: string
  fullUrl: string
  uploadedAt: number
  width?: number
  height?: number
}

export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Create a new event/activity
 */
export async function createEvent(data: CreateEventRequest): Promise<CreateEventResponse> {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || 'Failed to create event')
  }

  return response.json()
}

/**
 * Get event details
 */
export async function getEvent(activityId: string): Promise<GetEventResponse> {
  const response = await fetch(`${API_URL}/events/${activityId}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || 'Failed to get event')
  }

  return response.json()
}

/**
 * End an event
 */
export async function endEvent(activityId: string): Promise<{ success: boolean; event: Event }> {
  const response = await fetch(`${API_URL}/events/${activityId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || 'Failed to end event')
  }

  return response.json()
}

/**
 * Get WebSocket URL for an activity
 */
export function getWebSocketUrl(activityId: string): string {
  return `${WS_URL}/events/${activityId}/ws`
}
