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

export function IllustrationGrid({
  selectedColor,
  onSelect,
}: IllustrationGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
      {ILLUSTRATION_LIST.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.src)}
          className="
            w-16 h-16 p-2 rounded-xl bg-white border-2 border-border
            hover:border-accent hover:shadow-md transition-all
            flex items-center justify-center
          "
          style={{ boxShadow: "2px 2px 0px 0px #e2e8f0" }}
        >
          <img
            src={item.src}
            alt={item.name}
            className="w-full h-full object-contain"
            style={{ filter: `drop-shadow(0 0 0 ${selectedColor})` }}
          />
        </button>
      ))}
    </div>
  );
}
