import { useEffect } from 'react'
import { useSlideshowStore } from '@/stores/slideshowStore'

export function useSlideshowTimer(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => {
      const state = useSlideshowStore.getState()
      if (state.allPhotos.length > 0 || state.pendingQueue.length > 0) {
        state.advanceSlideshow()
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [enabled])
}
