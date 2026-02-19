"use client";

/**
 * DraggableIllustration Component
 * A single illustration that can be dragged, resized, and rotated using interact.js
 */

import { useEffect, useRef, useState } from "react";
import interact from "interactjs";
import { X } from "lucide-react";
import type { Illustration } from "@/lib/illustrations";

interface DraggableIllustrationProps {
  illustration: Illustration;
  isSelected: boolean;
  containerSize: { width: number; height: number };
  onSelect: () => void;
  onUpdate: (updates: Partial<Illustration>) => void;
  onDelete: () => void;
}

export function DraggableIllustration({
  illustration,
  isSelected,
  containerSize,
  onSelect,
  onUpdate,
  onDelete,
}: DraggableIllustrationProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [coloredSvg, setColoredSvg] = useState<string | null>(null);

  // Load and colorize SVG
  useEffect(() => {
    let revoked = false;
    let url: string | null = null;

    async function loadSvg() {
      try {
        const response = await fetch(illustration.src);
        let svgText = await response.text();

        // Replace colors
        svgText = svgText.replace(/fill="[^"]*"/g, `fill="${illustration.color}"`);
        svgText = svgText.replace(/stroke="[^"]*"/g, `stroke="${illustration.color}"`);

        const blob = new Blob([svgText], { type: "image/svg+xml" });
        url = URL.createObjectURL(blob);

        if (!revoked) {
          setColoredSvg(url);
        }
      } catch (error) {
        console.error("Failed to load SVG:", error);
      }
    }

    loadSvg();

    return () => {
      revoked = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [illustration.src, illustration.color]);

  // Setup interact.js - use refs to avoid dependency issues
  const illustrationRef = useRef(illustration);
  const containerSizeRef = useRef(containerSize);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    illustrationRef.current = illustration;
    containerSizeRef.current = containerSize;
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const interactable = interact(element)
      .draggable({
        inertia: true,
        listeners: {
          move(event) {
            const ill = illustrationRef.current;
            const size = containerSizeRef.current;
            const deltaX = (event.dx / size.width) * 100;
            const deltaY = (event.dy / size.height) * 100;
            onUpdateRef.current({
              x: Math.max(-20, Math.min(120, ill.x + deltaX)),
              y: Math.max(-20, Math.min(120, ill.y + deltaY)),
            });
          },
        },
      })
      .gesturable({
        listeners: {
          start(event) {
            // Prevent browser zoom when pinch gesture starts on illustration
            event.preventDefault();
          },
          move(event) {
            // Prevent browser zoom during pinch gesture
            event.preventDefault();
            const ill = illustrationRef.current;
            onUpdateRef.current({
              scale: Math.max(0.3, Math.min(3, ill.scale * (1 + event.ds))),
              rotation: ill.rotation + event.da,
            });
          },
        },
      });

    return () => {
      interactable.unset();
    };
  }, []);

  const size = 80 * illustration.scale;
  const left = (illustration.x / 100) * containerSize.width - size / 2;
  const top = (illustration.y / 100) * containerSize.height - size / 2;

  return (
    <div
      ref={elementRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`
        absolute cursor-move touch-none pointer-events-auto
        ${isSelected ? "ring-2 ring-accent ring-dashed rounded-lg" : ""}
      `}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${illustration.rotation}deg)`,
      }}
    >
      {coloredSvg && (
        <img
          src={coloredSvg}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      )}

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="
            absolute -top-3 -right-3
            w-6 h-6 rounded-full bg-red-500 text-white
            flex items-center justify-center
            hover:bg-red-600 transition-colors
            shadow-md
          "
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
