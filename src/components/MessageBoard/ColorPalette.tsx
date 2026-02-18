"use client";

/**
 * ColorPalette Component
 * A row of color swatches for selecting illustration color
 */

import { COLOR_PALETTE } from "@/lib/illustrations";

interface ColorPaletteProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPalette({ selectedColor, onSelect }: ColorPaletteProps) {
  return (
    <div className="flex gap-2 justify-center">
      {COLOR_PALETTE.map((color) => {
        const isSelected = selectedColor === color;
        const isWhite = color === "#ffffff";
        return (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className={`
              w-8 h-8 rounded-full transition-transform
              ${isSelected ? "scale-125 ring-2 ring-offset-2 ring-accent" : "hover:scale-110"}
              ${isWhite ? "border-2 border-gray-300" : ""}
            `}
            style={{ backgroundColor: color }}
            aria-label={`選擇顏色 ${color}`}
          />
        );
      })}
    </div>
  );
}
