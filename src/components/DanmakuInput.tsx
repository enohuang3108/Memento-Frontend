/**
 * DanmakuInput Component
 * Input for sending danmaku messages with quick emoji sticker buttons
 * Playful Geometric Design System - Japanese Sticker Style (white outline)
 */

import { useState, type FormEvent } from 'react'

interface DanmakuInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

const QUICK_EMOJIS = ['❤️', '🎉', '㊗️', '🎊', '🎈']
const EMOJI_COOLDOWN_MS = 1000 // 1秒冷卻時間

// 日式貼紙白色描邊效果 - 用多層 text-shadow 模擬輪廓 (4px)
const stickerOutlineStyle = {
  textShadow: `
    -4px -4px 0 #fff, -4px -3px 0 #fff, -4px -2px 0 #fff, -4px -1px 0 #fff, -4px 0px 0 #fff, -4px 1px 0 #fff, -4px 2px 0 #fff, -4px 3px 0 #fff, -4px 4px 0 #fff,
    -3px -4px 0 #fff, -3px -3px 0 #fff, -3px -2px 0 #fff, -3px -1px 0 #fff, -3px 0px 0 #fff, -3px 1px 0 #fff, -3px 2px 0 #fff, -3px 3px 0 #fff, -3px 4px 0 #fff,
    -2px -4px 0 #fff, -2px -3px 0 #fff, -2px -2px 0 #fff, -2px -1px 0 #fff, -2px 0px 0 #fff, -2px 1px 0 #fff, -2px 2px 0 #fff, -2px 3px 0 #fff, -2px 4px 0 #fff,
    -1px -4px 0 #fff, -1px -3px 0 #fff, -1px -2px 0 #fff, -1px -1px 0 #fff, -1px 0px 0 #fff, -1px 1px 0 #fff, -1px 2px 0 #fff, -1px 3px 0 #fff, -1px 4px 0 #fff,
     0px -4px 0 #fff,  0px -3px 0 #fff,  0px -2px 0 #fff,  0px -1px 0 #fff,                   0px 1px 0 #fff,  0px 2px 0 #fff,  0px 3px 0 #fff,  0px 4px 0 #fff,
     1px -4px 0 #fff,  1px -3px 0 #fff,  1px -2px 0 #fff,  1px -1px 0 #fff,  1px 0px 0 #fff,  1px 1px 0 #fff,  1px 2px 0 #fff,  1px 3px 0 #fff,  1px 4px 0 #fff,
     2px -4px 0 #fff,  2px -3px 0 #fff,  2px -2px 0 #fff,  2px -1px 0 #fff,  2px 0px 0 #fff,  2px 1px 0 #fff,  2px 2px 0 #fff,  2px 3px 0 #fff,  2px 4px 0 #fff,
     3px -4px 0 #fff,  3px -3px 0 #fff,  3px -2px 0 #fff,  3px -1px 0 #fff,  3px 0px 0 #fff,  3px 1px 0 #fff,  3px 2px 0 #fff,  3px 3px 0 #fff,  3px 4px 0 #fff,
     4px -4px 0 #fff,  4px -3px 0 #fff,  4px -2px 0 #fff,  4px -1px 0 #fff,  4px 0px 0 #fff,  4px 1px 0 #fff,  4px 2px 0 #fff,  4px 3px 0 #fff,  4px 4px 0 #fff,
     0px 5px 8px rgba(0,0,0,0.15)
  `,
}

export function DanmakuInput({ onSend, disabled = false }: DanmakuInputProps) {
  const [content, setContent] = useState('')
  const [emojiCooldowns, setEmojiCooldowns] = useState<Record<string, boolean>>(
    {}
  )
  const [pressedEmoji, setPressedEmoji] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendContent(content)
  }

  const sendContent = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    onSend(trimmed)
    setContent('')
  }

  const handleEmojiClick = (emoji: string) => {
    // 如果該 emoji 正在冷卻中，不執行任何操作
    if (emojiCooldowns[emoji]) return

    // 發送 emoji
    sendContent(emoji)

    // 設置該 emoji 為冷卻狀態
    setEmojiCooldowns((prev) => ({ ...prev, [emoji]: true }))

    // 按壓動畫
    setPressedEmoji(emoji)
    setTimeout(() => setPressedEmoji(null), 150)

    // 1秒後恢復
    setTimeout(() => {
      setEmojiCooldowns((prev) => ({ ...prev, [emoji]: false }))
    }, EMOJI_COOLDOWN_MS)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-4">
      {/* Japanese Sticker Style Emojis - White Outline */}
      <div className="flex gap-2 justify-center">
        {QUICK_EMOJIS.map((emoji) => {
          const isCoolingDown = emojiCooldowns[emoji]
          const isPressed = pressedEmoji === emoji

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              disabled={disabled || isCoolingDown}
              className={`
                text-4xl p-1
                transition-all duration-150 ease-out
                hover:scale-110 hover:-rotate-6
                active:scale-90
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0
                cursor-pointer select-none
                ${isPressed ? 'scale-90' : ''}
              `}
              style={stickerOutlineStyle}
            >
              {emoji}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div
          className="relative bg-white rounded-full border-2 border-foreground transition-all"
          style={{ boxShadow: '4px 4px 0px 0px #1E293B' }}
        >
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="發送彈幕..."
            disabled={disabled}
            className="w-full bg-transparent border-none focus:outline-none text-text-main placeholder:text-text-muted/50 text-lg px-5 py-3 pr-20 rounded-full font-body"
          />
          <button
            type="submit"
            disabled={disabled || !content.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 font-heading font-bold transition-all whitespace-nowrap px-4 py-1.5 rounded-full
              ${
                disabled || !content.trim()
                  ? 'text-text-muted/30 cursor-not-allowed'
                  : 'text-white bg-accent hover:bg-primary-hover border-2 border-foreground'
              }`}
            style={
              disabled || !content.trim()
                ? {}
                : { boxShadow: '2px 2px 0px 0px #1E293B' }
            }
          >
            發送
          </button>
        </div>
      </form>
    </div>
  )
}
