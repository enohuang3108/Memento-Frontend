/**
 * Display Page - Big Screen View
 * Full-screen photo wall with real-time updates via WebSocket
 * Playful Geometric Design System
 */

import { EventNotFound } from '@/components/EventNotFound'
import { useSlideshowTimer } from '@/hooks/useSlideshowTimer'
import { useSlideshowStore } from '@/stores/slideshowStore'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Maximize } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DanmakuCanvas } from '../components/DanmakuCanvas'
import { Circle, DotPatternYellow, Square } from '../components/decorations'
import { PhotoWall } from '../components/PhotoWall'
import { getEvent, getWebSocketUrl } from '../lib/api'
import { getOrCreateSessionId } from '../lib/session'
import { useWebSocket, type ServerMessage } from '../lib/websocket'

export const Route = createFileRoute('/event/$activityId_/display')({
  head: () => ({
    meta: [
      { title: '照片牆顯示 | Memento' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: DisplayPage,
})

interface DanmakuItem {
  id: string
  content: string
  sessionId: string
  timestamp: number
}

function DisplayPage() {
  const { activityId } = Route.useParams()
  const navigate = useNavigate()
  const [sessionId] = useState(() => getOrCreateSessionId(activityId))
  const [danmakuMessages, setDanmakuMessages] = useState<DanmakuItem[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ===== Slideshow Store =====
  const currentPhoto = useSlideshowStore((s) => s.currentPhoto)
  const allPhotos = useSlideshowStore((s) => s.allPhotos)
  const pendingQueue = useSlideshowStore((s) => s.pendingQueue)
  const rotationIndex = useSlideshowStore((s) => s.rotationIndex)
  const initialize = useSlideshowStore((s) => s.initialize)
  const addPhoto = useSlideshowStore((s) => s.addPhoto)
  const reset = useSlideshowStore((s) => s.reset)

  // Reset store on unmount
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  // Slideshow timer
  const hasPhotos = allPhotos.length > 0 || pendingQueue.length > 0
  useSlideshowTimer(hasPhotos)

  // Fetch initial event data
  const { data, isLoading } = useQuery({
    queryKey: ['event', activityId],
    queryFn: () => getEvent(activityId),
  })

  // 播放列表資訊
  const playlistInfo = useMemo(() => {
    if (allPhotos.length === 0 && pendingQueue.length === 0) return null
    const isQueueMode = pendingQueue.length > 0
    return {
      index: rotationIndex,
      total: allPhotos.length,
      queueLength: pendingQueue.length,
      isQueueMode,
    }
  }, [allPhotos.length, pendingQueue.length, rotationIndex])

  // WebSocket message handler
  const handleMessage = useCallback(
    (message: ServerMessage) => {
      console.log('[Display] WebSocket message:', message.type, message)

      switch (message.type) {
        case 'joined':
          console.log(
            '[Display] Joined - received',
            message.photos.length,
            'photos'
          )
          initialize(message.photos)
          break

        case 'photo_added':
          console.log('[Display] New photo:', message.photo.driveFileId)
          addPhoto(message.photo)
          break

        case 'danmaku':
          setDanmakuMessages((prev) => [
            ...prev,
            {
              id: message.id,
              content: message.content,
              sessionId: message.sessionId,
              timestamp: message.timestamp,
            },
          ])
          break

        case 'activity_ended':
          alert('活動已結束')
          break

        case 'error':
          console.error('WebSocket error:', message.message)
          break
      }
    },
    [initialize, addPhoto]
  )

  // WebSocket connection
  const wsUrl = getWebSocketUrl(activityId)
  const { isConnected } = useWebSocket({
    url: wsUrl,
    sessionId,
    role: 'display',
    onMessage: handleMessage,
  })

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <DotPatternYellow opacity={0.1} spacing={30} />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-main text-xl font-heading font-bold">
            載入中...
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <EventNotFound />
  }

  return (
    <div className="relative h-screen w-screen bg-background overflow-hidden">
      {/* Decorative Background Pattern */}
      <DotPatternYellow opacity={0.08} spacing={30} />

      {/* Back Button */}
      {!isFullscreen && (
        <button
          onClick={() =>
            navigate({ to: '/event/$activityId', params: { activityId } })
          }
          className="absolute top-4 left-4 z-20 bg-foreground text-white hover:bg-accent p-2 rounded-full transition-colors border-2 border-foreground"
          style={{ boxShadow: '3px 3px 0px 0px #1E293B' }}
          title="返回"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Fullscreen Disconnection Indicator */}
      {isFullscreen && !isConnected && (
        <div className="absolute top-4 left-4 z-20">
          <div className="w-3 h-3 bg-secondary rounded-full animate-pulse border-2 border-foreground"></div>
        </div>
      )}

      {/* Fullscreen Toggle Button (moved to top-right since header is gone) */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 bg-foreground text-white hover:bg-accent p-2 rounded-full transition-colors border-2 border-foreground"
          style={{ boxShadow: '3px 3px 0px 0px #1E293B' }}
          title="全螢幕"
        >
          <Maximize className="w-6 h-6" />
        </button>
      )}

      {/* Photo Wall */}
      <div className="h-full">
        <PhotoWall
          isFullscreen={isFullscreen}
          photos={allPhotos}
          mode="slideshow"
          currentPhoto={currentPhoto}
          playlistInfo={playlistInfo ?? undefined}
          showDebugInfo={import.meta.env.VITE_SITE !== 'production'}
        />
      </div>

      {/* Danmaku Canvas Overlay */}
      <DanmakuCanvas messages={danmakuMessages} />

      {/* Connection Status Indicator */}
      {!isConnected && !isFullscreen && (
        <div
          className="absolute bottom-4 left-4 px-4 py-2 bg-secondary text-white rounded-full font-heading font-bold animate-pulse border-2 border-foreground"
          style={{ boxShadow: '3px 3px 0px 0px #1E293B' }}
        >
          ⚠️ 連線中斷,嘗試重新連線...
        </div>
      )}

      {/* Empty State */}
      {!currentPhoto && allPhotos.length === 0 && isConnected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Decorative shapes for empty state */}
          <Circle
            className="absolute w-96 h-96 bg-tertiary/10"
            style={{ top: '10%', right: '5%' }}
          />
          <Circle
            className="absolute w-64 h-64 bg-secondary/10"
            style={{ bottom: '15%', left: '10%' }}
          />
          <Square
            className="absolute w-24 h-24 bg-accent/10 rotate-12"
            style={{ top: '30%', left: '20%' }}
          />

          <div className="text-center text-text-muted/60 relative z-10">
            <div className="text-8xl mb-6 animate-bounce-slight">📸</div>
            <p className="text-3xl font-heading font-bold">等待照片上傳...</p>
            <p className="text-xl mt-2 font-body">掃描 QR Code 開始分享照片</p>
          </div>
        </div>
      )}
    </div>
  )
}
