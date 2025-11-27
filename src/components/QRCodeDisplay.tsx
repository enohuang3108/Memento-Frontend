/**
 * QR Code Display Component
 * Shows activity QR code and activity code
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
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
      )}

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-lg border-4 border-blue-500">
          <img src={qrCodeUrl} alt="Activity QR Code" className="w-64 h-64" />
        </div>
      </div>

      {/* Activity Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
          活動代碼
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={activityId}
            readOnly
            className="flex-1 text-center text-3xl font-mono font-bold bg-gray-50 border-2 border-gray-300 rounded-lg py-3 px-4 tracking-wider"
          />
          <button
            onClick={() => copyToClipboard(activityId)}
            className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            title="複製代碼"
          >
            📋
          </button>
        </div>
      </div>

      {/* Participant URL */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
          參與連結
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={participantUrl}
            readOnly
            className="flex-1 text-sm bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 truncate"
          />
          <button
            onClick={() => copyToClipboard(participantUrl)}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            title="複製連結"
          >
            📋
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">參與方式：</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. 掃描 QR Code</li>
          <li>2. 或輸入活動代碼 {activityId}</li>
          <li>3. 開始上傳照片和發送彈幕！</li>
        </ol>
      </div>
    </div>
  )
}
