/**
 * Home Page - Create Activity
 * Playful Geometric Design System
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FolderOpen, Loader2 } from 'lucide-react'
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../lib/constants'
import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  GeometricBackground,
  SquiggleUnderline,
} from '../components/decorations'
import { Logo } from '../components/Logo'
import { createEvent } from '../lib/api'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: 'description', content: SITE_DESCRIPTION },
      // Open Graph
      { property: 'og:title', content: SITE_TITLE },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:image', content: `${SITE_URL}/og-image.png` },
      { property: 'og:url', content: `${SITE_URL}/` },
      { property: 'og:type', content: 'website' },
      // Twitter
      { name: 'twitter:title', content: SITE_TITLE },
      { name: 'twitter:description', content: SITE_DESCRIPTION },
      { name: 'twitter:image', content: `${SITE_URL}/og-image.png` },
    ],
  }),
  component: HomePage,
})

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
  const [driveFolderId, setDriveFolderId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
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
    <div className="min-h-screen pt-16 lg:pt-0 flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Logo in top-left corner */}
      <Logo />

      {/* Decorative Background */}
      <GeometricBackground variant="default" />

      <div className="max-w-4xl w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Hero Text */}
        <div className="text-left animate-pop-in">
          {/* Pill Badge */}
          <div className="pill-badge bg-tertiary text-foreground mb-6">
            <span>分享美好時光</span>
          </div>

          <h2 className="text-6xl lg:text-7xl font-heading font-bold text-text-main mb-2 tracking-tight leading-tight">
            Memento
          </h2>
          <div className="w-48 mb-6">
            <SquiggleUnderline color="#F472B6" />
          </div>

          <p className="text-lg text-text-muted font-body mb-8 leading-relaxed max-w-md">
            將 Google Drive 變成你的專屬照片牆，讓每一刻精彩瞬間即時分享
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full border-2 border-foreground"></div>
              <span className="font-bold">即時同步</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full border-2 border-foreground"></div>
              <span className="font-bold">簡單分享</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-tertiary rounded-full border-2 border-foreground"></div>
              <span className="font-bold">無限照片</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-quaternary rounded-full border-2 border-foreground"></div>
              <span className="font-bold">無需登入</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Card */}
        <div
          className="relative animate-pop-in"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="card-sticker p-8 relative z-20 bg-white">
            {/* Create Event Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="driveFolderId"
                  className="flex items-center gap-2 text-sm font-bold text-text-main mb-2 font-heading"
                >
                  <FolderOpen className="w-4 h-4 text-accent" />
                  Google Drive 連結 <span className="text-secondary">*</span>
                </label>
                <input
                  type="text"
                  id="driveFolderId"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  required
                  placeholder="貼上連結或資料夾 ID"
                  className="input-playful font-mono text-sm"
                />
                <p className="text-xs text-text-muted mt-2">
                  活動名稱將使用此資料夾的名稱
                </p>
                <details open className="mt-3 group">
                  <summary className="text-xs text-accent hover:text-primary-hover cursor-pointer font-bold list-none flex items-center gap-1.5 w-fit">
                    <span className="group-open:rotate-90 transition-transform">
                      ▶
                    </span>{' '}
                    如何取得資料夾 ID？
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-xl text-xs text-text-muted border-2 border-border">
                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      <li>建立 Google Drive 資料夾，並設定資料夾名稱</li>
                      <li>右鍵點擊 → 選擇「共用」</li>
                      <li>
                        設定為知道連結的人都能編輯，或是僅允許
                        oddlabcc@gmail.com 編輯
                      </li>
                      <li>複製連結或網址末端的 ID</li>
                    </ol>
                  </div>
                </details>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-400 rounded-xl animate-wiggle">
                  <p className="text-sm text-red-600 text-center font-bold">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full btn-candy flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  )
}
