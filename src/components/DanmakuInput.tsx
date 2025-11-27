import { useState, type FormEvent } from 'react'

interface DanmakuInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  cooldown?: number // Cooldown in milliseconds
}

export function DanmakuInput({
  onSend,
  disabled = false,
  cooldown = 2000,
}: DanmakuInputProps) {
  const [content, setContent] = useState('')
  const [lastSentTime, setLastSentTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const remainingCooldown = Math.max(0, cooldown - (Date.now() - lastSentTime))
  const isCoolingDown = remainingCooldown > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const trimmed = content.trim()
    if (!trimmed) return

    if (trimmed.length > 50) {
      setError('彈幕長度不可超過 50 字元')
      return
    }

    if (isCoolingDown) {
      return
    }

    onSend(trimmed)
    setContent('')
    setLastSentTime(Date.now())
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (error) setError(null)
          }}
          placeholder="發送彈幕..."
          disabled={disabled}
          maxLength={50}
          className="flex-1 px-4 py-2 rounded-full border-2 border-primary/20 focus:border-primary focus:outline-none transition-colors bg-white/80 backdrop-blur-sm text-text-main placeholder:text-text-muted"
        />
        <button
          type="submit"
          disabled={disabled || !content.trim() || isCoolingDown}
          className={`px-6 py-2 rounded-full font-bold transition-all
            ${
              disabled || !content.trim() || isCoolingDown
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-text-main hover:bg-primary-hover hover:-translate-y-0.5'
            }`}
        >
          {isCoolingDown ? `${Math.ceil(remainingCooldown / 1000)}s` : '發送'}
        </button>
      </div>

      {/* Character count and error message */}
      <div className="absolute -bottom-6 left-4 right-4 flex justify-between text-xs">
        <span className="text-red-500 font-bold">{error}</span>
        <span
          className={`${content.length > 40 ? 'text-orange-500' : 'text-text-muted'}`}
        >
          {content.length}/50
        </span>
      </div>
    </form>
  )
}
