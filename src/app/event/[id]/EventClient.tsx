"use client";

/**
 * Event/Activity Page - Participant View (Client Component)
 * Participants can upload photos and send danmaku messages
 * Playful Geometric Design System
 */

import { DanmakuInput } from "@/components/DanmakuInput";
import { InfoDrawer } from "@/components/InfoDrawer";
import { Logo } from "@/components/Logo";
import { PhotoUpload } from "@/components/PhotoUpload";
import { GeometricBackground } from "@/components/decorations";
import type { EventData } from "@/lib/api";
import { convertHeic, isHeicFile } from "@/lib/heicConverter";
import { storePhoto } from "@/lib/photoStorage";
import { Camera, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface EventClientProps {
  activityId: string;
  initialEvent: EventData | null;
}

export function EventClient({ activityId, initialEvent }: EventClientProps) {
  const router = useRouter();

  const [sessionId] = useState(() => generateSessionId());
  const [isLoading, setIsLoading] = useState(!initialEvent);
  const [error, setError] = useState<string | null>(
    initialEvent ? null : "找不到此活動",
  );
  const [event, setEvent] = useState<EventData | null>(initialEvent);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConvertingHeic, setIsConvertingHeic] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isPhotoUploadExpanded, setIsPhotoUploadExpanded] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch event data
  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/events/${activityId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("找不到此活動");
        } else {
          setError("載入活動失敗");
        }
        return null;
      }
      const data = await res.json();
      setEvent(data.event);
      setError(null);
      return data.event;
    } catch {
      setError("網路錯誤");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}/events/${activityId}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", sessionId, role: "participant" }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "joined") {
        setIsConnected(true);
        // Update title from joined message if available
        if (msg.title) {
          setEvent((prev) => (prev ? { ...prev, title: msg.title } : prev));
        }
      }
      if (msg.type === "activity_ended") {
        fetchEvent();
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [activityId, sessionId, fetchEvent]);

  useEffect(() => {
    if (!initialEvent) {
      fetchEvent();
    }
    connectWebSocket();

    // Refetch every 30s to check if event is still active
    const interval = setInterval(fetchEvent, 30000);

    return () => {
      wsRef.current?.close();
      clearInterval(interval);
    };
  }, [fetchEvent, connectWebSocket, initialEvent]);

  const handleUploadSuccess = useCallback(
    (photoData: {
      driveFileId: string;
      thumbnailUrl: string;
      fullUrl: string;
      width?: number;
      height?: number;
    }) => {
      // Send photo_added message via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "photo_added",
            ...photoData,
          }),
        );
      }
      // Refetch to update photoCount
      fetchEvent();
    },
    [fetchEvent],
  );

  const handleDanmakuSend = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "danmaku",
          content,
        }),
      );
    }
  }, []);

  // Message Board handler - select photo and navigate to edit page
  const handleMessageBoardFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const originalFile = e.target.files?.[0];
      if (!originalFile) return;

      // Reset input for re-selection
      e.target.value = "";

      try {
        // Convert HEIC/HEIF to PNG if needed
        let file = originalFile;
        if (isHeicFile(originalFile)) {
          setIsConvertingHeic(true);
          file = await convertHeic(originalFile);
          setIsConvertingHeic(false);
        }

        // Show loading while storing file
        setIsPreparingPhoto(true);

        // Store file in IndexedDB and navigate to message-board page
        await storePhoto(file);
        router.push(`/event/${activityId}/message-board`);
      } catch (err) {
        setIsConvertingHeic(false);
        setIsPreparingPhoto(false);
        const message = err instanceof Error ? err.message : "照片處理失敗";
        setUploadError(message);
      }
    },
    [activityId, router],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <GeometricBackground variant="minimal" />
        <div className="text-center relative z-10">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-text-muted font-heading font-bold">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <Logo />
        <GeometricBackground variant="minimal" />
        <div className="text-center relative z-10 max-w-md mx-auto px-4">
          <div className="card-sticker p-8">
            <div className="text-6xl mb-4">😢</div>
            <h1 className="text-2xl font-heading font-bold text-text-main mb-2">
              找不到活動
            </h1>
            <p className="text-text-muted mb-6">
              {error || "此活動可能已結束或不存在"}
            </p>
            <a href="/" className="btn-candy inline-block">
              返回首頁
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-8 relative overflow-hidden">
      {/* Decorative Background */}
      <GeometricBackground variant="default" />

      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        {/* Enhanced Header */}
        <div className="mb-8 text-center animate-pop-in">
          <h1 className="text-3xl font-heading font-bold text-text-main mb-3 tracking-tight">
            {event.title || "活動照片牆"}
          </h1>

          {event.status !== "active" && (
            <div
              className="mt-4 p-4 bg-muted border-2 border-border rounded-2xl text-center"
              style={{ boxShadow: "4px 4px 0px 0px #E2E8F0" }}
            >
              <p className="text-text-muted font-bold text-sm">
                此活動已結束，點擊下方「活動資訊」查看詳情
              </p>
            </div>
          )}
        </div>

        {/* Primary Actions - Messages */}
        {event.status === "active" && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: "0.1s" }}
          >
            <DanmakuInput onSend={handleDanmakuSend} disabled={!isConnected} />
          </div>
        )}

        {/* Message Board - Compact horizontal card */}
        {event.status === "active" && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: "0.3s" }}
          >
            {isConvertingHeic || isPreparingPhoto ? (
              <div className="card-sticker p-5 flex items-center gap-4">
                <div className="shrink-0 w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-heading font-bold text-text-main">
                    {isConvertingHeic ? "正在處理照片..." : "準備中..."}
                  </h2>
                  <p className="text-sm text-text-muted">
                    {isConvertingHeic
                      ? "HEIC 照片需要轉換格式，請稍候"
                      : "即將開啟編輯器"}
                  </p>
                </div>
              </div>
            ) : (
              <label
                htmlFor="message-board-photo"
                className="card-sticker p-5 flex items-center gap-4 cursor-pointer hover:bg-pink-50/50 transition-all group"
              >
                <div className="shrink-0 w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img
                    src="/assets/icons/message.svg"
                    alt="回憶便利貼"
                    className="w-10 h-10"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-heading font-bold text-text-main">
                    回憶便利貼
                  </h2>
                  <p className="text-sm text-text-muted">
                    分享一張照片並留下一段訊息
                  </p>
                </div>
                <div className="shrink-0 text-pink-400 group-hover:translate-x-1 transition-transform">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <input
                  id="message-board-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMessageBoardFileSelect}
                />
              </label>
            )}
          </div>
        )}
        {/* Photo Upload - Collapsible */}
        {event.status === "active" && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Collapsed trigger button */}
            <button
              type="button"
              onClick={() => setIsPhotoUploadExpanded(!isPhotoUploadExpanded)}
              className="w-full card-sticker p-5 flex items-center gap-4 cursor-pointer hover:bg-blue-50/50 transition-all group"
            >
              <div className="shrink-0 w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <img
                    src="/assets/icons/photos.svg"
                    alt="上傳照片"
                    className="w-10 h-10"
                  />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-base font-heading font-bold text-text-main">
                  上傳照片
                </h2>
                <p className="text-xs text-text-muted">一次上傳多張照片，最多 50 張</p>
              </div>
              <div className="shrink-0 text-blue-400 transition-transform">
                {isPhotoUploadExpanded ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </div>
            </button>

            {/* Expandable PhotoUpload area */}
            <AnimatePresence>
              {isPhotoUploadExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <PhotoUpload
                      activityId={activityId}
                      sessionId={sessionId}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={(error) => setUploadError(error)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border-2 border-red-400 rounded-xl animate-wiggle">
                <p className="text-sm text-red-600 text-center font-bold">
                  {uploadError}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Drawer - Shows all event details */}
      <InfoDrawer
        activityId={activityId}
        event={{
          title: event.title,
          participantCount: event.participantCount,
          photoCount: event.photoCount,
          status: event.status,
        }}
        isConnected={isConnected}
      />
    </div>
  );
}
