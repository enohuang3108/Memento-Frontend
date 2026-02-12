"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

function extractFolderId(input: string): string | null {
  const trimmed = input.trim();

  // If it's already a folder ID (25+ alphanumeric characters)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  // Extract from Google Drive URL
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
  const match = trimmed.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

export default function Home() {
  const [driveUrl, setDriveUrl] = useState("");
  const [activityId, setActivityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateEvent = async () => {
    const folderId = extractFolderId(driveUrl);
    if (!folderId) {
      setError("請輸入有效的 Google Drive 資料夾連結");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFolderId: folderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "建立活動失敗");
        return;
      }

      const data = await res.json();
      const eventId = data.event.id;
      router.push(`/event/${eventId}/display`);
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = (mode: "participant" | "display") => {
    if (!activityId.trim()) return;
    const path =
      mode === "display"
        ? `/event/${activityId}/display`
        : `/event/${activityId}`;
    router.push(path);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-900 p-4">
      <h1 className="text-3xl font-bold text-white">Memento</h1>

      {/* 建立活動 */}
      <section className="w-full max-w-md space-y-3">
        <h2 className="text-lg font-medium text-white">建立活動</h2>
        <input
          type="text"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          placeholder="貼上 Google Drive 資料夾連結"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCreateEvent}
          disabled={!driveUrl.trim() || loading}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "建立中..." : "建立活動並開啟顯示螢幕"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      <div className="flex items-center gap-4 text-zinc-500">
        <div className="h-px w-16 bg-zinc-700" />
        <span>或</span>
        <div className="h-px w-16 bg-zinc-700" />
      </div>

      {/* 加入活動 */}
      <section className="w-full max-w-md space-y-3">
        <h2 className="text-lg font-medium text-white">加入活動</h2>
        <input
          type="text"
          value={activityId}
          onChange={(e) => setActivityId(e.target.value)}
          placeholder="輸入活動 ID"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={() => handleJoinEvent("participant")}
            disabled={!activityId.trim()}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            參與活動
          </button>
          <button
            onClick={() => handleJoinEvent("display")}
            disabled={!activityId.trim()}
            className="flex-1 rounded-lg bg-zinc-700 px-6 py-3 font-medium text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            顯示螢幕
          </button>
        </div>
      </section>
    </main>
  );
}
