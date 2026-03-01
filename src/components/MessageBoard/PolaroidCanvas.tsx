"use client";

/**
 * PolaroidCanvas Component
 * Displays the polaroid-style photo with draggable illustrations overlay
 */

import type { Illustration } from "@/lib/illustrations";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import interact from "interactjs";
import { DraggableIllustration } from "./DraggableIllustration";

interface PolaroidCanvasProps {
  photo: File;
  message: string;
  relation: string;
  locationTime: string;
  messageFontSize: number;
  illustrations: Illustration[];
  selectedId: string | null;
  onSelectIllustration: (id: string | null) => void;
  onUpdateIllustration: (id: string, updates: Partial<Illustration>) => void;
  onDeleteIllustration: (id: string) => void;
}

export const PolaroidCanvas = forwardRef<HTMLDivElement, PolaroidCanvasProps>(
  function PolaroidCanvas(
    {
      photo,
      message,
      relation,
      locationTime,
      messageFontSize,
      illustrations,
      selectedId,
      onSelectIllustration,
      onUpdateIllustration,
      onDeleteIllustration,
    },
    ref,
  ) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoAspectRatio, setPhotoAspectRatio] = useState<number>(4 / 3);
    const [cardSize, setCardSize] = useState({
      width: 300,
      height: 400,
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

    // Track card size for illustrations positioning
    // Use contentRect to get content-box size (excludes padding)
    // Illustrations Layer is positioned to match content area
    useEffect(() => {
      const card = cardRef.current;
      if (!card) return;

      const observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setCardSize({ width, height });
      });

      observer.observe(card);
      return () => observer.disconnect();
    }, []);

    const getSmallFontSize = (text: string) => {
      const containerWidth = cardSize.width;
      const len = text.length;
      const baseSize = Math.min(18, containerWidth * 0.045);
      const fitWidthSize = (containerWidth * 0.5) / (len * 0.6);
      return Math.max(28, Math.min(baseSize, fitWidthSize));
    };

    const handleBackgroundClick = useCallback(() => {
      onSelectIllustration(null);
    }, [onSelectIllustration]);

    // Use refs to access latest values in interact.js callbacks
    const selectedIdRef = useRef(selectedId);
    const illustrationsRef = useRef(illustrations);
    const onUpdateIllustrationRef = useRef(onUpdateIllustration);

    useEffect(() => {
      selectedIdRef.current = selectedId;
      illustrationsRef.current = illustrations;
      onUpdateIllustrationRef.current = onUpdateIllustration;
    });

    // Setup pinch-to-zoom on card for selected illustration
    useEffect(() => {
      const card = cardRef.current;
      if (!card) return;

      const interactable = interact(card).gesturable({
        listeners: {
          start(event) {
            // Only prevent default if we have a selected illustration
            if (selectedIdRef.current) {
              event.preventDefault();
            }
          },
          move(event) {
            const currentSelectedId = selectedIdRef.current;
            if (!currentSelectedId) return;

            // Prevent browser zoom
            event.preventDefault();

            // Find the selected illustration
            const selectedIllust = illustrationsRef.current.find(
              (ill) => ill.id === currentSelectedId,
            );
            if (!selectedIllust) return;

            // Update scale and rotation
            onUpdateIllustrationRef.current(currentSelectedId, {
              scale: Math.max(
                0.3,
                Math.min(3, selectedIllust.scale * (1 + event.ds)),
              ),
              rotation: selectedIllust.rotation + event.da,
            });
          },
        },
      });

      return () => {
        interactable.unset();
      };
    }, []);

    // Merge refs (forwardRef + internal cardRef)
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref],
    );

    return (
      <div
        ref={setRefs}
        onClick={handleBackgroundClick}
        className={`relative bg-white overflow-hidden flex flex-col ${selectedId ? "touch-none" : ""}`}
        style={{
          padding: "26px 20px 16px 20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Photo Area */}
        <div
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
        </div>

        {/* Text Area - auto height */}
        <div
          style={{ marginTop: 12, display: "flex", flexDirection: "column" }}
        >
          {/* Message */}
          {message && (
            <p
              className="text-text-main leading-snug wrap-break-word"
              style={{
                fontFamily: "ChenYuluoyan, sans-serif",
                fontSize: `${messageFontSize}rem`,
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

        {/* Illustrations Layer - aligned with content area (matches contentRect) */}
        <div
          className="absolute"
          style={{
            pointerEvents: "none",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {illustrations.map((illust) => (
            <DraggableIllustration
              key={illust.id}
              illustration={illust}
              isSelected={selectedId === illust.id}
              containerSize={cardSize}
              onSelect={() => onSelectIllustration(illust.id)}
              onUpdate={(updates) => onUpdateIllustration(illust.id, updates)}
              onDelete={() => onDeleteIllustration(illust.id)}
            />
          ))}
        </div>
      </div>
    );
  },
);
