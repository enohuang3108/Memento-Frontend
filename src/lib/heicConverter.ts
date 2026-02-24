/**
 * HEIC/HEIF to JPEG Converter
 * Uses heic-to library (libheif 1.21.2) for browser-side conversion
 */

import { heicTo, isHeic } from "heic-to";

/**
 * Check if a file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  // Check MIME type
  const mimeType = file.type.toLowerCase();
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return true;
  }

  // Fallback: check file extension (some browsers don't set correct MIME type)
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "heic" || extension === "heif";
}

/**
 * Convert HEIC/HEIF file to JPEG
 * @returns Converted JPEG File, or original file if not HEIC/HEIF
 */
export async function convertHeic(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  // Double-check with library's detection
  const confirmedHeic = await isHeic(file);
  if (!confirmedHeic) {
    return file;
  }

  try {
    const jpegBlob = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.9,
    });

    // Create new File with .jpg extension
    const baseName = file.name.replace(/\.(heic|heif)$/i, "");
    const newFileName = `${baseName}.jpg`;

    return new File([jpegBlob], newFileName, { type: "image/jpeg" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HEIC 轉換失敗";
    throw new Error(`無法轉換 HEIC 檔案: ${message}`);
  }
}
