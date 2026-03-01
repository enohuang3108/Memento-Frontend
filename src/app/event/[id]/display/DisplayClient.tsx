"use client";

import type DanmakuType from "danmaku";
import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";

const DANMAKU_COLORS = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];

// 貼圖 ID 到 SVG 的映射
const STICKER_TO_SVG: Record<string, string> = {
  "sticker:1": "/assets/danmaku-icons/1.svg",
  "sticker:2": "/assets/danmaku-icons/2.svg",
  "sticker:3": "/assets/danmaku-icons/3.svg",
  "sticker:4": "/assets/danmaku-icons/4.svg",
  "sticker:5": "/assets/danmaku-icons/5.svg",
};

function getRandomDanmakuColor(): string {
  return DANMAKU_COLORS[Math.floor(Math.random() * DANMAKU_COLORS.length)];
}

interface Photo {
  id: string;
  fullUrl: string;
  thumbnailUrl: string;
}

function generateSessionId() {
  return `display-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface DisplayClientProps {
  activityId: string;
}

export function DisplayClient({ activityId }: DisplayClientProps) {
  const [sessionId] = useState(() => generateSessionId());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connected, setConnected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const danmakuRef = useRef<DanmakuType | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingPhotosRef = useRef<Photo[]>([]);
  const playedPhotoIdsRef = useRef<Set<string>>(new Set());
  const isPlayingPendingRef = useRef(false);

  // Initialize danmaku (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!containerRef.current) return;

    let instance: DanmakuType | null = null;

    import("danmaku").then((mod) => {
      const Danmaku = mod.default;
      if (containerRef.current) {
        instance = new Danmaku({
          container: containerRef.current,
          speed: 144,
        });
        danmakuRef.current = instance;
      }
    });

    return () => {
      instance?.destroy();
      danmakuRef.current = null;
    };
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}/events/${activityId}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", sessionId, role: "display" }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      switch (msg.type) {
        case "joined":
          setConnected(true);
          if (msg.photos) {
            setPhotos(msg.photos);
          }
          break;

        case "photo_added":
          setPhotos((prev) => [...prev, msg.photo]);
          pendingPhotosRef.current.push(msg.photo);
          break;

        case "photos_synced":
          if (msg.photos) {
            setPhotos(msg.photos);
          }
          break;

        case "danmaku":
          if (danmakuRef.current) {
            try {
              const svgPath = STICKER_TO_SVG[msg.content];

              if (svgPath) {
                // SVG 圖示彈幕
                const img = document.createElement("img");
                img.src = svgPath;
                img.style.height = "80px";
                img.style.width = "auto";
                img.style.filter = "drop-shadow(3px 3px 4px rgba(0,0,0,0.3))";
                danmakuRef.current.emit({ render: () => img });
              } else {
                // 文字彈幕
                const color = getRandomDanmakuColor();
                danmakuRef.current.emit({
                  text: msg.content,
                  style: {
                    color,
                    fontSize: "48px",
                    fontFamily: "'LINE Seed TW', sans-serif",
                    fontWeight: "bold",
                    textShadow: `
                      -2px -2px 0 #fff, 2px -2px 0 #fff,
                      -2px 2px 0 #fff, 2px 2px 0 #fff,
                      0 -2px 0 #fff, 0 2px 0 #fff,
                      -2px 0 0 #fff, 2px 0 0 #fff,
                      3px 3px 8px rgba(0,0,0,0.3)
                    `,
                  },
                });
              }
            } catch (err) {
              console.warn("Danmaku emit failed:", err);
            }
          }
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [activityId, sessionId]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  // Photo slideshow with priority queue
  useEffect(() => {
    if (photos.length === 0) return;

    const timer = setInterval(() => {
      if (pendingPhotosRef.current.length > 0) {
        // Play pending photo (new upload)
        isPlayingPendingRef.current = true;
        const nextPhoto = pendingPhotosRef.current.shift()!;
        const photoIndex = photos.findIndex((p) => p.id === nextPhoto.id);
        if (photoIndex !== -1) {
          setCurrentIndex(photoIndex);
          playedPhotoIdsRef.current.add(nextPhoto.id);
        }
      } else {
        // Random playback without repeat
        isPlayingPendingRef.current = false;

        // Get unplayed photos
        const unplayedPhotos = photos.filter(
          (p) => !playedPhotoIdsRef.current.has(p.id),
        );

        // If all photos have been played, reset the played set
        if (unplayedPhotos.length === 0) {
          playedPhotoIdsRef.current.clear();
          // Keep current photo as played to avoid immediate repeat
          const currentPhoto = photos[currentIndex];
          if (currentPhoto) {
            playedPhotoIdsRef.current.add(currentPhoto.id);
          }
          // Select from all photos except current
          const availablePhotos = photos.filter(
            (p) => !playedPhotoIdsRef.current.has(p.id),
          );
          if (availablePhotos.length > 0) {
            const randomPhoto =
              availablePhotos[
                Math.floor(Math.random() * availablePhotos.length)
              ];
            const nextIndex = photos.findIndex((p) => p.id === randomPhoto.id);
            playedPhotoIdsRef.current.add(randomPhoto.id);
            setCurrentIndex(nextIndex);
          }
        } else {
          // Select randomly from unplayed photos
          const randomPhoto =
            unplayedPhotos[Math.floor(Math.random() * unplayedPhotos.length)];
          const nextIndex = photos.findIndex((p) => p.id === randomPhoto.id);
          playedPhotoIdsRef.current.add(randomPhoto.id);
          setCurrentIndex(nextIndex);
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [photos, currentIndex]);

  const currentPhoto = photos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black"
    >
      {/* Photo Display */}
      {currentPhoto ? (
        <img
          key={currentPhoto.id}
          src={currentPhoto.fullUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-contain animate-fade-in"
          onError={() => {
            // 照片載入失敗（可能已從 Google Drive 刪除），移除並跳到下一張
            setPhotos((prev) => prev.filter((p) => p.id !== currentPhoto.id));
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-2xl text-zinc-500">等待照片上傳...</p>
        </div>
      )}

      {/* Photo Counter (dev only) */}
      {process.env.NODE_ENV !== "production" && photos.length > 0 && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-black/50 px-3 py-1 text-white">
          {currentIndex + 1} / {photos.length}
        </div>
      )}

      {/* Connection Status */}
      <div
        className={`absolute left-4 bottom-4 rounded-full size-1.5 ${
          connected ? "bg-green-700" : "bg-yellow-700"
        }`}
      ></div>
    </div>
  );
}
