"use client";

/**
 * PolaroidEditor Component
 * Main editor combining canvas, illustration picker, and message form
 */

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PolaroidCanvas } from "./PolaroidCanvas";
import { AddIllustrationButton } from "./IllustrationPicker";
import { MessageForm } from "./MessageForm";
import { createIllustration, type Illustration } from "@/lib/illustrations";

interface PolaroidEditorProps {
  photo: File;
  message: string;
  relation: string;
  locationTime: string;
  onMessageChange: (value: string) => void;
  onRelationChange: (value: string) => void;
  onLocationTimeChange: (value: string) => void;
  onComplete: (illustrations: Illustration[]) => void;
  isComposing: boolean;
  onOpenPicker: () => void;
  pendingIllustration: { src: string; color: string } | null;
  onIllustrationAdded: () => void;
}

export function PolaroidEditor({
  photo,
  message,
  relation,
  locationTime,
  onMessageChange,
  onRelationChange,
  onLocationTimeChange,
  onComplete,
  isComposing,
  onOpenPicker,
  pendingIllustration,
  onIllustrationAdded,
}: PolaroidEditorProps) {
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Process pending illustration when it arrives from external picker
  useEffect(() => {
    if (pendingIllustration) {
      const newIllust = createIllustration(
        pendingIllustration.src,
        pendingIllustration.color,
      );
      setIllustrations((prev) => [...prev, newIllust]);
      setSelectedId(newIllust.id);
      onIllustrationAdded();
    }
  }, [pendingIllustration, onIllustrationAdded]);

  const handleUpdateIllustration = useCallback(
    (id: string, updates: Partial<Illustration>) => {
      setIllustrations((prev) =>
        prev.map((illust) =>
          illust.id === id ? { ...illust, ...updates } : illust,
        ),
      );
    },
    [],
  );

  const handleDeleteIllustration = useCallback((id: string) => {
    setIllustrations((prev) => prev.filter((illust) => illust.id !== id));
    setSelectedId(null);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete(illustrations);
  }, [illustrations, onComplete]);

  return (
    <div className="space-y-6">
      {/* Canvas Preview */}
      <PolaroidCanvas
        photo={photo}
        message={message}
        relation={relation}
        locationTime={locationTime}
        illustrations={illustrations}
        selectedId={selectedId}
        onSelectIllustration={setSelectedId}
        onUpdateIllustration={handleUpdateIllustration}
        onDeleteIllustration={handleDeleteIllustration}
      />
      {/* Add Illustration Button */}
      <div className="flex">
        <AddIllustrationButton onClick={onOpenPicker} />
      </div>
      {/* Message Form */}
      <MessageForm
        message={message}
        relation={relation}
        locationTime={locationTime}
        onMessageChange={onMessageChange}
        onRelationChange={onRelationChange}
        onLocationTimeChange={onLocationTimeChange}
      />

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={isComposing}
        className="btn-candy w-full flex items-center justify-center gap-2"
      >
        {isComposing ? (
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
