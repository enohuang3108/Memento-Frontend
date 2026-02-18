"use client";

/**
 * PhotoSourcePicker Component
 * Allows user to choose between camera capture or photo library
 */

import { useRef, type ChangeEvent } from "react";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface PhotoSourcePickerProps {
  onSelect: (file: File) => void;
  onError: (error: string) => void;
}

function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      onError(validation.error || "檔案驗證失敗");
      return;
    }

    onSelect(file);

    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

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
        支援 JPEG, PNG, GIF, WebP（最大 20MB）
      </p>
    </div>
  );
}
