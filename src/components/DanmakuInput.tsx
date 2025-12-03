import { useState, type FormEvent } from 'react'

interface DanmakuInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

const QUICK_EMOJIS = ['❤️', '🎉', '㊗️', '🎊', '🎈']
const EMOJI_COOLDOWN_MS = 1000 // 1秒冷卻時間

export function DanmakuInput({
  onSend,
  disabled = false,
}: DanmakuInputProps) {
  const [content, setContent] = useState('')
  const [emojiCooldowns, setEmojiCooldowns] = useState<Record<string, boolean>>({})

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
    setEmojiCooldowns(prev => ({ ...prev, [emoji]: true }))

    // 1秒後恢復
    setTimeout(() => {
      setEmojiCooldowns(prev => ({ ...prev, [emoji]: false }))
    }, EMOJI_COOLDOWN_MS)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-4">
      {/* Quick Emojis */}
      <div className="flex gap-4 justify-center">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            disabled={disabled || emojiCooldowns[emoji]}
            className="text-3xl transition-opacity hover:opacity-70 active:opacity-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 focus-within:border-gray-300 focus-within:shadow-md transition-all">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="發送彈幕..."
            disabled={disabled}
            className="w-full bg-transparent border-none focus:outline-none text-gray-800 placeholder:text-gray-400 text-lg px-4 py-3 pr-16"
          />
          <button
            type="submit"
            disabled={disabled || !content.trim()}
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex-shrink-0 font-medium transition-colors whitespace-nowrap px-2 py-1
              ${
                disabled || !content.trim()
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-900 hover:text-gray-600'
              }`}
          >
            發送
          </button>
        </div>
      </form>
    </div>
  )
}
