/**
 * WebSocket client hook for real-time communication
 * Handles connection, reconnection, and message handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type ServerMessage =
  | { type: 'joined'; activityId: string; photos: Photo[]; timestamp: number; playlist?: Photo[]; currentIndex?: number }
  | { type: 'photo_added'; photo: Photo }
  | { type: 'play_photo'; photo: Photo; index: number; total: number; timestamp: number }
  | { type: 'danmaku'; id: string; content: string; sessionId: string; timestamp: number }
  | { type: 'activity_ended'; activityId: string; reason: string; timestamp: number }
  | { type: 'pong'; timestamp: number }
  | { type: 'error'; code: string; message: string; retryAfter?: number }

export type ClientMessage =
  | { type: 'photo_added'; driveFileId: string; thumbnailUrl: string; fullUrl: string; width?: number; height?: number; sessionId: string }
  | { type: 'danmaku'; content: string; sessionId: string }
  | { type: 'ping' }

export interface Photo {
  id: string
  activityId: string
  sessionId: string
  driveFileId: string
  thumbnailUrl: string
  fullUrl: string
  uploadedAt: number
  width?: number
  height?: number
}

export interface UseWebSocketOptions {
  url: string
  sessionId: string
  role?: 'participant' | 'display'
  onMessage?: (message: ServerMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    sessionId,
    role = 'participant',
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval: _reconnectInterval = 1000,
    maxReconnectAttempts = 5,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const savedCallbacks = useRef({ onMessage, onOpen, onClose, onError })

  // Update saved callbacks when they change
  useEffect(() => {
    savedCallbacks.current = { onMessage, onOpen, onClose, onError }
  }, [onMessage, onOpen, onClose, onError])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    setIsConnecting(true)

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setIsConnecting(false)
      reconnectAttemptsRef.current = 0

      // Send initial join message with session ID and role
      ws.send(JSON.stringify({ type: 'join', sessionId, role }))

      savedCallbacks.current.onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage
        savedCallbacks.current.onMessage?.(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setIsConnecting(false)
      savedCallbacks.current.onClose?.()

      // Auto-reconnect logic
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++
        const backoff = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)

        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`)
          connect()
        }, backoff)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      savedCallbacks.current.onError?.(error)
    }
  }, [url, sessionId, role, autoReconnect, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
  }, [])

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

  const sendMessage = useCallback((message: DistributiveOmit<ClientMessage, 'sessionId'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...message, sessionId }))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [sessionId])

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' })
    }, 30000)

    return () => clearInterval(pingInterval)
  }, [isConnected, sendMessage])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    isConnected,
    isConnecting,
    sendMessage,
    reconnect: connect,
    disconnect,
  }
}
