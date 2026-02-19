"use client";

/**
 * IllustrationGrid Component
 * Grid of available illustrations to add
 */

import { ILLUSTRATION_LIST } from "@/lib/illustrations";

interface IllustrationGridProps {
  selectedColor: string;
  onSelect: (src: string) => void;
}

// Check if color is white or near-white
const isWhiteColor = (color: string): boolean => {
  const lowerColor = color.toLowerCase();
  if (lowerColor === "#fff" || lowerColor === "#ffffff" || lowerColor === "white") {
    return true;
  }
  // Check for very light colors (e.g., #f0f0f0 and above)
  if (lowerColor.startsWith("#") && lowerColor.length === 7) {
    const r = parseInt(lowerColor.slice(1, 3), 16);
    const g = parseInt(lowerColor.slice(3, 5), 16);
    const b = parseInt(lowerColor.slice(5, 7), 16);
    return r > 240 && g > 240 && b > 240;
  }
  return false;
};

export function IllustrationGrid({
  selectedColor,
  onSelect,
}: IllustrationGridProps) {
  const needsDarkBackground = isWhiteColor(selectedColor);

  return (
    <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
      {ILLUSTRATION_LIST.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.src)}
          className={`
            w-16 h-16 p-2 rounded-xl border-2 border-border
            hover:border-accent hover:shadow-md transition-all
            flex items-center justify-center
            ${needsDarkBackground ? "bg-gray-300" : "bg-white"}
          `}
          style={{ boxShadow: "2px 2px 0px 0px #e2e8f0" }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: selectedColor,
              maskImage: `url(${item.src})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${item.src})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
            role="img"
            aria-label={item.name}
          />
        </button>
      ))}
    </div>
  );
}
