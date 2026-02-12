"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ParticipantPage() {
  const params = useParams();
  const activityId = params.id as string;

  const [sessionId] = useState(() => generateSessionId());
  const [connected, setConnected] = useState(false);
  const [danmakuText, setDanmakuText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}/events/${activityId}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", sessionId, role: "participant" }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "joined") {
        setConnected(true);
        setMessage("已連線");
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setMessage("連線中斷，3 秒後重連...");
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("上傳中...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("activityId", activityId);
      formData.append("sessionId", sessionId);

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("上傳成功");
      } else {
        const error = await res.json();
        setMessage(`上傳失敗: ${error.message || "未知錯誤"}`);
      }
    } catch {
      setMessage("上傳失敗: 網路錯誤");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendDanmaku = () => {
    if (!danmakuText.trim() || !wsRef.current || !connected) return;

    wsRef.current.send(
      JSON.stringify({
        type: "danmaku",
        content: danmakuText.trim(),
        sessionId,
      })
    );

    setDanmakuText("");
    setMessage("彈幕已發送");
  };

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-zinc-900 p-4 pt-12">
      <h1 className="text-2xl font-bold text-white">參與活動</h1>
      <p className="text-zinc-400">活動 ID: {activityId}</p>

      <div
        className={`rounded-full px-3 py-1 text-sm ${
          connected
            ? "bg-green-900/50 text-green-400"
            : "bg-yellow-900/50 text-yellow-400"
        }`}
      >
        {connected ? "已連線" : "連線中..."}
      </div>

      {/* 照片上傳 */}
      <section className="w-full max-w-sm">
        <h2 className="mb-2 text-lg font-medium text-white">上傳照片</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || !connected}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white file:hover:cursor-pointer disabled:opacity-50"
        />
      </section>

      {/* 彈幕發送 */}
      <section className="w-full max-w-sm">
        <h2 className="mb-2 text-lg font-medium text-white">發送彈幕</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={danmakuText}
            onChange={(e) => setDanmakuText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendDanmaku()}
            placeholder="輸入彈幕內容..."
            disabled={!connected}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendDanmaku}
            disabled={!danmakuText.trim() || !connected}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            發送
          </button>
        </div>
      </section>

      {/* 訊息 */}
      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </main>
  );
}
