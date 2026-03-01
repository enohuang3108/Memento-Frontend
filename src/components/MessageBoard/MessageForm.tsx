"use client";

/**
 * MessageForm Component
 * Input fields for message, relation, and location/time
 */

import { Slider } from "@/components/ui/slider";

interface MessageFormProps {
  message: string;
  relation: string;
  locationTime: string;
  messageFontSize: number;
  onMessageChange: (value: string) => void;
  onRelationChange: (value: string) => void;
  onLocationTimeChange: (value: string) => void;
  onMessageFontSizeChange: (value: number) => void;
}

export function MessageForm({
  message,
  relation,
  locationTime,
  messageFontSize,
  onMessageChange,
  onRelationChange,
  onLocationTimeChange,
  onMessageFontSizeChange,
}: MessageFormProps) {
  return (
    <div className="space-y-4">
      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-heading font-bold text-text-muted mb-2"
        >
          留言
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          maxLength={100}
          rows={3}
          placeholder="寫下你想說的話..."
          className="input-playful resize-none"
        />
        <p className="mt-1 text-xs text-text-muted text-right">
          {message.length}/100
        </p>

        {/* Font Size Slider */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-heading font-bold text-text-muted">
              文字大小
            </label>
          </div>
          <Slider
            value={[messageFontSize]}
            onValueChange={(values) => onMessageFontSizeChange(values[0])}
            min={2}
            max={3.5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>小</span>
            <span>大</span>
          </div>
        </div>
      </div>

      {/* Relation */}
      <div>
        <label
          htmlFor="relation"
          className="block text-sm font-heading font-bold text-text-muted mb-2"
        >
          與主角的關係
        </label>
        <input
          id="relation"
          type="text"
          value={relation}
          onChange={(e) => onRelationChange(e.target.value)}
          maxLength={20}
          placeholder="住下鋪的大學室友..."
          className="input-playful"
        />
      </div>

      {/* Location/Time */}
      <div>
        <label
          htmlFor="locationTime"
          className="block text-sm font-heading font-bold text-text-muted mb-2"
        >
          地點 / 時間
        </label>
        <input
          id="locationTime"
          type="text"
          value={locationTime}
          onChange={(e) => onLocationTimeChange(e.target.value)}
          maxLength={30}
          placeholder="2026.03.08 彰化"
          className="input-playful"
        />
      </div>
    </div>
  );
}
