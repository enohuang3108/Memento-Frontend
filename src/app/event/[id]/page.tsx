"use client";

/**
 * Event/Activity Page - Participant View
 * Participants can upload photos and send danmaku messages
 * Playful Geometric Design System
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GeometricBackground } from "@/components/decorations";
import { DanmakuInput } from "@/components/DanmakuInput";
import { PhotoUpload } from "@/components/PhotoUpload";
import { InfoDrawer } from "@/components/InfoDrawer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface EventData {
  id: string;
  title: string;
  driveFolderId: string;
  status: "active" | "ended";
  participantCount: number;
  photoCount: number;
}

export default function EventPage() {
  const params = useParams();
  const activityId = params.id as string;

  const [sessionId] = useState(() => generateSessionId());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    fetchEvent();
    connectWebSocket();

    // Refetch every 30s to check if event is still active
    const interval = setInterval(fetchEvent, 30000);

    return () => {
      wsRef.current?.close();
      clearInterval(interval);
    };
  }, [fetchEvent, connectWebSocket]);

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
          })
        );
      }
      // Refetch to update photoCount
      fetchEvent();
    },
    [fetchEvent]
  );

  const handleDanmakuSend = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "danmaku",
          content,
        })
      );
    }
  }, []);

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

  // Generate QR code URL for this event
  const participantUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/event/${activityId}`
      : "";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    participantUrl
  )}`;

  return (
    <div className="min-h-screen bg-background pb-24 pt-8 relative overflow-hidden">
      {/* Logo in top-left corner */}
      <Logo />

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

        {/* Primary Actions - Photo Upload */}
        {event.status === "active" && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: "0.2s" }}
          >
            <PhotoUpload
              activityId={activityId}
              sessionId={sessionId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(error) => setUploadError(error)}
            />
            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border-2 border-red-400 rounded-xl animate-wiggle">
                <p className="text-sm text-red-600 text-center font-bold">
                  {uploadError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Message Board Entry */}
        {event.status === "active" && (
          <div
            className="mb-6 animate-pop-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="card-sticker p-6 text-center">
              <p className="text-sm text-text-muted mb-4">
                想要在照片上加上留言和裝飾嗎？
              </p>
              <Link
                href={`/event/${activityId}/message-board`}
                className="btn-candy-pink w-full flex items-center justify-center gap-2"
              >
                <span>🎨</span> 製作留言板
              </Link>
            </div>
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
        qrCodeUrl={qrCodeUrl}
      />
    </div>
  );
}
