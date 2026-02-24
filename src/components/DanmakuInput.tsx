"use client";

/**
 * DanmakuInput Component
 * Input for sending danmaku messages with quick emoji sticker buttons
 * Playful Geometric Design System - SVG icons with hover effects
 */

import { useState, type FormEvent } from "react";

interface DanmakuInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

interface QuickEmoji {
  emoji: string;
  icon: string;
  alt: string;
}

const QUICK_EMOJIS: QuickEmoji[] = [
  { emoji: "sticker:1", icon: "/assets/danmaku-icons/1.svg", alt: "貼圖 1" },
  { emoji: "sticker:2", icon: "/assets/danmaku-icons/2.svg", alt: "貼圖 2" },
  { emoji: "sticker:3", icon: "/assets/danmaku-icons/3.svg", alt: "貼圖 3" },
  { emoji: "sticker:4", icon: "/assets/danmaku-icons/4.svg", alt: "貼圖 4" },
  { emoji: "sticker:5", icon: "/assets/danmaku-icons/5.svg", alt: "貼圖 5" },
];
const EMOJI_COOLDOWN_MS = 1000; // 1秒冷卻時間
const MAX_DANMAKU_LENGTH = 50;

export function DanmakuInput({ onSend, disabled = false }: DanmakuInputProps) {
  const [content, setContent] = useState("");
  const [emojiCooldowns, setEmojiCooldowns] = useState<Record<string, boolean>>(
    {},
  );
  const [pressedEmoji, setPressedEmoji] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendContent(content);
  };

  const sendContent = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setContent("");
  };

  const handleEmojiClick = (emoji: string) => {
    // 如果該 emoji 正在冷卻中，不執行任何操作
    if (emojiCooldowns[emoji]) return;

    // 發送 emoji
    sendContent(emoji);

    // 設置該 emoji 為冷卻狀態
    setEmojiCooldowns((prev) => ({ ...prev, [emoji]: true }));

    // 按壓動畫
    setPressedEmoji(emoji);
    setTimeout(() => setPressedEmoji(null), 150);

    // 1秒後恢復
    setTimeout(() => {
      setEmojiCooldowns((prev) => ({ ...prev, [emoji]: false }));
    }, EMOJI_COOLDOWN_MS);
  };

  return (
    <div className="flex flex-col gap-6 w-full mx-auto py-4">
      {/* Quick Emoji SVG Buttons */}
      <div className="flex gap-2 justify-center">
        {QUICK_EMOJIS.map(({ emoji, icon, alt }) => {
          const isCoolingDown = emojiCooldowns[emoji];
          const isPressed = pressedEmoji === emoji;

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              disabled={disabled || isCoolingDown}
              className={`
                p-1 size-14
                transition-all duration-150 ease-out
                hover:scale-110 hover:-rotate-6
                active:scale-90
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0
                cursor-pointer select-none
                ${isPressed ? "scale-90" : ""}
              `}
            >
              <img
                src={icon}
                alt={alt}
                className="size-full object-contain"
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div
          className="relative bg-white rounded-full border-2 border-foreground transition-all"
          style={{ boxShadow: "4px 4px 0px 0px #1E293B" }}
        >
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="發送彈幕..."
            disabled={disabled}
            maxLength={MAX_DANMAKU_LENGTH}
            className="w-full bg-transparent border-none focus:outline-none text-text-main placeholder:text-text-muted/50 text-lg px-5 py-3 pr-36 rounded-full font-body"
          />
          {content.length > 0 && (
            <span
              className={`absolute right-22 top-1/2 -translate-y-1/2 text-xs font-body transition-colors ${
                content.length >= MAX_DANMAKU_LENGTH
                  ? "text-red-500 font-bold"
                  : content.length >= MAX_DANMAKU_LENGTH - 10
                    ? "text-amber-500"
                    : "text-text-muted/50"
              }`}
            >
              {content.length}/{MAX_DANMAKU_LENGTH}
            </span>
          )}
          <button
            type="submit"
            disabled={disabled || !content.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 font-heading font-bold transition-all whitespace-nowrap px-4 py-1.5 rounded-full
              ${
                disabled || !content.trim()
                  ? "text-text-muted/30 cursor-not-allowed"
                  : "text-white bg-accent hover:bg-primary-hover border-2 border-foreground"
              }`}
            style={
              disabled || !content.trim()
                ? {}
                : { boxShadow: "2px 2px 0px 0px #1E293B" }
            }
          >
            發送
          </button>
        </div>
      </form>
    </div>
  );
}
