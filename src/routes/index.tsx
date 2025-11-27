/**
 * Home Page - Create Activity
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FolderOpen, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../components/Logo'
import { createEvent } from '../lib/api'

export const Route = createFileRoute('/')({ component: HomePage })

/**
 * Extract Google Drive folder ID from various URL formats
 * Supports:
 * - https://drive.google.com/drive/u/4/folders/1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6
 * - https://drive.google.com/drive/folders/1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6?usp=sharing
 * - Direct ID: 1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6
 */
function extractDriveFolderId(input: string): string | null {
  const trimmedInput = input.trim()

  // If it looks like a URL, try to extract the folder ID
  if (trimmedInput.includes('drive.google.com')) {
    // Match patterns like /folders/ID or /folders/ID?param=value
    const match = trimmedInput.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  // Otherwise, assume it's a direct ID
  // Basic validation: Google Drive folder IDs are typically alphanumeric with - and _
  if (/^[a-zA-Z0-9_-]+$/.test(trimmedInput)) {
    return trimmedInput
  }

  return null
}

function HomePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [driveFolderId, setDriveFolderId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Extract and validate Google Drive Folder ID
    const extractedId = extractDriveFolderId(driveFolderId)
    if (!extractedId) {
      setError('請輸入有效的 Google Drive 資料夾 ID 或連結')
      return
    }

    setIsCreating(true)

    try {
      const response = await createEvent({
        title: title.trim() || undefined,
        driveFolderId: extractedId,
      })

      // Navigate to the event page with QR code
      navigate({
        to: '/event/$activityId',
        params: { activityId: response.event.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立活動失敗')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary relative overflow-hidden">
      {/* Logo in top-left corner */}
      <Logo />

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Hero Text */}
        <div className="text-left animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-heading font-bold text-primary">
              即時照片分享
            </span>
          </div>

          <h2 className="text-6xl lg:text-7xl font-heading font-bold text-text-main mb-6 tracking-tight leading-tight">
            Memento
          </h2>
          <p className="text-lg text-text-muted font-body mb-8 leading-relaxed max-w-md">
            打造您的專屬即時照片牆，讓每一刻精彩瞬間即時分享
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>即時同步</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>簡單分享</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>無限照片</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Card */}
        <div
          className="relative animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="card-modern p-8 relative z-20 bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
            {/* Create Event Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="title"
                  className="flex items-center gap-2 text-sm font-bold text-text-main mb-2 font-heading"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  活動名稱
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="一二三木頭人"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white text-text-main placeholder-slate-400 hover:border-slate-300"
                />
              </div>

              <div>
                <label
                  htmlFor="driveFolderId"
                  className="flex items-center gap-2 text-sm font-bold text-text-main mb-2 font-heading"
                >
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Google Drive 資料夾 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="driveFolderId"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  required
                  placeholder="貼上連結或資料夾 ID"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white text-text-main placeholder-slate-400 font-mono text-sm hover:border-slate-300"
                />
                <details className="mt-3 group">
                  <summary className="text-xs text-primary hover:text-primary-hover cursor-pointer font-bold list-none flex items-center gap-1.5 w-fit">
                    <span className="group-open:rotate-90 transition-transform">
                      ▶
                    </span>{' '}
                    如何取得資料夾 ID？
                  </summary>
                  <div className="mt-2 p-4 bg-slate-50/80 rounded-xl text-xs text-slate-600 border border-slate-200/60">
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      <li>建立 Google Drive 資料夾</li>
                      <li>右鍵點擊 → 選擇「共用」</li>
                      <li>設定為「知道連結的人可以檢視」</li>
                      <li>複製連結或網址末端的 ID</li>
                    </ol>
                  </div>
                </details>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-red-600 text-center font-medium">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3.5 rounded-xl font-heading font-bold text-base bg-text-main text-white hover:bg-slate-800 transition-all duration-300 shadow-lg shadow-slate-300 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] group"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>建立中...</span>
                  </>
                ) : (
                  <span>建立新活動</span>
                )}
              </button>
            </form>
          </div>

          {/* Background decorative blob behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-br from-primary/20 to-accent/20 rounded-full blur-3xl -z-10"></div>
        </div>
      </div>
    </div>
  )
}
