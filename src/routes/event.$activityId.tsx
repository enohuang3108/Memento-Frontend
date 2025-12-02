/**
 * Event/Activity Page - Participant View
 * Participants can upload photos and send danmaku messages
 */

import { EventNotFound } from '@/components/EventNotFound'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DanmakuInput } from '../components/DanmakuInput'
import { InfoDrawer } from '../components/InfoDrawer'
import { Logo } from '../components/Logo'
import { PhotoUpload } from '../components/PhotoUpload'
import { getEvent, getWebSocketUrl } from '../lib/api'
import { getOrCreateSessionId, rememberActivity } from '../lib/session'
import { useWebSocket } from '../lib/websocket'

export const Route = createFileRoute('/event/$activityId')({
  component: EventPage,
})

function EventPage() {
  const { activityId } = Route.useParams()
  const [sessionId] = useState(() => getOrCreateSessionId(activityId))
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Fetch event data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['event', activityId],
    queryFn: () => getEvent(activityId),
    refetchInterval: 30000, // Refetch every 30s to check if event is still active
  })

  // Remember this activity
  useEffect(() => {
    rememberActivity(activityId)
  }, [activityId])

  // WebSocket for real-time updates
  const wsUrl = getWebSocketUrl(activityId)
  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    sessionId,
    onMessage: (message) => {
      if (message.type === 'photo_added' || message.type === 'activity_ended') {
        refetch()
      }
    },
  })

  const handleUploadSuccess = useCallback(
    (photoData: {
      driveFileId: string
      thumbnailUrl: string
      fullUrl: string
      width?: number
      height?: number
    }) => {
      // Send photo_added message via WebSocket
      sendMessage({
        type: 'photo_added',
        ...photoData,
      })
    },
    [sendMessage]
  )

  const handleDanmakuSend = useCallback(
    (content: string) => {
      sendMessage({
        type: 'danmaku',
        content,
      })
    },
    [sendMessage]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted font-heading font-bold">載入中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <EventNotFound />
  }

  if (!data) {
    return <EventNotFound />
  }

  const { event } = data

  // Generate QR code URL for this event
  const participantUrl = `${window.location.origin}/event/${activityId}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    participantUrl
  )}`

  return (
    <div className="min-h-screen bg-secondary pb-24 pt-4">
      {/* Logo in top-left corner */}
      <Logo />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Enhanced Header */}
        <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-heading font-bold text-text-main mb-3 tracking-tight">
            {event.title || '活動照片牆'}
          </h1>

          {event.status !== 'active' && (
            <div className="mt-4 p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl text-center animate-in fade-in duration-300">
              <p className="text-slate-600 font-bold text-sm">
                此活動已結束，點擊下方「活動資訊」查看詳情
              </p>
            </div>
          )}
        </div>

        {/* Primary Actions - Messages */}
        {event.status === 'active' && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DanmakuInput onSend={handleDanmakuSend} disabled={!isConnected} />
          </div>
        )}

        {/* Primary Actions - Photo Upload */}
        {event.status === 'active' && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <PhotoUpload
              activityId={activityId}
              sessionId={sessionId}
              folderId={event.driveFolderId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => setUploadError(error)}
            />
            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in duration-300">
                <p className="text-sm text-red-600 text-center font-medium">
                  {uploadError}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Drawer - Shows all event details */}
      <InfoDrawer
        activityId={activityId}
        event={{
          title: event.title,
          participantCount: event.participantCount,
          photoCount: event.photoCount,
          status: event.status,
        }}
        isConnected={isConnected}
        qrCodeUrl={qrCodeUrl}
      />
    </div>
  )
}
