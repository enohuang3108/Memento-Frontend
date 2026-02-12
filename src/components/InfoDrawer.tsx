"use client";

/**
 * Info Drawer Component
 * A bottom sheet drawer that displays event information
 * Supports touch gestures and click interactions
 * Playful Geometric Design System
 */

import { useRouter } from "next/navigation";
import { Camera, Check, Copy, QrCode, Users, Wifi, WifiOff } from "lucide-react";
import type { TouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DotPatternSubtle } from "./decorations";

interface InfoDrawerProps {
  activityId: string;
  event: {
    title: string | undefined;
    participantCount: number;
    photoCount: number;
    status: "active" | "ended";
  };
  isConnected: boolean;
  qrCodeUrl: string;
}

type DrawerState = "closed" | "peek" | "open";

export function InfoDrawer({
  activityId,
  event,
  isConnected,
  qrCodeUrl,
}: InfoDrawerProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>("peek");
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // QR code 五連點隱藏入口
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQRCodeClick = useCallback(() => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setClickCount(0);
      router.push(`/event/${activityId}/display`);
    } else {
      clickTimeoutRef.current = setTimeout(() => setClickCount(0), 2000);
    }
  }, [clickCount, activityId, router]);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      setCurrentY(e.touches[0].clientY);
    },
    [isDragging]
  );

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;

    // Determine next state based on drag distance
    if (drawerState === "peek") {
      if (deltaY < -50) {
        setDrawerState("open");
      } else if (deltaY > 50) {
        setDrawerState("closed");
      }
    } else if (drawerState === "open") {
      if (deltaY > 100) {
        setDrawerState("peek");
      }
    } else if (drawerState === "closed") {
      if (deltaY < -50) {
        setDrawerState("peek");
      }
    }
  }, [isDragging, currentY, startY, drawerState]);

  // Handle click on header to toggle
  const handleHeaderClick = useCallback(() => {
    if (drawerState === "peek") {
      setDrawerState("open");
    } else if (drawerState === "open") {
      setDrawerState("peek");
    } else {
      setDrawerState("peek");
    }
  }, [drawerState]);

  // Handle copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    const url = `${window.location.origin}/event/${activityId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (e) {
        console.error("Failed to copy:", e);
      }
      document.body.removeChild(textArea);
    }
  }, [activityId]);

  // Calculate drawer height based on state
  const getDrawerHeight = () => {
    if (drawerState === "closed") return "0px";
    if (drawerState === "peek") return "80px";
    return "70vh";
  };

  // Calculate transform during drag
  const getTransform = () => {
    if (!isDragging) return "translateY(0)";
    const deltaY = currentY - startY;
    const clampedDelta = Math.max(0, deltaY); // Only allow dragging down
    return `translateY(${clampedDelta}px)`;
  };

  return (
    <>
      {/* Backdrop */}
      {drawerState === "open" && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 transition-opacity duration-300"
          onClick={() => setDrawerState("peek")}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 transition-all duration-300 ease-out border-t-2 border-x-2 border-foreground overflow-hidden"
        style={{
          height: getDrawerHeight(),
          transform: getTransform(),
          boxShadow: "0px -4px 0px 0px #1E293B",
        }}
      >
        <DotPatternSubtle className="opacity-30" />

        {/* Drawer Handle */}
        <div
          className="py-3 px-4 cursor-pointer select-none hover:bg-muted/50 transition-colors relative z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleHeaderClick}
        >
          <div className="w-12 h-1.5 bg-foreground/30 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Participants Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border-2 border-accent/30">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-sm font-heading font-bold text-text-main">
                {event.participantCount}
              </span>
            </div>
            {/* Photos Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary/20 rounded-full border-2 border-tertiary/30">
              <Camera className="w-4 h-4 text-tertiary" />
              <span className="text-sm font-heading font-bold text-text-main">
                {event.photoCount}
              </span>
            </div>
            {/* Connection Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 ${
                isConnected
                  ? "bg-quaternary/20 border-quaternary/30 text-quaternary"
                  : "bg-muted border-border text-text-muted"
              }`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">
                {isConnected ? "已連線" : "未連線"}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="overflow-y-auto px-4 pb-6 h-[calc(100%-60px)] relative z-10">
          {/* QR Code Card */}
          <div className="card-sticker-soft p-6 mb-6 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-accent" />
              <p className="text-sm text-text-main font-heading font-bold">
                分享此 QR Code 讓更多人加入
              </p>
            </div>
            <div
              className="inline-block p-4 bg-white rounded-2xl border-2 border-foreground cursor-pointer select-none"
              style={{ boxShadow: "4px 4px 0px 0px #8B5CF6" }}
              onClick={handleQRCodeClick}
            >
              <img
                src={qrCodeUrl}
                alt="Event QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <button
              onClick={handleCopyUrl}
              className="mt-4 w-full group relative overflow-hidden px-4 py-3 rounded-full transition-all border-2 border-border hover:border-accent hover:bg-accent/5"
            >
              <div className="flex items-center justify-center gap-2">
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-quaternary" />
                    <span className="text-sm font-heading font-bold text-quaternary">
                      已複製！
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-accent group-hover:text-primary-hover transition-colors" />
                    <span className="text-sm font-heading font-bold text-text-muted group-hover:text-accent transition-colors">
                      複製連結
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
