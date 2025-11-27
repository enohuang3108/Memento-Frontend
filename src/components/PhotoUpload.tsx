/**
 * PhotoUpload Component
 * Handles photo file selection, preview, compression, and upload
 */

import { useState, useRef, type ChangeEvent } from 'react'
import { uploadPhotoToGoogleDrive, validatePhotoFile } from '../lib/googleDrive'

interface PhotoUploadProps {
  activityId: string
  sessionId: string
  folderId?: string
  onUploadSuccess?: (photoData: {
    driveFileId: string
    thumbnailUrl: string
    fullUrl: string
    width?: number
    height?: number
  }) => void
  onUploadError?: (error: string) => void
}

export function PhotoUpload({
  activityId,
  sessionId: _sessionId,
  folderId,
  onUploadSuccess,
  onUploadError,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validatePhotoFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Upload to Google Drive
      const result = await uploadPhotoToGoogleDrive({
        file: selectedFile,
        activityId,
        folderId,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Call success callback
      onUploadSuccess?.(result)

      // Reset state
      setTimeout(() => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setUploadProgress(0)
        setIsUploading(false)
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上傳失敗'
      setError(errorMessage)
      onUploadError?.(errorMessage)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📷 上傳照片</h2>

      {!selectedFile ? (
        /* File Selector */
        <div>
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <div className="text-6xl mb-4">📸</div>
              <p className="mb-2 text-sm text-gray-700">
                <span className="font-semibold">點擊選擇照片</span>
              </p>
              <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP (最大 20MB)</p>
            </div>
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      ) : (
        /* Preview and Upload */
        <div>
          {/* Preview */}
          <div className="mb-4">
            <img
              src={previewUrl || ''}
              alt="Preview"
              className="w-full h-auto rounded-lg max-h-96 object-contain bg-gray-100"
            />
          </div>

          {/* File Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">上傳中...</span>
                <span className="text-sm text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isUploading ? '上傳中...' : '上傳照片'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
