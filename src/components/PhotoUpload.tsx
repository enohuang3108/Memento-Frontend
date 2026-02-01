/**
 * PhotoUpload Component
 * Handles multiple photo file selection, preview, compression, and batch upload
 * Playful Geometric Design System
 */

import { useRef, useState, type ChangeEvent } from 'react'
import { uploadPhotoToGoogleDrive, validatePhotoFile } from '../lib/googleDrive'
import { DotPatternSubtle } from './decorations'

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
    <div className="card-sticker p-6 relative overflow-hidden">
      <DotPatternSubtle className="opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold text-text-main flex items-center gap-2">
            <span className="text-2xl">📷</span> 上傳照片
          </h2>
          {selectedFiles.length > 0 && (
            <span className="text-sm font-bold text-text-muted bg-muted px-3 py-1 rounded-full border-2 border-border">
              {selectedFiles.length} / {MAX_PHOTOS} 張
            </span>
          )}
        </div>

        {selectedFiles.length === 0 ? (
          /* File Selector */
          <div>
            <label
              htmlFor="photo-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-3 border-dashed border-accent/50 rounded-2xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <div className="text-6xl mb-4 group-hover:animate-bounce-slight">📸</div>
                <p className="mb-2 text-sm text-text-main font-heading font-bold">
                  點擊選擇照片
                </p>
                <p className="text-xs text-text-muted">JPEG, PNG, GIF, WebP (最大 20MB)</p>
                <p className="text-xs text-text-muted mt-1">一次最多可選擇 {MAX_PHOTOS} 張照片</p>
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
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-400 rounded-xl">
                <p className="text-sm text-red-600 font-bold whitespace-pre-line">{error}</p>
              </div>
            )}
          </div>
        ) : (
          /* Preview Grid and Upload */
          <div>
            {/* Overall Progress */}
            {isUploading && (
              <div className="mb-4 p-3 bg-accent/10 border-2 border-accent rounded-xl">
                <p className="text-sm text-accent font-heading font-bold">
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
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-border">
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
                        className="absolute top-1 right-1 bg-secondary hover:bg-secondary/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold border-2 border-foreground"
                        style={{ boxShadow: '2px 2px 0px 0px #1E293B' }}
                        title="移除"
                      >
                        ×
                      </button>
                    )}

                    {/* Upload Status Overlay */}
                    {status && status.status !== 'pending' && (
                      <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center rounded-xl">
                        {status.status === 'uploading' && (
                          <div className="text-white text-xs font-bold bg-accent px-2 py-1 rounded-full">
                            {status.progress}%
                          </div>
                        )}
                        {status.status === 'success' && (
                          <div className="text-quaternary text-3xl font-bold">✓</div>
                        )}
                        {status.status === 'error' && (
                          <div className="text-secondary text-3xl font-bold" title={status.error}>
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
                  className="inline-flex items-center px-4 py-2 bg-muted hover:bg-border text-text-main font-heading font-bold rounded-full cursor-pointer transition-colors border-2 border-border"
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
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded-xl">
                <p className="text-sm text-red-600 font-bold whitespace-pre-line">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 btn-candy"
              >
                {isUploading ? `上傳中 (${uploadedCount}/${selectedFiles.length})` : `上傳 ${selectedFiles.length} 張照片`}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="px-6 py-3 bg-muted hover:bg-border disabled:bg-muted text-text-main font-heading font-bold rounded-full transition-colors border-2 border-border disabled:opacity-60"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
