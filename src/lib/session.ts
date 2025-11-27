/**
 * Session management utilities
 * Handles participant session ID generation and storage
 */

/**
 * Generate a UUID v4
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get or create session ID for an activity
 * Stores in sessionStorage for persistence during browser session
 */
export function getOrCreateSessionId(activityId: string): string {
  const key = `session-${activityId}`

  // Check sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const existing = sessionStorage.getItem(key)
    if (existing) {
      return existing
    }

    // Generate new session ID
    const sessionId = generateSessionId()
    sessionStorage.setItem(key, sessionId)
    return sessionId
  }

  // Fallback: generate new ID each time (no persistence)
  return generateSessionId()
}

/**
 * Clear session for an activity
 */
export function clearSession(activityId: string): void {
  const key = `session-${activityId}`

  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.removeItem(key)
  }
}

/**
 * Store activity code in localStorage for quick access
 */
export function rememberActivity(activityId: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('last-activity', activityId)
  }
}

/**
 * Get last visited activity code
 */
export function getLastActivity(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('last-activity')
  }
  return null
}

/**
 * Clear remembered activity
 */
export function forgetActivity(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('last-activity')
  }
}
