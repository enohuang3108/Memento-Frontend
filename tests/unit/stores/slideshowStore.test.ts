import { beforeEach, describe, expect, it } from 'vitest'
import { useSlideshowStore } from '../../../src/stores/slideshowStore'
import type { Photo } from '../../../src/lib/api'

const createMockPhoto = (id: string): Photo => ({
  id,
  activityId: 'activity-1',
  sessionId: 'session-1',
  driveFileId: `drive-${id}`,
  thumbnailUrl: `https://example.com/thumb/${id}`,
  fullUrl: `https://example.com/full/${id}`,
  uploadedAt: Date.now(),
})

describe('slideshowStore', () => {
  beforeEach(() => {
    useSlideshowStore.getState().reset()
  })

  describe('initialize', () => {
    it('should set allPhotos and currentPhoto from initial photos', () => {
      const photos = [createMockPhoto('1'), createMockPhoto('2')]
      useSlideshowStore.getState().initialize(photos)

      const state = useSlideshowStore.getState()
      expect(state.allPhotos).toHaveLength(2)
      expect(state.currentPhoto).toEqual(photos[0])
      expect(state.rotationIndex).toBe(0)
      expect(state.pendingQueue).toHaveLength(0)
    })

    it('should handle empty photos array', () => {
      useSlideshowStore.getState().initialize([])

      const state = useSlideshowStore.getState()
      expect(state.allPhotos).toHaveLength(0)
      expect(state.currentPhoto).toBeNull()
    })
  })

  describe('addPhoto', () => {
    it('should add photo to both allPhotos and pendingQueue', () => {
      const photo = createMockPhoto('1')
      useSlideshowStore.getState().addPhoto(photo)

      const state = useSlideshowStore.getState()
      expect(state.allPhotos).toHaveLength(1)
      expect(state.pendingQueue).toHaveLength(1)
      expect(state.allPhotos[0]).toEqual(photo)
      expect(state.pendingQueue[0]).toEqual(photo)
    })

    it('should not add duplicate photos (same driveFileId)', () => {
      const photo = createMockPhoto('1')
      useSlideshowStore.getState().addPhoto(photo)
      useSlideshowStore.getState().addPhoto(photo)

      const state = useSlideshowStore.getState()
      expect(state.allPhotos).toHaveLength(1)
      expect(state.pendingQueue).toHaveLength(1)
    })

    it('should not add photo if already in allPhotos', () => {
      const photos = [createMockPhoto('1')]
      useSlideshowStore.getState().initialize(photos)
      useSlideshowStore.getState().addPhoto(photos[0])

      const state = useSlideshowStore.getState()
      expect(state.allPhotos).toHaveLength(1)
      expect(state.pendingQueue).toHaveLength(0)
    })
  })

  describe('advanceSlideshow', () => {
    it('should play from pendingQueue first (FIFO)', () => {
      const photos = [createMockPhoto('1'), createMockPhoto('2')]
      useSlideshowStore.getState().initialize(photos)

      const newPhoto = createMockPhoto('3')
      useSlideshowStore.getState().addPhoto(newPhoto)

      useSlideshowStore.getState().advanceSlideshow()

      const state = useSlideshowStore.getState()
      expect(state.currentPhoto).toEqual(newPhoto)
      expect(state.pendingQueue).toHaveLength(0)
    })

    it('should rotate through allPhotos when pendingQueue is empty', () => {
      const photos = [createMockPhoto('1'), createMockPhoto('2'), createMockPhoto('3')]
      useSlideshowStore.getState().initialize(photos)

      // Advance to second photo
      useSlideshowStore.getState().advanceSlideshow()
      expect(useSlideshowStore.getState().currentPhoto).toEqual(photos[1])
      expect(useSlideshowStore.getState().rotationIndex).toBe(1)

      // Advance to third photo
      useSlideshowStore.getState().advanceSlideshow()
      expect(useSlideshowStore.getState().currentPhoto).toEqual(photos[2])
      expect(useSlideshowStore.getState().rotationIndex).toBe(2)

      // Wrap around to first photo
      useSlideshowStore.getState().advanceSlideshow()
      expect(useSlideshowStore.getState().currentPhoto).toEqual(photos[0])
      expect(useSlideshowStore.getState().rotationIndex).toBe(0)
    })

    it('should do nothing when no photos exist', () => {
      useSlideshowStore.getState().advanceSlideshow()

      const state = useSlideshowStore.getState()
      expect(state.currentPhoto).toBeNull()
      expect(state.rotationIndex).toBe(0)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const photos = [createMockPhoto('1')]
      useSlideshowStore.getState().initialize(photos)
      useSlideshowStore.getState().addPhoto(createMockPhoto('2'))

      useSlideshowStore.getState().reset()

      const state = useSlideshowStore.getState()
      expect(state.allPhotos).toHaveLength(0)
      expect(state.pendingQueue).toHaveLength(0)
      expect(state.currentPhoto).toBeNull()
      expect(state.rotationIndex).toBe(0)
    })
  })
})
