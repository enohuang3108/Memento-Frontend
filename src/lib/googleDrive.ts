/**
 * Google Drive Integration via Backend
 *
 * Uploads photos through Cloudflare Workers backend which uses Service Account.
 *
 * Architecture:
 * - Participants don't need Google accounts
 * - Photos uploaded via backend API to organizer's Drive folder
 * - Backend uses Service Account for authentication
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787'

export interface UploadPhotoOptions {
  file: File
  activityId: string
  folderId?: string
}

export interface UploadPhotoResult {
  driveFileId: string
  thumbnailUrl: string
  fullUrl: string
  width?: number
  height?: number
}

/**
 * Compress image to max width/height
 */
async function compressImage(file: File, maxSize: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          0.9
        )
      }

      img.onerror = (e) => {
        console.error('[googleDrive] Failed to load image for compression:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: e,
          errorType: typeof e === 'object' && e !== null && 'type' in e ? (e as Event).type : 'unknown'
        })
        reject(new Error('Failed to load image'))
      }
      img.src = e.target?.result as string
    }

    reader.onerror = (e) => {
      console.error('[googleDrive] Failed to read file for compression:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: e,
        errorType: typeof e === 'object' && e !== null && 'type' in e ? (e as Event).type : 'unknown'
      })
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = (e) => {
        console.error('[googleDrive] Failed to load image for dimensions:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: e,
          errorType: typeof e === 'object' && e !== null && 'type' in e ? (e as Event).type : 'unknown'
        })
        reject(new Error('Failed to load image'))
      }
      img.src = e.target?.result as string
    }

    reader.onerror = (e) => {
      console.error('[googleDrive] Failed to read file for dimensions:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: e,
        errorType: typeof e === 'object' && e !== null && 'type' in e ? (e as Event).type : 'unknown'
      })
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Upload photo to Google Drive via backend API
 *
 * @param options Upload options including file and folder ID
 * @returns Photo metadata including Drive file ID and URLs
 */
export async function uploadPhotoToGoogleDrive(
  options: UploadPhotoOptions
): Promise<UploadPhotoResult> {
  const { file, activityId, folderId } = options

  if (!activityId) {
    throw new Error('Activity ID is required for photo upload')
  }

  if (!folderId) {
    throw new Error('Folder ID is required for photo upload')
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('只能上傳圖片檔案')
  }

  // Validate file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('圖片檔案不得超過 20MB')
  }

  try {
    // Get original dimensions
    const dimensions = await getImageDimensions(file)

    // Compress image
    const compressedFile = await compressImage(file)

    // Upload via backend
    const formData = new FormData()
    formData.append('file', compressedFile)
    formData.append('activityId', activityId)
    formData.append('folderId', folderId)
    formData.append('width', dimensions.width.toString())
    formData.append('height', dimensions.height.toString())

    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '照片上傳失敗')
    }

    const result = (await response.json()) as UploadPhotoResult
    return result
  } catch (error) {
    console.error('Upload error:', error)
    throw error instanceof Error ? error : new Error('照片上傳失敗')
  }
}

/**
 * Validate photo file
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '只能上傳圖片檔案' }
  }

  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: '圖片檔案不得超過 20MB' }
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: '只支援 JPEG, PNG, GIF, WebP 格式' }
  }

  return { valid: true }
}
