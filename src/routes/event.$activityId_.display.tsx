/**
 * Display Page - Big Screen View
 * Full-screen photo wall with real-time updates via WebSocket
 */

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Maximize } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DanmakuCanvas } from '../components/DanmakuCanvas'
import { PhotoWall } from '../components/PhotoWall'
import { getEvent, getWebSocketUrl, type Photo } from '../lib/api'
import { getOrCreateSessionId } from '../lib/session'
import { useWebSocket, type ServerMessage } from '../lib/websocket'

export const Route = createFileRoute('/event/$activityId_/display')({
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
  const [sessionId] = useState(() => getOrCreateSessionId(activityId))
  const [photos, setPhotos] = useState<Photo[]>([])
  const [danmakuMessages, setDanmakuMessages] = useState<DanmakuItem[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fetch initial event data
  const { data, isLoading } = useQuery({
    queryKey: ['event', activityId],
    queryFn: () => getEvent(activityId),
  })

  // Load initial photos from HTTP API
  useEffect(() => {
    if (data?.photos) {
      console.log('[Display] Loading initial photos from API:', data.photos.length)
      setPhotos(data.photos)
    }
  }, [data])

  // WebSocket connection
  const handleMessage = useCallback((message: ServerMessage) => {
    console.log('[Display] WebSocket message:', message.type, message)

    switch (message.type) {
      case 'joined':
        // Initialize photos from server (WebSocket may have more up-to-date data)
        console.log('[Display] Joined - received', message.photos.length, 'photos')
        setPhotos(message.photos)
        break

      case 'photo_added':
        // Add new photo to the wall
        console.log('[Display] Photo added:', message.photo)
        setPhotos((prev) => [...prev, message.photo])
        break

      case 'danmaku':
        // Add danmaku message
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
        // Show ended notification
        alert('活動已結束')
        break

      case 'error':
        console.error('WebSocket error:', message.message)
        break
    }
  }, [])

  const wsUrl = getWebSocketUrl(activityId)
  const { isConnected } = useWebSocket({
    url: wsUrl,
    sessionId,
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
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-text-main text-xl font-heading font-bold">載入中...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center text-text-main">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl mb-2 font-heading font-bold">找不到活動</h1>
        </div>
      </div>
    )
  }



  return (
    <div className="relative h-screen w-screen bg-secondary overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#FCD34D 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
      </div>

      {/* Back Button */}
      {!isFullscreen && (
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-20 bg-black/30 text-white hover:bg-white hover:text-black backdrop-blur-sm p-2 rounded-full transition-colors"
          title="返回"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Fullscreen Disconnection Indicator */}
      {isFullscreen && !isConnected && (
        <div className="absolute top-4 left-4 z-20">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Fullscreen Toggle Button (moved to top-right since header is gone) */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 bg-black/30 text-white hover:bg-white hover:text-black backdrop-blur-sm p-2 rounded-full transition-colors"
          title="全螢幕"
        >
          <Maximize className="w-6 h-6" />
        </button>
      )}

      {/* Photo Wall */}
      <div className="h-full">
        <PhotoWall isFullscreen={isFullscreen} photos={photos} mode="slideshow" />
      </div>

      {/* Danmaku Canvas Overlay */}
      <DanmakuCanvas messages={danmakuMessages} />

      {/* Connection Status Indicator */}
      {!isConnected && !isFullscreen && (
        <div className="absolute bottom-4 left-4 px-4 py-2 bg-red-500/90 text-white rounded-xl shadow-lg font-bold animate-pulse">
          ⚠️ 連線中斷,嘗試重新連線...
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && isConnected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-text-muted/60">
            <div className="text-8xl mb-6 animate-bounce-slight">📸</div>
            <p className="text-3xl font-heading font-bold">等待照片上傳...</p>
            <p className="text-xl mt-2 font-body">掃描 QR Code 開始分享照片</p>
          </div>
        </div>
      )}
    </div>
  )
}
