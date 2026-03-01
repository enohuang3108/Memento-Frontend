"use client";

/**
 * PolaroidEditor Component
 * Main editor combining canvas, illustration picker, and message form
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { PolaroidCanvas } from "./PolaroidCanvas";
import { AddIllustrationButton } from "./IllustrationPicker";
import { CropPhotoButton } from "./ImageCropper";
import { MessageForm } from "./MessageForm";
import { createIllustration, type Illustration } from "@/lib/illustrations";
import { captureCanvas } from "@/lib/captureCanvas";

interface PolaroidEditorProps {
  photo: File;
  message: string;
  relation: string;
  locationTime: string;
  messageFontSize: number;
  illustrations: Illustration[];
  onMessageChange: (value: string) => void;
  onRelationChange: (value: string) => void;
  onLocationTimeChange: (value: string) => void;
  onMessageFontSizeChange: (value: number) => void;
  onIllustrationsChange: (illustrations: Illustration[]) => void;
  onComplete: (blob: Blob) => void;
  isComposing: boolean;
  onOpenPicker: () => void;
  onOpenCropper: () => void;
  pendingIllustration: { src: string; color: string } | null;
  onIllustrationAdded: () => void;
}

export function PolaroidEditor({
  photo,
  message,
  relation,
  locationTime,
  messageFontSize,
  illustrations,
  onMessageChange,
  onRelationChange,
  onLocationTimeChange,
  onMessageFontSizeChange,
  onIllustrationsChange,
  onComplete,
  isComposing,
  onOpenPicker,
  onOpenCropper,
  pendingIllustration,
  onIllustrationAdded,
}: PolaroidEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Process pending illustration when it arrives from external picker
  useEffect(() => {
    if (pendingIllustration) {
      const newIllust = createIllustration(
        pendingIllustration.src,
        pendingIllustration.color,
      );
      onIllustrationsChange([...illustrations, newIllust]);
      setSelectedId(newIllust.id);
      onIllustrationAdded();
    }
  }, [
    pendingIllustration,
    onIllustrationAdded,
    illustrations,
    onIllustrationsChange,
  ]);

  const handleUpdateIllustration = useCallback(
    (id: string, updates: Partial<Illustration>) => {
      onIllustrationsChange(
        illustrations.map((illust) =>
          illust.id === id ? { ...illust, ...updates } : illust,
        ),
      );
    },
    [illustrations, onIllustrationsChange],
  );

  const handleDeleteIllustration = useCallback(
    (id: string) => {
      onIllustrationsChange(illustrations.filter((illust) => illust.id !== id));
      setSelectedId(null);
    },
    [illustrations, onIllustrationsChange],
  );

  const handleComplete = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsCapturing(true);

    // 取消選取狀態以隱藏選取框
    setSelectedId(null);

    // 等待一個 frame 讓 UI 更新
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      const blob = await captureCanvas(canvasRef.current);
      onComplete(blob);
    } catch (error) {
      console.error("截圖失敗:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [onComplete]);

  return (
    <div className="space-y-6">
      {/* Canvas Preview */}
      <PolaroidCanvas
        ref={canvasRef}
        photo={photo}
        message={message}
        relation={relation}
        locationTime={locationTime}
        messageFontSize={messageFontSize}
        illustrations={illustrations}
        selectedId={selectedId}
        onSelectIllustration={setSelectedId}
        onUpdateIllustration={handleUpdateIllustration}
        onDeleteIllustration={handleDeleteIllustration}
      />
      {/* Action Buttons */}
      <div className="flex gap-3">
        <CropPhotoButton onClick={onOpenCropper} />
        <AddIllustrationButton onClick={onOpenPicker} />
      </div>
      {/* Message Form */}
      <MessageForm
        message={message}
        relation={relation}
        locationTime={locationTime}
        messageFontSize={messageFontSize}
        onMessageChange={onMessageChange}
        onRelationChange={onRelationChange}
        onLocationTimeChange={onLocationTimeChange}
        onMessageFontSizeChange={onMessageFontSizeChange}
      />

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={isComposing || isCapturing || !message.trim()}
        className="btn-candy w-full flex items-center justify-center gap-2"
      >
        {isComposing || isCapturing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> 處理中...
          </>
        ) : (
          "完成"
        )}
      </button>
    </div>
  );
}
