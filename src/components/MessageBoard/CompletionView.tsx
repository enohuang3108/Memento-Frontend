"use client";

/**
 * CompletionView Component
 * Shows the final result with download and upload buttons
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface CompletionViewProps {
  composedBlob: Blob;
  activityId: string;
  sessionId: string;
  onUploadSuccess: (photoData: {
    driveFileId: string;
    thumbnailUrl: string;
    fullUrl: string;
    width?: number;
    height?: number;
  }) => void;
  onUploadError: (error: string) => void;
  onBackToEdit: () => void;
  onClose: () => void;
}

export function CompletionView({
  composedBlob,
  activityId,
  sessionId,
  onUploadSuccess,
  onUploadError,
  onBackToEdit,
  onClose,
}: CompletionViewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [previewUrl] = useState(() => URL.createObjectURL(composedBlob));

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `memento-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append(
        "file",
        new File([composedBlob], `message-board-${Date.now()}.jpg`, {
          type: "image/jpeg",
        }),
      );
      formData.append("activityId", activityId);
      formData.append("sessionId", sessionId);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "上傳失敗");
      }

      const result = await res.json();
      setIsUploaded(true);
      onUploadSuccess(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "上傳失敗";
      onUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-xl font-heading font-bold text-text-main mb-6">
        {isUploaded ? "上傳成功！" : "完成！"}
      </h2>

      {/* Preview */}
      <div className="mb-6 shadow-lg">
        <img src={previewUrl} alt="成品預覽" className="w-full h-auto" />
      </div>

      {/* Actions */}
      {isUploaded ? (
        <div className="space-y-4">
          <button onClick={handleDownload} className="btn-candy-yellow w-full">
            <span className="mr-2">⬇️</span> 下載照片
          </button>
          <button onClick={onClose} className="btn-candy w-full">
            完成
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleDownload}
            disabled={isUploading}
            className="btn-candy w-full"
          >
            下載照片
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-candy-yellow w-full flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                上傳中...
              </>
            ) : (
              <>上傳到照片牆</>
            )}
          </button>

          <button
            onClick={onBackToEdit}
            disabled={isUploading}
            className="w-full px-6 py-3 bg-muted hover:bg-border text-text-main font-heading font-bold rounded-full transition-colors border-2 border-border"
          >
            返回編輯
          </button>
        </div>
      )}
    </div>
  );
}
