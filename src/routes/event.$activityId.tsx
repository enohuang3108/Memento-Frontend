/**
 * Event/Activity Page - Participant View
 * Participants can upload photos and send danmaku messages
 * Playful Geometric Design System
 */

import { EventNotFound } from '@/components/EventNotFound'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DanmakuInput } from '../components/DanmakuInput'
import { GeometricBackground } from '../components/decorations'
import { InfoDrawer } from '../components/InfoDrawer'
import { Logo } from '../components/Logo'
import { PhotoUpload } from '../components/PhotoUpload'
import { getEvent, getWebSocketUrl } from '../lib/api'
import { SITE_NAME, SITE_URL } from '../lib/constants'
import { getOrCreateSessionId, rememberActivity } from '../lib/session'
import { useWebSocket } from '../lib/websocket'

export const Route = createFileRoute('/event/$activityId')({
  loader: async ({ params }) => {
    const data = await getEvent(params.activityId)
    return { event: data.event }
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.event?.title || '活動照片牆'
    const description = `加入「${title}」，即時上傳照片與彈幕留言！`
    const url = `${SITE_URL}/event/${params.activityId}`

    return {
      meta: [
        { title: `${title} | ${SITE_NAME}` },
        { name: 'description', content: description },
        // Open Graph
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: `${SITE_URL}/og-image.png` },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        // Twitter
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: `${SITE_URL}/og-image.png` },
      ],
    }
  },
  component: EventPage,
})

function EventPage() {
  const { activityId } = Route.useParams()
  const [sessionId] = useState(() => getOrCreateSessionId(activityId))
  const [uploadError, setUploadError] = useState<string | null>(null)
  const queryClient = useQueryClient()

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
  // Note: Participants no longer receive photo_added messages (backend optimization)
  // Photo count updates via refetch on upload success and 30s polling
  const wsUrl = getWebSocketUrl(activityId)
  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    sessionId,
    onMessage: (message) => {
      if (message.type === 'activity_ended') {
        refetch()
      }
      // Update title from joined message if available
      if (message.type === 'joined' && message.title) {
        queryClient.setQueryData(
          ['event', activityId],
          (oldData: typeof data) => {
            if (!oldData) return oldData
            return {
              ...oldData,
              event: { ...oldData.event, title: message.title },
            }
          }
        )
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
      // Refetch to update photoCount immediately after upload
      // (Participants no longer receive photo_added broadcasts from backend)
      refetch()
    },
    [sendMessage, refetch]
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
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <GeometricBackground variant="minimal" />
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
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
    <div className="min-h-screen bg-background pb-24 pt-8 relative overflow-hidden">
      {/* Logo in top-left corner */}
      <Logo />

      {/* Decorative Background */}
      <GeometricBackground variant="default" />

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        {/* Enhanced Header */}
        <div className="mb-8 text-center animate-pop-in">
          <h1 className="text-3xl font-heading font-bold text-text-main mb-3 tracking-tight">
            {event.title || '活動照片牆'}
          </h1>

          {event.status !== 'active' && (
            <div
              className="mt-4 p-4 bg-muted border-2 border-border rounded-2xl text-center"
              style={{ boxShadow: '4px 4px 0px 0px #E2E8F0' }}
            >
              <p className="text-text-muted font-bold text-sm">
                此活動已結束，點擊下方「活動資訊」查看詳情
              </p>
            </div>
          )}
        </div>

        {/* Primary Actions - Messages */}
        {event.status === 'active' && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: '0.1s' }}
          >
            <DanmakuInput onSend={handleDanmakuSend} disabled={!isConnected} />
          </div>
        )}

        {/* Primary Actions - Photo Upload */}
        {event.status === 'active' && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: '0.2s' }}
          >
            <PhotoUpload
              activityId={activityId}
              sessionId={sessionId}
              folderId={event.driveFolderId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => setUploadError(error)}
            />
            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border-2 border-red-400 rounded-xl animate-wiggle">
                <p className="text-sm text-red-600 text-center font-bold">
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
