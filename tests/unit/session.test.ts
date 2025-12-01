import { describe, expect, it } from 'vitest'
import { generateSessionId } from '../../src/lib/session'

describe('Session Utilities', () => {
  describe('generateSessionId', () => {
    it('should return a string', () => {
      const id = generateSessionId()
      expect(typeof id).toBe('string')
    })

    it('should return a valid UUID format', () => {
      const id = generateSessionId()
      // UUID v4 regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(id).toMatch(uuidRegex)
    })

    it('should generate unique IDs', () => {
      const id1 = generateSessionId()
      const id2 = generateSessionId()
      expect(id1).not.toBe(id2)
    })
  })
})
