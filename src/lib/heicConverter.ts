/**
 * HEIC/HEIF to PNG Converter
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
 * Convert HEIC/HEIF file to PNG
 * @returns Converted PNG File, or original file if not HEIC/HEIF
 */
export async function convertHeicToPng(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  // Double-check with library's detection
  const confirmedHeic = await isHeic(file);
  if (!confirmedHeic) {
    return file;
  }

  try {
    const pngBlob = await heicTo({
      blob: file,
      type: "image/png",
    });

    // Create new File with .png extension
    const baseName = file.name.replace(/\.(heic|heif)$/i, "");
    const newFileName = `${baseName}.png`;

    return new File([pngBlob], newFileName, { type: "image/png" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HEIC 轉換失敗";
    throw new Error(`無法轉換 HEIC 檔案: ${message}`);
  }
}
