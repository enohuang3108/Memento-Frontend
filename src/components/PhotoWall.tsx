/**
 * PhotoWall Component
 * Displays photos in a masonry/grid layout or a slideshow
 */

import { useEffect, useRef, useState } from 'react'
import type { Photo } from '../lib/api'

interface PhotoWallProps {
  isFullscreen: boolean
  photos: Photo[]
  mode?: 'grid' | 'slideshow'
  slideshowInterval?: number // in milliseconds
}

export function PhotoWall({
  isFullscreen,
  photos,
  mode = 'grid',
  slideshowInterval = 5000
}: PhotoWallProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedPhotoIds, setFailedPhotoIds] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Filter out failed photos
  const validPhotos = photos.filter(p => !failedPhotoIds.has(p.id))

  // Sort photos by upload time (newest first)
  const sortedPhotos = [...validPhotos].sort((a, b) => b.uploadedAt - a.uploadedAt)

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

  // Slideshow timer
  useEffect(() => {
    if (mode !== 'slideshow' || sortedPhotos.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedPhotos.length)
    }, slideshowInterval)

    return () => clearInterval(timer)
  }, [mode, sortedPhotos.length, slideshowInterval])

  // Reset index if photos change significantly or mode changes
  useEffect(() => {
    if (currentIndex >= sortedPhotos.length) {
      setCurrentIndex(0)
    }
  }, [sortedPhotos.length])

  // Prefetch next images
  useEffect(() => {
    if (mode !== 'slideshow' || sortedPhotos.length === 0) return

    const PREFETCH_COUNT = 3
    for (let i = 1; i <= PREFETCH_COUNT; i++) {
      const nextIndex = (currentIndex + i) % sortedPhotos.length
      const photo = sortedPhotos[nextIndex]
      if (photo) {
        const img = new Image()
        img.src = photo.fullUrl
      }
    }
  }, [currentIndex, mode, sortedPhotos])

  if (photos.length === 0) {
    return null
  }

  // Slideshow Mode
  if (mode === 'slideshow') {
    return (
      <div className="h-full w-full relative bg-black overflow-hidden">
        {/* Render current and next photos for cross-fade */}
        {sortedPhotos.map((photo, index) => {
          const isVisible = index === currentIndex

          return (
            <div
              key={photo.id}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={photo.fullUrl}
                alt={`Photo ${index + 1}`}
                className="max-w-full max-h-full object-contain"
                loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                onError={() => {
                  console.warn(`Failed to load image: ${photo.fullUrl}`)
                  setFailedPhotoIds(prev => new Set([...prev, photo.id]))
                }}
              />
              {/* Debug Info */}
              {isVisible && !isFullscreen && (
                <div className="absolute top-20 left-4 text-white/50 text-xs font-mono bg-black/50 p-2 rounded pointer-events-none z-50">
                  Debug: {index + 1}/{sortedPhotos.length}<br/>
                  Total: {photos.length}<br/>
                  Valid: {validPhotos.length}<br/>
                  Failed: {failedPhotoIds.size}<br/>
                  ID: {photo.id}<br/>
                  URL: {photo.fullUrl.substring(0, 30)}...
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Grid Mode
  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-4 2xl:columns-5 3xl:columns-6 gap-4 sm:gap-6 lg:gap-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {sortedPhotos.map((photo) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            observer={observerRef.current}
            isLoaded={loadedImages.has(photo.id)}
            onFail={() => setFailedPhotoIds(prev => new Set([...prev, photo.id]))}
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
          onError={() => {
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
