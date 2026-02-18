"use client";

/**
 * MessageForm Component
 * Input fields for message, relation, and location/time
 */

interface MessageFormProps {
  message: string;
  relation: string;
  locationTime: string;
  onMessageChange: (value: string) => void;
  onRelationChange: (value: string) => void;
  onLocationTimeChange: (value: string) => void;
}

export function MessageForm({
  message,
  relation,
  locationTime,
  onMessageChange,
  onRelationChange,
  onLocationTimeChange,
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
          placeholder="例：大學同學、表姐..."
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
          placeholder="例：2026.02.13 台北"
          className="input-playful"
        />
      </div>
    </div>
  );
}
