/**
 * DanmakuCanvas Component
 * Renders flying danmaku messages using Canvas API for performance
 */

import { useEffect, useRef, useState } from 'react'

interface DanmakuMessage {
  id: string
  content: string
  sessionId: string
  timestamp: number
}

interface DanmakuCanvasProps {
  messages: DanmakuMessage[]
}

interface ActiveDanmaku {
  id: string
  content: string
  x: number
  y: number
  speed: number
  color: string
  fontSize: number
}

const COLORS = [
  '#FFFFFF',
  '#FFD700',
  '#FF69B4',
  '#00FFFF',
  '#FF6347',
  '#7FFF00',
  '#FF1493',
  '#00FA9A',
]

const FONT_SIZES = [24, 28, 32, 36]
const BASE_SPEED = 2
const MAX_CONCURRENT = 10

export function DanmakuCanvas({ messages }: DanmakuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const activeDanmakuRef = useRef<ActiveDanmaku[]>([])
  const messageQueueRef = useRef<DanmakuMessage[]>([])
  const processedIdsRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Process new messages
  useEffect(() => {
    messages.forEach((message) => {
      if (!processedIdsRef.current.has(message.id)) {
        messageQueueRef.current.push(message)
        processedIdsRef.current.add(message.id)
      }
    })
  }, [messages])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add new danmaku from queue if space available
      while (
        messageQueueRef.current.length > 0 &&
        activeDanmakuRef.current.length < MAX_CONCURRENT
      ) {
        const message = messageQueueRef.current.shift()!
        const fontSize = FONT_SIZES[Math.floor(Math.random() * FONT_SIZES.length)]
        const color = COLORS[Math.floor(Math.random() * COLORS.length)]

        activeDanmakuRef.current.push({
          id: message.id,
          content: message.content,
          x: canvas.width,
          y: Math.random() * (canvas.height - 100) + 50,
          speed: BASE_SPEED + Math.random() * 2,
          color,
          fontSize,
        })
      }

      // Update and draw active danmaku
      activeDanmakuRef.current = activeDanmakuRef.current.filter((danmaku) => {
        // Update position
        danmaku.x -= danmaku.speed

        // Remove if off-screen
        if (danmaku.x + ctx.measureText(danmaku.content).width < 0) {
          return false
        }

        // Draw danmaku
        ctx.font = `bold ${danmaku.fontSize}px "Microsoft YaHei", "PingFang TC", sans-serif`
        ctx.fillStyle = '#000000'
        ctx.strokeStyle = danmaku.color
        ctx.lineWidth = 3

        // Stroke (outline)
        ctx.strokeText(danmaku.content, danmaku.x, danmaku.y)

        // Fill (text)
        ctx.fillStyle = danmaku.color
        ctx.fillText(danmaku.content, danmaku.x, danmaku.y)

        return true
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [dimensions])

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    />
  )
}
