/**
 * DanmakuCanvas Component
 * Renders flying danmaku messages using Canvas API for performance
 * Japanese sticker style with white outline (works for emoji too)
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
  isEmoji: boolean
}

const COLORS = [
  '#FF6B6B', // Coral Red
  '#FFD93D', // Golden Yellow
  '#6BCB77', // Fresh Green
  '#4D96FF', // Sky Blue
  '#FF6FB5', // Hot Pink
  '#A66CFF', // Purple
  '#FF8C32', // Orange
  '#45CFDD', // Cyan
]

const FONT_SIZES = [28, 32, 36, 40]
const EMOJI_FONT_SIZES = [40, 48, 56, 64]
const SPEED_PX_PER_SEC = 150 // 像素/秒，時間基準速度
const MAX_CONCURRENT = 30
const OUTLINE_WIDTH = 6 // 白色描邊寬度

// 檢測是否為純 emoji
function isEmojiOnly(str: string): boolean {
  const emojiRegex =
    /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s]+$/u
  return emojiRegex.test(str)
}

export function DanmakuCanvas({ messages }: DanmakuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const activeDanmakuRef = useRef<ActiveDanmaku[]>([])
  const messageQueueRef = useRef<DanmakuMessage[]>([])
  const processedIdsRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)

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

    const ctx = canvas.getContext('2d', {
      // 脫離主執行緒同步，減少輸入延遲
      desynchronized: true,
      // 不需要讀取 Canvas 內容，啟用優化
      willReadFrequently: false,
    })
    if (!ctx) return

    const animate = (timestamp: number) => {
      // 計算 delta time（秒）
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0
      lastTimeRef.current = timestamp

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add new danmaku from queue if space available
      while (
        messageQueueRef.current.length > 0 &&
        activeDanmakuRef.current.length < MAX_CONCURRENT
      ) {
        const message = messageQueueRef.current.shift()!
        const isEmoji = isEmojiOnly(message.content)
        const fontSizes = isEmoji ? EMOJI_FONT_SIZES : FONT_SIZES
        const fontSize = fontSizes[Math.floor(Math.random() * fontSizes.length)]
        const color = COLORS[Math.floor(Math.random() * COLORS.length)]

        activeDanmakuRef.current.push({
          id: message.id,
          content: message.content,
          x: canvas.width,
          y: Math.random() * (canvas.height - 100) + 50,
          speed: SPEED_PX_PER_SEC,
          color,
          fontSize,
          isEmoji,
        })
      }

      // Update and draw active danmaku
      activeDanmakuRef.current = activeDanmakuRef.current.filter((danmaku) => {
        // 時間基準移動：速度 × delta time
        danmaku.x -= danmaku.speed * deltaTime

        // Set font
        ctx.font = `bold ${danmaku.fontSize}px "LINE Seed TW", "Noto Sans TC", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`

        // Remove if off-screen
        if (danmaku.x + ctx.measureText(danmaku.content).width < 0) {
          return false
        }

        ctx.save()

        if (danmaku.isEmoji) {
          // ===== Emoji：直接繪製，不加描邊 =====
          ctx.fillText(danmaku.content, danmaku.x, danmaku.y)
        } else {
          // ===== 文字用 strokeText =====

          // 1. 先繪製陰影層
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          ctx.shadowBlur = 6
          ctx.shadowOffsetX = 3
          ctx.shadowOffsetY = 3
          ctx.strokeStyle = 'rgba(0,0,0,0.01)'
          ctx.lineWidth = OUTLINE_WIDTH
          ctx.strokeText(danmaku.content, danmaku.x, danmaku.y)

          // 2. 重置陰影，繪製白色描邊
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0

          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = OUTLINE_WIDTH
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.strokeText(danmaku.content, danmaku.x, danmaku.y)

          // 3. 繪製彩色填充
          ctx.fillStyle = danmaku.color
          ctx.fillText(danmaku.content, danmaku.x, danmaku.y)
        }

        ctx.restore()

        return true
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // 使用 requestAnimationFrame 啟動，確保第一幀就有 timestamp
    animationFrameRef.current = requestAnimationFrame(animate)

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
        // GPU 加速：創建獨立合成層，避免與照片層互相影響
        transform: 'translateZ(0)',
        willChange: 'transform',
        // 防止子像素渲染造成模糊
        backfaceVisibility: 'hidden',
      }}
    />
  )
}
