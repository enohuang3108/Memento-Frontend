"use client";

/**
 * ImageCropper Component
 * Full-screen modal for cropping images with rotation and aspect ratio support
 */

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { X, RotateCw, Check } from "lucide-react";
import { cropImage, type CropArea } from "@/lib/cropImage";
import { DotPatternSubtle } from "@/components/decorations";

// Aspect ratio options
const ASPECT_OPTIONS = [
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
] as const;

interface ImageCropperProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onComplete: (croppedFile: File) => void;
}

export function ImageCropper({
  isOpen,
  imageSrc,
  onClose,
  onComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number>(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspect(4 / 3);
      setCroppedAreaPixels(null);
    }
  }, [isOpen]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedFile = await cropImage(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      onComplete(croppedFile);
    } catch (error) {
      console.error("裁切失敗:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onComplete]);

  const handleAspectChange = useCallback((newAspect: number) => {
    setAspect(newAspect);
    // Reset crop position when aspect changes
    setCrop({ x: 0, y: 0 });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <DotPatternSubtle className="opacity-30" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-foreground relative z-10">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
        >
          <X className="w-6 h-6 text-foreground" />
        </button>

        <h3 className="text-lg font-heading font-bold text-text-main">
          裁切照片
        </h3>

        <button
          onClick={handleConfirm}
          disabled={isProcessing || !croppedAreaPixels}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="flex items-center justify-center gap-2 p-3 border-b border-foreground/20 relative z-10">
        {ASPECT_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => handleAspectChange(option.value)}
            disabled={isProcessing}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${
                aspect === option.value
                  ? "bg-accent text-white"
                  : "bg-white border border-foreground/30 text-foreground hover:bg-muted/50"
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative z-10">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          showGrid={true}
          style={{
            containerStyle: {
              backgroundColor: "#1e293b",
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-4 border-t-2 border-foreground relative z-10">
        <div className="flex items-center justify-center gap-4">
          {/* Rotate Button */}
          <button
            onClick={handleRotate}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            style={{ boxShadow: "2px 2px 0px 0px #1e293b" }}
          >
            <RotateCw className="w-5 h-5" />
            <span className="font-medium">旋轉</span>
          </button>

          {/* Zoom Slider */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">縮放</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={isProcessing}
              className="w-24 accent-accent"
            />
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-3">
          拖曳調整位置，雙指縮放或使用滑桿
        </p>
      </div>
    </div>
  );
}

// Button component to trigger the cropper
export function CropPhotoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex-1 px-3 py-1.5 rounded-full bg-white text-foreground text-sm font-medium
        flex items-center justify-center
        hover:bg-muted/50 transition-colors
        border-2 border-foreground
      "
      style={{ boxShadow: "2px 2px 0px 0px #1e293b" }}
    >
      裁切照片
    </button>
  );
}
