import { create } from 'zustand'
import type { Photo } from '@/lib/api'

interface SlideshowState {
  allPhotos: Photo[]
  pendingQueue: Photo[]
  currentPhoto: Photo | null
  rotationIndex: number

  initialize: (photos: Photo[]) => void
  addPhoto: (photo: Photo) => void
  advanceSlideshow: () => void
  reset: () => void
}

export const useSlideshowStore = create<SlideshowState>()((set, get) => ({
  allPhotos: [],
  pendingQueue: [],
  currentPhoto: null,
  rotationIndex: 0,

  initialize: (photos) =>
    set({
      allPhotos: photos,
      pendingQueue: [],
      rotationIndex: 0,
      currentPhoto: photos[0] ?? null,
    }),

  addPhoto: (photo) => {
    const state = get()
    if (state.allPhotos.some((p) => p.driveFileId === photo.driveFileId)) return
    if (state.pendingQueue.some((p) => p.driveFileId === photo.driveFileId))
      return
    set({
      allPhotos: [...state.allPhotos, photo],
      pendingQueue: [...state.pendingQueue, photo],
    })
  },

  advanceSlideshow: () => {
    const state = get()
    if (state.pendingQueue.length > 0) {
      const [nextPhoto, ...remaining] = state.pendingQueue
      set({ currentPhoto: nextPhoto, pendingQueue: remaining })
      return
    }
    if (state.allPhotos.length > 0) {
      const nextIndex = (state.rotationIndex + 1) % state.allPhotos.length
      set({ rotationIndex: nextIndex, currentPhoto: state.allPhotos[nextIndex] })
    }
  },

  reset: () =>
    set({ allPhotos: [], pendingQueue: [], currentPhoto: null, rotationIndex: 0 }),
}))
