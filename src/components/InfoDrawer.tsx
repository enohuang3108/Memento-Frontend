/**
 * Info Drawer Component
 * A bottom sheet drawer that displays event information
 * Supports touch gestures and click interactions
 */

import { Link } from '@tanstack/react-router'
import {
  Camera,
  Check,
  Copy,
  Monitor,
  QrCode,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface InfoDrawerProps {
  activityId: string
  event: {
    title: string | undefined
    participantCount: number
    photoCount: number
    status: 'active' | 'ended'
  }
  isConnected: boolean
  qrCodeUrl: string
}

type DrawerState = 'closed' | 'peek' | 'open'

export function InfoDrawer({
  activityId,
  event,
  isConnected,
  qrCodeUrl,
}: InfoDrawerProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>('peek')
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isCopied, setIsCopied] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return
      setCurrentY(e.touches[0].clientY)
    },
    [isDragging]
  )

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const deltaY = currentY - startY

    // Determine next state based on drag distance
    if (drawerState === 'peek') {
      if (deltaY < -50) {
        setDrawerState('open')
      } else if (deltaY > 50) {
        setDrawerState('closed')
      }
    } else if (drawerState === 'open') {
      if (deltaY > 100) {
        setDrawerState('peek')
      }
    } else if (drawerState === 'closed') {
      if (deltaY < -50) {
        setDrawerState('peek')
      }
    }
  }, [isDragging, currentY, startY, drawerState])

  // Handle click on header to toggle
  const handleHeaderClick = useCallback(() => {
    if (drawerState === 'peek') {
      setDrawerState('open')
    } else if (drawerState === 'open') {
      setDrawerState('peek')
    } else {
      setDrawerState('peek')
    }
  }, [drawerState])

  // Handle copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    const url = `${window.location.origin}/event/${activityId}`
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      } catch (e) {
        console.error('Failed to copy:', e)
      }
      document.body.removeChild(textArea)
    }
  }, [activityId])

  // Calculate drawer height based on state
  const getDrawerHeight = () => {
    if (drawerState === 'closed') return '0px'
    if (drawerState === 'peek') return '80px'
    return '70vh'
  }

  // Calculate transform during drag
  const getTransform = () => {
    if (!isDragging) return 'translateY(0)'
    const deltaY = currentY - startY
    const clampedDelta = Math.max(0, deltaY) // Only allow dragging down
    return `translateY(${clampedDelta}px)`
  }

  return (
    <>
      {/* Backdrop */}
      {drawerState === 'open' && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setDrawerState('peek')}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-all duration-300 ease-out"
        style={{
          height: getDrawerHeight(),
          transform: getTransform(),
        }}
      >
        {/* Drawer Handle */}
        <div
          className="py-3 px-4 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleHeaderClick}
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading font-bold text-text-main">
                {event.participantCount}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
              <Camera className="w-4 h-4 text-accent" />
              <span className="text-sm font-heading font-bold text-text-main">
                {event.photoCount}
              </span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                isConnected
                  ? 'bg-green-50 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">
                {isConnected ? '已連線' : '未連線'}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="overflow-y-auto px-4 pb-6 h-[calc(100%-60px)]">
          {/* QR Code */}
          <div className="bg-linear-to-br from-primary/5 to-accent/5 rounded-2xl p-6 mb-6 text-center border border-primary/10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-primary" />
              <p className="text-sm text-text-main font-heading font-bold">
                分享此 QR Code 讓更多人加入
              </p>
            </div>
            <div className="inline-block p-5 bg-white rounded-2xl border-2 border-primary/10">
              <img
                src={qrCodeUrl}
                alt="Event QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <button
              onClick={handleCopyUrl}
              className="mt-4 w-full group relative overflow-hidden px-4 py-3 rounded-xl transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-heading font-bold text-green-600">
                      已複製！
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-primary group-hover:text-primary-hover transition-colors" />
                    <span className="text-sm font-heading font-bold text-text-muted group-hover:text-primary transition-colors">
                      複製連結
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Display Mode Link */}
          <Link
            to="/event/$activityId/display"
            params={{ activityId }}
            className="block w-full group relative overflow-hidden bg-linear-to-r from-primary to-primary-hover text-white text-center font-heading font-bold text-lg py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Monitor className="w-5 h-5" />
              <span>開啟大螢幕顯示模式</span>
            </span>
            <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
          </Link>
        </div>
      </div>
    </>
  )
}
