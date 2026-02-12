"use client";

import type DanmakuType from "danmaku";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";

interface Photo {
  id: string;
  fullUrl: string;
  thumbnailUrl: string;
}

function generateSessionId() {
  return `display-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function DisplayPage() {
  const params = useParams();
  const activityId = params.id as string;

  const [sessionId] = useState(() => generateSessionId());
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connected, setConnected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const danmakuRef = useRef<DanmakuType | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingPhotosRef = useRef<Photo[]>([]);
  const normalIndexRef = useRef(0);
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
              danmakuRef.current.emit({
                text: msg.content,
                style: {
                  color: "#ffffff",
                  fontSize: "32px",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                },
              });
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
        }
      } else {
        // Normal rotation
        isPlayingPendingRef.current = false;
        if (photos.length > 1) {
          const nextIndex = (normalIndexRef.current + 1) % photos.length;
          normalIndexRef.current = nextIndex;
          setCurrentIndex(nextIndex);
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [photos]);

  // Sync normalIndexRef only during normal playback
  useEffect(() => {
    if (!isPlayingPendingRef.current) {
      normalIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

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
          className="absolute inset-0 h-full w-full object-contain animate-fade-in"
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
