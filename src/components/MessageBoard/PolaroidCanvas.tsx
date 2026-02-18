"use client";

/**
 * PolaroidCanvas Component
 * Displays the polaroid-style photo with draggable illustrations overlay
 */

import type { Illustration } from "@/lib/illustrations";
import { useCallback, useEffect, useRef, useState } from "react";
import { DraggableIllustration } from "./DraggableIllustration";

interface PolaroidCanvasProps {
  photo: File;
  message: string;
  relation: string;
  locationTime: string;
  illustrations: Illustration[];
  selectedId: string | null;
  onSelectIllustration: (id: string | null) => void;
  onUpdateIllustration: (id: string, updates: Partial<Illustration>) => void;
  onDeleteIllustration: (id: string) => void;
}

const PADDING = "4%";

export function PolaroidCanvas({
  photo,
  message,
  relation,
  locationTime,
  illustrations,
  selectedId,
  onSelectIllustration,
  onUpdateIllustration,
  onDeleteIllustration,
}: PolaroidCanvasProps) {
  const photoAreaRef = useRef<HTMLDivElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoAspectRatio, setPhotoAspectRatio] = useState<number>(4 / 3);
  const [photoAreaSize, setPhotoAreaSize] = useState({
    width: 300,
    height: 300,
  });

  // Load photo and get dimensions
  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);

    const img = new Image();
    img.onload = () => {
      setPhotoAspectRatio(img.width / img.height);
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Track photo area size
  useEffect(() => {
    const photoArea = photoAreaRef.current;
    if (!photoArea) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setPhotoAreaSize({ width, height });
    });

    observer.observe(photoArea);
    return () => observer.disconnect();
  }, []);

  // Calculate responsive font sizes based on text length and container width
  const getMessageFontSize = (text: string) => {
    const containerWidth = photoAreaSize.width;
    const len = text.length;
    const baseSize = Math.min(32, containerWidth * 0.3);
    const fitWidthSize = (containerWidth * 0.9) / (len * 0.6);
    return Math.max(22, Math.min(baseSize, fitWidthSize));
  };

  const getSmallFontSize = (text: string) => {
    const containerWidth = photoAreaSize.width;
    const len = text.length;
    const baseSize = Math.min(18, containerWidth * 0.045);
    const fitWidthSize = (containerWidth * 0.5) / (len * 0.6);
    return Math.max(20, Math.min(baseSize, fitWidthSize));
  };

  const handleBackgroundClick = useCallback(() => {
    onSelectIllustration(null);
  }, [onSelectIllustration]);

  return (
    <div
      onClick={handleBackgroundClick}
      className="bg-white rounded-md overflow-hidden flex flex-col"
      style={{
        padding: "26px 16px 16px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Photo Area */}
      <div
        ref={photoAreaRef}
        className="relative overflow-hidden w-full"
        style={{ aspectRatio: photoAspectRatio }}
      >
        {photoUrl && (
          <img
            src={photoUrl}
            alt="照片"
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}

        {/* Illustrations Layer */}
        <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
          {illustrations.map((illust) => (
            <DraggableIllustration
              key={illust.id}
              illustration={illust}
              isSelected={selectedId === illust.id}
              containerSize={photoAreaSize}
              onSelect={() => onSelectIllustration(illust.id)}
              onUpdate={(updates) => onUpdateIllustration(illust.id, updates)}
              onDelete={() => onDeleteIllustration(illust.id)}
            />
          ))}
        </div>
      </div>

      {/* Text Area - auto height */}
      <div className="pt-3 flex flex-col">
        {/* Message */}
        {message && (
          <p
            className="text-text-main leading-snug"
            style={{
              fontFamily: "ChenYuluoyan, sans-serif",
              fontSize: `${getMessageFontSize(message)}px`,
            }}
          >
            「{message}」
          </p>
        )}

        {/* Relation & Location */}
        <div
          className="text-right"
          style={{ fontFamily: "ChenYuluoyan, sans-serif" }}
        >
          {relation && (
            <p
              className="text-text-main opacity-85"
              style={{ fontSize: `${getSmallFontSize(relation)}px` }}
            >
              ─ {relation}
            </p>
          )}
          {locationTime && (
            <p
              className="text-text-muted"
              style={{ fontSize: `${getSmallFontSize(locationTime)}px` }}
            >
              {locationTime}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
