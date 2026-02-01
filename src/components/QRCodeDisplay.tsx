/**
 * QR Code Display Component
 * Shows activity QR code and activity code
 * Playful Geometric Design System
 */

interface QRCodeDisplayProps {
  activityId: string
  qrCodeUrl: string
  title?: string
}

export function QRCodeDisplay({ activityId, qrCodeUrl, title }: QRCodeDisplayProps) {
  const participantUrl = `${window.location.origin}/event/${activityId}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="card-sticker p-8 max-w-md mx-auto">
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-heading font-bold text-text-main">{title}</h2>
        </div>
      )}

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div
          className="bg-white p-4 rounded-2xl border-2 border-foreground"
          style={{ boxShadow: '4px 4px 0px 0px #8B5CF6' }}
        >
          <img src={qrCodeUrl} alt="Activity QR Code" className="w-64 h-64" />
        </div>
      </div>

      {/* Activity Code */}
      <div className="mb-6">
        <label className="block text-sm font-heading font-bold text-text-main mb-2 text-center">
          活動代碼
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={activityId}
            readOnly
            className="flex-1 text-center text-3xl font-mono font-bold bg-muted border-2 border-border rounded-xl py-3 px-4 tracking-wider text-text-main"
          />
          <button
            onClick={() => copyToClipboard(activityId)}
            className="px-4 py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl transition-colors border-2 border-accent/30 font-bold"
            title="複製代碼"
          >
            📋
          </button>
        </div>
      </div>

      {/* Participant URL */}
      <div className="mb-6">
        <label className="block text-sm font-heading font-bold text-text-main mb-2 text-center">
          參與連結
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={participantUrl}
            readOnly
            className="flex-1 text-sm bg-muted border-2 border-border rounded-xl py-2 px-3 truncate text-text-muted"
          />
          <button
            onClick={() => copyToClipboard(participantUrl)}
            className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl transition-colors border-2 border-accent/30 font-bold"
            title="複製連結"
          >
            📋
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-tertiary/10 rounded-xl p-4 border-2 border-tertiary/30">
        <h3 className="font-heading font-bold text-text-main mb-2">參與方式：</h3>
        <ol className="text-sm text-text-muted space-y-1">
          <li>1. 掃描 QR Code</li>
          <li>2. 或輸入活動代碼 <span className="font-mono font-bold text-accent">{activityId}</span></li>
          <li>3. 開始上傳照片和發送彈幕！</li>
        </ol>
      </div>
    </div>
  )
}
