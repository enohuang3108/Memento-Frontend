"use client";

/**
 * PhotoSourcePicker Component
 * Allows user to choose between camera capture or photo library
 */

import { useRef, useState, type ChangeEvent } from "react";
import { convertHeicToPng, isHeicFile } from "@/lib/heicConverter";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface PhotoSourcePickerProps {
  onSelect: (file: File) => void;
  onError: (error: string) => void;
}

function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const isAllowedType = ALLOWED_TYPES.includes(file.type) || isHeicFile(file);
  if (!isAllowedType) {
    return { valid: false, error: "不支援的檔案格式" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "檔案大小超過 20MB" };
  }
  return { valid: true };
}

export function PhotoSourcePicker({
  onSelect,
  onError,
}: PhotoSourcePickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    const validation = validatePhotoFile(originalFile);
    if (!validation.valid) {
      onError(validation.error || "檔案驗證失敗");
      return;
    }

    try {
      setIsConverting(true);
      const file = await convertHeicToPng(originalFile);
      onSelect(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "處理失敗";
      onError(message);
    } finally {
      setIsConverting(false);
    }

    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  if (isConverting) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-6 animate-pulse">🔄</div>
        <h2 className="text-xl font-heading font-bold text-text-main mb-6">
          正在處理照片...
        </h2>
        <p className="text-sm text-text-muted">
          HEIC 照片需要轉換格式，請稍候
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">📸</div>
      <h2 className="text-xl font-heading font-bold text-text-main mb-6">
        選擇照片來源
      </h2>

      <div className="flex flex-col gap-4">
        {/* Camera Button */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="btn-candy-pink w-full flex items-center justify-center gap-3"
        >
          <span className="text-xl">📷</span>
          <span>拍照</span>
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Library Button */}
        <button
          onClick={() => libraryInputRef.current?.click()}
          className="btn-candy-yellow w-full flex items-center justify-center gap-3"
        >
          <span className="text-xl">🖼️</span>
          <span>從相簿選擇</span>
        </button>
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <p className="mt-6 text-sm text-text-muted">
        支援 JPEG, PNG, GIF, WebP, HEIC（最大 20MB）
      </p>
    </div>
  );
}
