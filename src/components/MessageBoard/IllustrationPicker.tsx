"use client";

/**
 * IllustrationPicker Component
 * Modal for selecting illustrations with color picker
 */

import { useState } from "react";
import { X } from "lucide-react";
import { ColorPalette } from "./ColorPalette";
import { IllustrationGrid } from "./IllustrationGrid";
import { DEFAULT_COLOR } from "@/lib/illustrations";

interface IllustrationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (src: string, color: string) => void;
}

export function IllustrationPicker({
  isOpen,
  onClose,
  onAdd,
}: IllustrationPickerProps) {
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);

  if (!isOpen) return null;

  const handleSelect = (src: string) => {
    onAdd(src, selectedColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-bold text-text-main">
            選擇插畫
          </h3>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h5 className="text-sm text-text-muted mb-4">
          透過手指拖移、兩指旋轉可調整插畫位置與角度
        </h5>

        {/* Color Palette */}
        <div className="mb-4">
          <p className="text-sm font-heading font-bold text-text-muted mb-2">
            顏色
          </p>
          <ColorPalette
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
          />
        </div>

        {/* Illustration Grid */}
        <div>
          <p className="text-sm font-heading font-bold text-text-muted mb-2">
            插畫
          </p>
          <IllustrationGrid
            selectedColor={selectedColor}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}

// Add button component to trigger the picker
export function AddIllustrationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium
        flex items-center justify-center
        hover:bg-accent/90 transition-colors
        border-2 border-foreground
      "
      style={{ boxShadow: "2px 2px 0px 0px #1e293b" }}
    >
      添加裝飾
    </button>
  );
}
