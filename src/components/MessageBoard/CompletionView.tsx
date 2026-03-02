"use client";

/**
 * CompletionView Component
 * Shows the final result with download and upload buttons
 */

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [previewUrl] = useState(() => {
    const url = URL.createObjectURL(composedBlob);
    console.log("[DEBUG] CompletionView - previewUrl 創建:", {
      blobSize: composedBlob.size,
      blobSizeKB: Math.round(composedBlob.size / 1024),
      blobType: composedBlob.type,
      previewUrl: url,
    });
    return url;
  });

  // Trigger confetti only when upload succeeds
  useEffect(() => {
    if (!isUploaded) return;

    const runConfetti = async () => {
      const confettiModule = await import("canvas-confetti");
      const confetti = confettiModule.default;

      var count = 200;
      var defaults = {
        origin: { y: 0.7 },
      };

      function fire(
        particleRatio: number,
        opts: {
          spread: number;
          startVelocity?: number;
          decay?: number;
          scalar?: number;
        },
      ) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    };

    runConfetti();
  }, [isUploaded]);

  const handleDownload = async () => {
    const fileName = `memento-${Date.now()}.jpg`;
    const file = new File([composedBlob], fileName, { type: "image/jpeg" });

    // 嘗試使用 Web Share API（手機可直接儲存到相簿）
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Memento 照片",
        });
        return;
      } catch (error) {
        // 用戶取消分享或發生錯誤，改用傳統下載
        if ((error as Error).name === "AbortError") {
          return; // 用戶取消，不做任何事
        }
      }
    }

    // 傳統下載方式（桌機或不支援 Share API 的裝置）
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = fileName;
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
      {/* Preview */}
      <div className="mb-6 shadow-lg">
        <img
          src={previewUrl}
          alt="成品預覽"
          className="w-full h-auto"
          onLoad={() => console.log("[DEBUG] CompletionView - 預覽圖載入完成")}
          onError={(e) =>
            console.error("[DEBUG] CompletionView - 預覽圖載入失敗:", e)
          }
        />
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
            onClick={() => {
              handleDownload();
              handleUpload();
            }}
            disabled={isUploading}
            className="btn-candy-yellow w-full flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                上傳中...
              </>
            ) : (
              <>下載並上傳</>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={isUploading}
            className="btn-candy w-full"
          >
            僅下載
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
