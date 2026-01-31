/**
 * PhotoWall Component
 * Displays photos in a masonry/grid layout or a slideshow
 *
 * Slideshow mode: Backend-controlled playback via WebSocket
 * Grid mode: Client-side rendering of all photos
 */

import { useEffect, useRef, useState } from 'react'
import type { Photo } from '../lib/api'

interface PhotoWallProps {
  isFullscreen: boolean
  mode?: 'grid' | 'slideshow'
  // Grid mode: all photos to display
  photos?: Photo[]
  // Slideshow mode: current photo (from priority queue or rotation)
  currentPhoto?: Photo | null
  // Slideshow mode: playlist info
  playlistInfo?: {
    index: number
    total: number
    queueLength?: number
    isQueueMode?: boolean
  }
  showDebugInfo?: boolean
}

export function PhotoWall({
  isFullscreen,
  mode = 'grid',
  photos = [],
  currentPhoto = null,
  playlistInfo,
  showDebugInfo = true,
}: PhotoWallProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedPhotoIds, setFailedPhotoIds] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  // For slideshow cross-fade transition (two-layer toggle approach)
  const [layers, setLayers] = useState<[Photo | null, Photo | null]>([null, null])
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)

  // Filter out failed photos for grid mode
  const validPhotos = photos.filter((p) => !failedPhotoIds.has(p.id))

  // Track pending photo to avoid race conditions
  const pendingPhotoRef = useRef<string | null>(null)

  // Handle slideshow photo transition using two-layer toggle
  useEffect(() => {
    if (mode !== 'slideshow' || !currentPhoto) return

    // Check if already displaying this photo
    if (layers[0]?.id === currentPhoto.id || layers[1]?.id === currentPhoto.id) {
      return
    }

    // Check if already loading this photo
    if (pendingPhotoRef.current === currentPhoto.id) {
      return
    }

    const inactiveIndex = activeLayer === 0 ? 1 : 0
    const photoToLoad = currentPhoto

    // Mark as pending
    pendingPhotoRef.current = photoToLoad.id

    // Preload the image first, then update layers and switch
    const img = new Image()
    img.src = photoToLoad.fullUrl

    img.onload = () => {
      // Only proceed if this is still the pending photo
      if (pendingPhotoRef.current !== photoToLoad.id) {
        return
      }

      pendingPhotoRef.current = null

      // Place photo in inactive layer
      setLayers((prev) => {
        const newLayers: [Photo | null, Photo | null] = [...prev]
        newLayers[inactiveIndex] = photoToLoad
        return newLayers
      })

      // Switch active layer after DOM update
      requestAnimationFrame(() => {
        setActiveLayer(inactiveIndex as 0 | 1)
      })
    }

    img.onerror = () => {
      // Clear pending on error
      if (pendingPhotoRef.current === photoToLoad.id) {
        pendingPhotoRef.current = null
      }
    }
  }, [currentPhoto, mode, layers, activeLayer])

  // Setup Intersection Observer for lazy loading (Grid mode only)
  useEffect(() => {
    if (mode !== 'grid') return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const photoId = img.dataset.photoId

            if (photoId && img.dataset.src) {
              img.src = img.dataset.src
              setLoadedImages((prev) => new Set([...prev, photoId]))
              observerRef.current?.unobserve(img)
            }
          }
        })
      },
      {
        rootMargin: '50px',
      }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [mode])

  // Empty state
  if (mode === 'slideshow' && !currentPhoto && !layers[0] && !layers[1]) {
    return null
  }

  if (mode === 'grid' && photos.length === 0) {
    return null
  }

  // Slideshow Mode (Backend-controlled)
  if (mode === 'slideshow') {
    return (
      <div className="h-full w-full relative bg-black overflow-hidden">
        {/* Layer 0 */}
        {layers[0] && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
              activeLayer === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={layers[0].fullUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              onError={() =>
                setFailedPhotoIds((prev) => new Set([...prev, layers[0]!.id]))
              }
            />
          </div>
        )}

        {/* Layer 1 */}
        {layers[1] && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
              activeLayer === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={layers[1].fullUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              onError={() =>
                setFailedPhotoIds((prev) => new Set([...prev, layers[1]!.id]))
              }
            />
          </div>
        )}

        {/* Debug Info */}
        {showDebugInfo && !isFullscreen && playlistInfo && layers[activeLayer] && (
          <div className="absolute top-20 left-4 text-white/50 text-xs font-mono bg-black/50 p-2 rounded pointer-events-none z-50">
            {playlistInfo.isQueueMode ? (
              <>
                Mode: Priority Queue ({playlistInfo.queueLength} remaining)
              </>
            ) : (
              <>
                Position: {playlistInfo.index + 1}/{playlistInfo.total}
              </>
            )}
            <br />
            Photo ID: {layers[activeLayer]!.id}
          </div>
        )}
      </div>
    )
  }

  // Grid Mode
  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-4 2xl:columns-5 3xl:columns-6 gap-4 sm:gap-6 lg:gap-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {validPhotos
          .sort((a, b) => b.uploadedAt - a.uploadedAt)
          .map((photo) => (
            <PhotoItem
              key={photo.id}
              photo={photo}
              observer={observerRef.current}
              isLoaded={loadedImages.has(photo.id)}
              onFail={() =>
                setFailedPhotoIds((prev) => new Set([...prev, photo.id]))
              }
            />
          ))}
      </div>
    </div>
  )
}

interface PhotoItemProps {
  photo: Photo
  observer: IntersectionObserver | null
  isLoaded: boolean
  onFail: () => void
}

function PhotoItem({ photo, observer, isLoaded, onFail }: PhotoItemProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (img && observer && !isLoaded) {
      observer.observe(img)
    }

    return () => {
      if (img && observer) {
        observer.unobserve(img)
      }
    }
  }, [observer, isLoaded])

  return (
    <div className="break-inside-avoid mb-4">
      <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 group">
        {/* Photo */}
        <img
          ref={imgRef}
          data-photo-id={photo.id}
          data-src={photo.thumbnailUrl}
          alt=""
          className={`w-full h-auto transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onError={(e) => {
            console.error('[PhotoWall] Failed to load thumbnail:', {
              photoId: photo.id,
              thumbnailUrl: photo.thumbnailUrl,
              error: e,
              errorType: e.type,
              target: (e.target as HTMLImageElement)?.src,
            })
            onFail()
          }}
        />

        {/* Loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
            <div className="text-gray-500 text-4xl">📸</div>
          </div>
        )}

        {/* Hover overlay with fullsize image */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
          <a
            href={photo.fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-sm px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
          >
            🔍 查看原圖
          </a>
        </div>
      </div>
    </div>
  )
}
