/**
 * Display Page - Big Screen View
 * Full-screen photo wall with real-time updates via WebSocket
 */

import { EventNotFound } from '@/components/EventNotFound'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Lock, Loader2, Maximize } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DanmakuCanvas } from '../components/DanmakuCanvas'
import { PhotoWall } from '../components/PhotoWall'
import { getEvent, getWebSocketUrl, verifyDisplayPassword, type Photo } from '../lib/api'
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

// Session storage key for display password authorization
const getDisplayAuthKey = (activityId: string) => `display_auth_${activityId}`

function DisplayPage() {
  const { activityId } = Route.useParams()
  const navigate = useNavigate()
  const [sessionId] = useState(() => getOrCreateSessionId(activityId))
  const [photos, setPhotos] = useState<Photo[]>([])
  const [danmakuMessages, setDanmakuMessages] = useState<DanmakuItem[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Display password authentication state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    // Check if already authorized in this session
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(getDisplayAuthKey(activityId)) === 'true'
    }
    return false
  })
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Backend-controlled slideshow state
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null)
  const [playlistInfo, setPlaylistInfo] = useState<{ index: number; total: number } | null>(null)

  // Fetch initial event data
  const { data, isLoading } = useQuery({
    queryKey: ['event', activityId],
    queryFn: () => getEvent(activityId),
  })

  // Handle password verification
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError('請輸入密碼')
      return
    }

    setIsVerifying(true)
    setPasswordError(null)

    try {
      const result = await verifyDisplayPassword(activityId, password.trim())
      if (result.valid) {
        setIsAuthorized(true)
        // Remember authorization for this session
        sessionStorage.setItem(getDisplayAuthKey(activityId), 'true')
      } else {
        setPasswordError('密碼錯誤，請重新輸入')
        setPassword('')
      }
    } catch {
      setPasswordError('驗證失敗，請稍後再試')
    } finally {
      setIsVerifying(false)
    }
  }, [activityId, password])

  // Load initial photos from HTTP API
  useEffect(() => {
    if (data?.photos) {
      console.log(
        '[Display] Loading initial photos from API:',
        data.photos.length
      )
      setPhotos(data.photos)
    }
  }, [data])

  // WebSocket connection
  const handleMessage = useCallback((message: ServerMessage) => {
    console.log('[Display] WebSocket message:', message.type, message)

    switch (message.type) {
      case 'joined':
        // Initialize photos from server (WebSocket may have more up-to-date data)
        console.log(
          '[Display] Joined - received',
          message.photos.length,
          'photos'
        )
        setPhotos(message.photos)

        // For Display client: initialize playlist state if available
        if (message.playlist && message.currentIndex !== undefined) {
          console.log(
            '[Display] Playlist info received:',
            message.playlist.length,
            'photos, current index:',
            message.currentIndex
          )
          setPlaylistInfo({
            index: message.currentIndex,
            total: message.playlist.length,
          })
          // Set initial photo from playlist
          if (message.playlist[message.currentIndex]) {
            setCurrentPhoto(message.playlist[message.currentIndex])
          }
        }
        break

      case 'photo_added':
        // Add new photo to the wall (for grid mode / participant view)
        console.log('[Display] Photo added:', message.photo)
        setPhotos((prev) => [...prev, message.photo])
        break

      case 'play_photo':
        // Backend-controlled playback: update current photo
        console.log('[Display] Play photo:', message.photo.id, 'at', message.index + 1, '/', message.total)
        setCurrentPhoto(message.photo)
        setPlaylistInfo({
          index: message.index,
          total: message.total,
        })
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
    role: 'display', // Identify as Display client for backend-controlled playback
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

  // Show password prompt if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-primary/10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-text-main mb-2">
                顯示模式驗證
              </h1>
              <p className="text-text-muted">
                請輸入活動密碼以開啟大螢幕顯示
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.replace(/\D/g, ''))
                    setPasswordError(null)
                  }}
                  placeholder="請輸入 6 位數密碼"
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] border-2 border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  autoFocus
                  disabled={isVerifying}
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 text-center font-medium">
                    {passwordError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || password.length !== 6}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-heading font-bold text-lg py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    驗證中...
                  </>
                ) : (
                  '進入顯示模式'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate({ to: '/event/$activityId', params: { activityId } })}
                className="text-text-muted hover:text-primary text-sm font-medium transition-colors"
              >
                返回活動頁面
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen bg-secondary overflow-hidden">
      {/* Decorative Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#FCD34D 2px, transparent 2px)',
          backgroundSize: '30px 30px',
        }}
      ></div>

      {/* Back Button */}
      {!isFullscreen && (
        <button
          onClick={() =>
            navigate({ to: '/event/$activityId', params: { activityId } })
          }
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
        <PhotoWall
          isFullscreen={isFullscreen}
          photos={photos}
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
        <div className="absolute bottom-4 left-4 px-4 py-2 bg-red-500/90 text-white rounded-xl shadow-lg font-bold animate-pulse">
          ⚠️ 連線中斷,嘗試重新連線...
        </div>
      )}

      {/* Empty State */}
      {!currentPhoto && photos.length === 0 && isConnected && (
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
