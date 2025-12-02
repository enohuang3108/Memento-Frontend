/**
 * PhotoUpload Component
 * Handles multiple photo file selection, preview, compression, and batch upload
 */

import { useRef, useState, type ChangeEvent } from 'react'
import { uploadPhotoToGoogleDrive, validatePhotoFile } from '../lib/googleDrive'

const MAX_PHOTOS = 50

interface PhotoFile {
  file: File
  previewUrl: string
  id: string
}

interface UploadStatus {
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

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
  const [selectedFiles, setSelectedFiles] = useState<PhotoFile[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<Map<string, UploadStatus>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check total count
    if (selectedFiles.length + files.length > MAX_PHOTOS) {
      setError(`最多只能選擇 ${MAX_PHOTOS} 張照片`)
      return
    }

    const validFiles: PhotoFile[] = []
    const errors: string[] = []

    files.forEach((file, index) => {
      // Validate file
      const validation = validatePhotoFile(file)
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`)
        return
      }

      // Create preview
      const reader = new FileReader()
      const id = `${Date.now()}-${index}`

      reader.onload = () => {
        validFiles.push({
          file,
          previewUrl: reader.result as string,
          id,
        })

        // Update state when all files are processed
        if (validFiles.length + errors.length === files.length) {
          setSelectedFiles((prev) => [...prev, ...validFiles])
          if (errors.length > 0) {
            setError(errors.join('\n'))
          } else {
            setError(null)
          }
        }
      }

      reader.readAsDataURL(file)
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id))
    setUploadStatuses((prev) => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setError(null)

    // Initialize upload statuses
    const initialStatuses = new Map<string, UploadStatus>()
    selectedFiles.forEach((photoFile) => {
      initialStatuses.set(photoFile.id, {
        id: photoFile.id,
        status: 'pending',
        progress: 0,
      })
    })
    setUploadStatuses(initialStatuses)

    // Upload files sequentially
    for (const photoFile of selectedFiles) {
      try {
        // Update status to uploading
        setUploadStatuses((prev) => {
          const newMap = new Map(prev)
          newMap.set(photoFile.id, {
            ...newMap.get(photoFile.id)!,
            status: 'uploading',
          })
          return newMap
        })

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadStatuses((prev) => {
            const newMap = new Map(prev)
            const current = newMap.get(photoFile.id)
            if (current) {
              newMap.set(photoFile.id, {
                ...current,
                progress: Math.min(current.progress + 10, 90),
              })
            }
            return newMap
          })
        }, 200)

        // Upload to Google Drive
        const result = await uploadPhotoToGoogleDrive({
          file: photoFile.file,
          activityId,
          folderId,
        })

        clearInterval(progressInterval)

        // Update status to success
        setUploadStatuses((prev) => {
          const newMap = new Map(prev)
          newMap.set(photoFile.id, {
            ...newMap.get(photoFile.id)!,
            status: 'success',
            progress: 100,
          })
          return newMap
        })

        // Call success callback
        onUploadSuccess?.(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '上傳失敗'

        // Update status to error
        setUploadStatuses((prev) => {
          const newMap = new Map(prev)
          newMap.set(photoFile.id, {
            ...newMap.get(photoFile.id)!,
            status: 'error',
            error: errorMessage,
          })
          return newMap
        })

        onUploadError?.(errorMessage)
      }
    }

    // Check if all uploads completed
    const allSuccess = Array.from(uploadStatuses.values()).every(
      (status) => status.status === 'success'
    )

    if (allSuccess) {
      // Reset state after successful upload
      setTimeout(() => {
        setSelectedFiles([])
        setUploadStatuses(new Map())
        setIsUploading(false)
      }, 1500)
    } else {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFiles([])
    setUploadStatuses(new Map())
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getUploadStatus = (id: string): UploadStatus | undefined => {
    return uploadStatuses.get(id)
  }

  const uploadedCount = Array.from(uploadStatuses.values()).filter(
    (s) => s.status === 'success'
  ).length

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">📷 上傳照片</h2>
        {selectedFiles.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedFiles.length} / {MAX_PHOTOS} 張照片
          </span>
        )}
      </div>

      {selectedFiles.length === 0 ? (
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
              <p className="text-xs text-gray-500 mt-1">一次最多可選擇 {MAX_PHOTOS} 張照片</p>
            </div>
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>
      ) : (
        /* Preview Grid and Upload */
        <div>
          {/* Overall Progress */}
          {isUploading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                上傳中... {uploadedCount} / {selectedFiles.length}
              </p>
            </div>
          )}

          {/* Preview Grid */}
          <div className="mb-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {selectedFiles.map((photoFile) => {
              const status = getUploadStatus(photoFile.id)
              return (
                <div key={photoFile.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                    <img
                      src={photoFile.previewUrl}
                      alt={photoFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Remove button (only when not uploading) */}
                  {!isUploading && (
                    <button
                      onClick={() => handleRemoveFile(photoFile.id)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="移除"
                    >
                      ×
                    </button>
                  )}

                  {/* Upload Status Overlay */}
                  {status && status.status !== 'pending' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      {status.status === 'uploading' && (
                        <div className="text-white text-xs font-medium">
                          {status.progress}%
                        </div>
                      )}
                      {status.status === 'success' && (
                        <div className="text-green-400 text-2xl">✓</div>
                      )}
                      {status.status === 'error' && (
                        <div className="text-red-400 text-2xl" title={status.error}>
                          ✕
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add more photos button */}
          {!isUploading && selectedFiles.length < MAX_PHOTOS && (
            <div className="mb-4">
              <label
                htmlFor="photo-upload-more"
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg cursor-pointer transition-colors"
              >
                <span className="mr-2">+</span>
                <span>新增更多照片</span>
              </label>
              <input
                id="photo-upload-more"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isUploading ? `上傳中 (${uploadedCount}/${selectedFiles.length})` : `上傳 ${selectedFiles.length} 張照片`}
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
