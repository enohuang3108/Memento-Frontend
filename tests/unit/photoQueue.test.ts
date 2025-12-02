import { describe, expect, it } from 'vitest';

/**
 * Fisher-Yates shuffle algorithm for testing
 * This is a copy of the implementation in PhotoWall.tsx
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

describe('Photo Queue System', () => {
  describe('Fisher-Yates Shuffle', () => {
    it('should return an array of the same length', () => {
      const input = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(input)
      expect(shuffled).toHaveLength(input.length)
    })

    it('should contain all original elements', () => {
      const input = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(input)

      // Check that all elements are present
      for (const item of input) {
        expect(shuffled).toContain(item)
      }
    })

    it('should not modify the original array', () => {
      const input = [1, 2, 3, 4, 5]
      const original = [...input]
      shuffleArray(input)

      expect(input).toEqual(original)
    })

    it('should handle empty array', () => {
      const input: number[] = []
      const shuffled = shuffleArray(input)
      expect(shuffled).toEqual([])
    })

    it('should handle single element array', () => {
      const input = [42]
      const shuffled = shuffleArray(input)
      expect(shuffled).toEqual([42])
    })

    it('should produce different orderings (probabilistic test)', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const results = new Set<string>()

      // Run shuffle 100 times
      for (let i = 0; i < 100; i++) {
        const shuffled = shuffleArray(input)
        results.add(JSON.stringify(shuffled))
      }

      // With 10 elements, we should get many different orderings
      // (10! = 3,628,800 possible permutations)
      // Getting at least 50 unique orderings in 100 tries is very likely
      expect(results.size).toBeGreaterThan(50)
    })

    it('should distribute elements fairly (statistical test)', () => {
      const input = [1, 2, 3, 4, 5]
      const positionCounts: Record<number, number[]> = {
        1: [0, 0, 0, 0, 0],
        2: [0, 0, 0, 0, 0],
        3: [0, 0, 0, 0, 0],
        4: [0, 0, 0, 0, 0],
        5: [0, 0, 0, 0, 0],
      }

      const iterations = 1000

      // Run shuffle many times and count positions
      for (let i = 0; i < iterations; i++) {
        const shuffled = shuffleArray(input)
        shuffled.forEach((value, position) => {
          positionCounts[value][position]++
        })
      }

      // Each element should appear in each position roughly equally
      // Expected: ~200 times per position (1000 / 5 = 200)
      // Allow 30% deviation (140-260)
      const expectedCount = iterations / input.length
      const tolerance = expectedCount * 0.3

      for (const value of input) {
        for (let position = 0; position < input.length; position++) {
          const count = positionCounts[value][position]
          expect(count).toBeGreaterThan(expectedCount - tolerance)
          expect(count).toBeLessThan(expectedCount + tolerance)
        }
      }
    })
  })

  describe('Queue Management Logic', () => {
    interface Photo {
      id: string
      uploadedAt: number
    }

    it('should prioritize new photos over regular queue', () => {
      const priorityQueue: Photo[] = [
        { id: 'new-1', uploadedAt: Date.now() },
        { id: 'new-2', uploadedAt: Date.now() - 1000 }
      ]
      const regularQueue: Photo[] = [
        { id: 'old-1', uploadedAt: Date.now() - 10000 },
        { id: 'old-2', uploadedAt: Date.now() - 20000 }
      ]

      // Simulate playback queue (priority first, then regular)
      const playbackQueue = [...priorityQueue, ...regularQueue]

      expect(playbackQueue[0].id).toBe('new-1')
      expect(playbackQueue[1].id).toBe('new-2')
      expect(playbackQueue[2].id).toBe('old-1')
      expect(playbackQueue[3].id).toBe('old-2')
    })

    it('should track played photos correctly', () => {
      const playedPhotoIds = new Set<string>()
      const photos: Photo[] = [
        { id: 'photo-1', uploadedAt: Date.now() },
        { id: 'photo-2', uploadedAt: Date.now() - 1000 },
        { id: 'photo-3', uploadedAt: Date.now() - 2000 }
      ]

      // Simulate playing photos
      playedPhotoIds.add(photos[0].id)
      playedPhotoIds.add(photos[1].id)

      // Check which photos are new
      const newPhotos = photos.filter(p => !playedPhotoIds.has(p.id))

      expect(newPhotos).toHaveLength(1)
      expect(newPhotos[0].id).toBe('photo-3')
    })

    it('should detect new photos correctly', () => {
      const existingPhotos: Photo[] = [
        { id: 'photo-1', uploadedAt: Date.now() - 10000 },
        { id: 'photo-2', uploadedAt: Date.now() - 20000 }
      ]
      const playedPhotoIds = new Set(['photo-1', 'photo-2'])

      // Simulate new photos arriving
      const allPhotos: Photo[] = [
        ...existingPhotos,
        { id: 'photo-3', uploadedAt: Date.now() },
        { id: 'photo-4', uploadedAt: Date.now() - 1000 }
      ]

      const newPhotos = allPhotos.filter(p => !playedPhotoIds.has(p.id))

      expect(newPhotos).toHaveLength(2)
      expect(newPhotos.map(p => p.id)).toEqual(['photo-3', 'photo-4'])
    })
  })
})
