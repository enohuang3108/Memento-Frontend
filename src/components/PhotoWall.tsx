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
  // Slideshow mode: backend-controlled current photo
  currentPhoto?: Photo | null
  // Slideshow mode: playlist info from backend
  playlistInfo?: { index: number; total: number }
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

  // For slideshow cross-fade transition
  const [displayedPhoto, setDisplayedPhoto] = useState<Photo | null>(null)
  const [previousPhoto, setPreviousPhoto] = useState<Photo | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Filter out failed photos for grid mode
  const validPhotos = photos.filter((p) => !failedPhotoIds.has(p.id))

  // Handle slideshow photo transition
  useEffect(() => {
    if (mode !== 'slideshow') return
    if (!currentPhoto) return
    if (displayedPhoto?.id === currentPhoto.id) return

    // Start transition
    setIsTransitioning(true)
    setPreviousPhoto(displayedPhoto)

    // After a short delay, switch to new photo
    const timer = setTimeout(() => {
      setDisplayedPhoto(currentPhoto)
      setIsTransitioning(false)
    }, 500) // 0.5s for fade-out

    return () => clearTimeout(timer)
  }, [currentPhoto, displayedPhoto, mode])

  // Prefetch next photo (if available from playlist)
  useEffect(() => {
    if (mode !== 'slideshow' || !currentPhoto) return

    // Prefetch the current photo
    const img = new Image()
    img.src = currentPhoto.fullUrl
  }, [currentPhoto, mode])

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
  if (mode === 'slideshow' && !currentPhoto && !displayedPhoto) {
    return null
  }

  if (mode === 'grid' && photos.length === 0) {
    return null
  }

  // Slideshow Mode (Backend-controlled)
  if (mode === 'slideshow') {
    const photoToShow = isTransitioning ? previousPhoto : displayedPhoto

    return (
      <div className="h-full w-full relative bg-black overflow-hidden">
        {/* Previous photo (fading out) */}
        {isTransitioning && previousPhoto && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out opacity-0 z-0"
          >
            <img
              src={previousPhoto.fullUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Current photo */}
        {photoToShow && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
              isTransitioning ? 'opacity-100' : 'opacity-100'
            } z-10`}
          >
            <img
              src={photoToShow.fullUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error('[PhotoWall] Failed to load image:', {
                  photoId: photoToShow.id,
                  url: photoToShow.fullUrl,
                  error: e,
                })
                setFailedPhotoIds((prev) => new Set([...prev, photoToShow.id]))
              }}
            />

            {/* Debug Info */}
            {showDebugInfo && !isFullscreen && playlistInfo && (
              <div className="absolute top-20 left-4 text-white/50 text-xs font-mono bg-black/50 p-2 rounded pointer-events-none z-50">
                Position: {playlistInfo.index + 1}/{playlistInfo.total}
                <br />
                Photo ID: {photoToShow.id}
                <br />
                Mode: Backend-controlled
              </div>
            )}
          </div>
        )}

        {/* Incoming photo (fading in) */}
        {isTransitioning && currentPhoto && (
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out opacity-100 z-20"
          >
            <img
              src={currentPhoto.fullUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
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
