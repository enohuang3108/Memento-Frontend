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
import { DotPatternSubtle } from "@/components/decorations";

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
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-background rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-slide-up border-t-2 border-x-2 border-foreground overflow-hidden"
        style={{ boxShadow: "0px -4px 0px 0px #1E293B" }}
      >
        <DotPatternSubtle className="opacity-30" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-lg font-heading font-bold text-text-main">
            選擇裝飾
          </h3>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <h5 className="text-sm text-text-muted mb-4 relative z-10">
          透過手指拖移、兩指旋轉可調整位置與角度
        </h5>

        {/* Color Palette */}
        <div className="mb-4 relative z-10">
          <p className="text-sm font-heading font-bold text-text-muted mb-2">
            顏色
          </p>
          <ColorPalette
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
          />
        </div>

        {/* Illustration Grid */}
        <div className="relative z-10">
          <p className="text-sm font-heading font-bold text-text-muted mb-2">
            裝飾
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
        flex-1 px-3 py-1.5 rounded-full bg-accent text-white text-sm font-medium
        flex items-center justify-center
        hover:bg-accent/90 transition-colors
        border-2 border-foreground
      "
      style={{ boxShadow: "2px 2px 0px 0px #1e293b" }}
    >
      加點裝飾
    </button>
  );
}
