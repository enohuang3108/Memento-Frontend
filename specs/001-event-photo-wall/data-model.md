# Data Model: 活動照片牆

**Date**: 2025-11-17
**Feature**: 001-event-photo-wall
**Purpose**: 定義系統中的資料結構、關係和驗證規則

## Overview

本系統採用 **零持久化儲存** 架構:
- **照片**: 存放在參與者的 Google Drive,系統只保留參考
- **彈幕**: 即時傳輸不儲存
- **活動狀態**: 存放在 Durable Objects 記憶體中,活動結束後清除
- **Session**: 瀏覽器 sessionStorage,不傳輸到伺服器

## Core Entities

### 1. Event (活動)

代表一個實體活動場次,由主辦方建立。

**TypeScript Interface**:
```typescript
interface Event {
  // 識別碼
  id: string;                    // 6 位數字活動代碼 (e.g., "123456")

  // 基本資訊
  title?: string;                // 活動標題 (可選)
  createdAt: number;             // 建立時間 (Unix timestamp)
  expiresAt?: number;            // 過期時間 (可選,預設 24 小時後)

  // 狀態
  status: 'active' | 'ended';    // 活動狀態

  // Google Drive 整合
  driveFolderId?: string;        // 主辦方的 Drive 資料夾 ID (可選)

  // 統計資訊 (記憶體中即時計算)
  photoCount: number;            // 照片總數
  participantCount: number;      // 參與者總數
}
```

**Validation Rules**:
- `id`: 必填,6 位數字字串,符合正則 `/^\d{6}$/`
- `title`: 可選,最大長度 100 字元
- `createdAt`: 必填,正整數 Unix timestamp
- `expiresAt`: 可選,必須大於 `createdAt`
- `status`: 必填,只能是 'active' 或 'ended'
- `driveFolderId`: 可選,符合 Google Drive folder ID 格式

**State Transitions**:
```
[Create] → active
active → ended (手動結束或過期)
ended → [Delete from memory]
```

**Storage Location**: Durable Object 記憶體 (EventRoom instance)

**Lifecycle**:
1. 主辦方建立活動 → 生成 `Event` 物件並儲存在 DO
2. 活動進行中 → `status = 'active'`
3. 活動結束 → `status = 'ended'`,24 小時後從記憶體清除

---

### 2. Photo (照片參考)

指向參與者 Google Drive 中照片的參考,**不儲存照片本身**。

**TypeScript Interface**:
```typescript
interface Photo {
  // 識別碼
  id: string;                    // ULID (時間排序)

  // 來源資訊
  activityId: string;            // 所屬活動 ID
  sessionId: string;             // 上傳者 session ID

  // Google Drive 參考
  driveFileId: string;           // Google Drive 檔案 ID
  thumbnailUrl: string;          // 縮圖 URL (Google Drive thumbnail)
  fullUrl: string;               // 完整照片 URL (Google Drive webContentLink)

  // Metadata
  uploadedAt: number;            // 上傳時間 (Unix timestamp)
  width?: number;                // 照片寬度 (pixels, 可選)
  height?: number;               // 照片高度 (pixels, 可選)
}
```

**Validation Rules**:
- `id`: 必填,有效的 ULID 字串
- `activityId`: 必填,6 位數字,對應有效的活動
- `sessionId`: 必填,UUID v4 格式
- `driveFileId`: 必填,符合 Google Drive file ID 格式
- `thumbnailUrl`: 必填,有效的 HTTPS URL
- `fullUrl`: 必填,有效的 HTTPS URL
- `uploadedAt`: 必填,正整數 Unix timestamp
- `width`, `height`: 可選,正整數

**Storage Location**: Durable Object 記憶體 (EventRoom instance)

**Lifecycle**:
1. 參與者上傳照片到自己的 Google Drive
2. 取得 Drive file ID 和 URLs
3. 建立 `Photo` 參考物件並廣播給所有連接的客戶端
4. 活動結束後,參考物件從記憶體清除 (但 Drive 中的照片保留)

---

### 3. DanmakuMessage (彈幕訊息)

即時傳輸的文字留言,**完全不儲存**。

**TypeScript Interface**:
```typescript
interface DanmakuMessage {
  // 識別碼
  id: string;                    // ULID (時間排序)

  // 內容
  content: string;               // 彈幕文字內容

  // 來源資訊
  activityId: string;            // 所屬活動 ID
  sessionId: string;             // 發送者 session ID

  // Metadata
  timestamp: number;             // 發送時間 (Unix timestamp)
}
```

**Validation Rules**:
- `id`: 必填,有效的 ULID 字串
- `content`: 必填,長度 1-50 字元,通過敏感詞過濾
- `activityId`: 必填,6 位數字,對應有效的活動
- `sessionId`: 必填,UUID v4 格式
- `timestamp`: 必填,正整數 Unix timestamp

**Storage Location**: **不儲存**,僅即時傳輸

**Lifecycle**:
1. 參與者發送彈幕 → 建立 `DanmakuMessage` 物件
2. 通過敏感詞過濾檢查
3. 即時廣播給所有連接的客戶端
4. **訊息發送後立即丟棄,不保留任何記錄**

---

### 4. ParticipantSession (參與者 Session)

臨時的參與者識別,用於追蹤操作和實施 rate limiting。

**TypeScript Interface**:
```typescript
interface ParticipantSession {
  // 識別碼
  id: string;                    // UUID v4

  // 活動關聯
  activityId: string;            // 參與的活動 ID

  // 連接資訊
  connectedAt: number;           // 連接時間 (Unix timestamp)
  lastActivityAt: number;        // 最後活動時間 (Unix timestamp)
  isConnected: boolean;          // WebSocket 連接狀態

  // Rate Limiting 追蹤
  photoUploads: number[];        // 最近上傳時間戳陣列 (保留 60 秒內)
  danmakuSends: number[];        // 最近發送時間戳陣列 (保留 10 秒內)
}
```

**Validation Rules**:
- `id`: 必填,UUID v4 格式
- `activityId`: 必填,6 位數字,對應有效的活動
- `connectedAt`: 必填,正整數 Unix timestamp
- `lastActivityAt`: 必填,正整數 Unix timestamp,不早於 `connectedAt`
- `isConnected`: 必填,布林值
- `photoUploads`: 必填,陣列元素為 Unix timestamp
- `danmakuSends`: 必填,陣列元素為 Unix timestamp

**Storage Location**: Durable Object 記憶體 (EventRoom instance)

**Lifecycle**:
1. 參與者加入活動並建立 WebSocket 連接 → 建立 `ParticipantSession`
2. 每次操作更新 `lastActivityAt`
3. WebSocket 斷線 → `isConnected = false`
4. 超過 5 分鐘無活動 → 從記憶體移除

---

## Relationships

```
Event (1) ──< (N) Photo
  │
  └──< (N) ParticipantSession

Photo (N) ──> (1) ParticipantSession (透過 sessionId)

DanmakuMessage (不儲存,僅即時傳輸)
  └──> (transient) ParticipantSession (透過 sessionId)
```

**說明**:
- 一個活動可以有多個照片和多個參與者 session
- 照片和彈幕都關聯到上傳/發送者的 session
- 彈幕不持久化,因此沒有實際的儲存關係

---

## Derived Data (Runtime Computed)

以下資料在執行時期即時計算,不持久化儲存:

### ActivityStatistics (活動統計)
```typescript
interface ActivityStatistics {
  activityId: string;
  photoCount: number;           // Event.photos.length
  participantCount: number;     // Event.sessions.size
  activeConnections: number;    // sessions where isConnected = true
  totalDanmakuSent: number;     // 總彈幕數 (從 sessions 累加)
}
```

### ParticipantStatistics (參與者統計)
```typescript
interface ParticipantStatistics {
  sessionId: string;
  photosUploaded: number;       // 該 session 上傳的照片數
  danmakuSent: number;          // 該 session 發送的彈幕數
  joinedAt: number;             // Session 建立時間
}
```

---

## Validation Functions

### Activity ID Validation
```typescript
function validateActivityId(id: string): boolean {
  return /^\d{6}$/.test(id);
}
```

### Photo Upload Validation
```typescript
function validatePhotoUpload(photo: Partial<Photo>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!photo.driveFileId || !/^[\w-]{20,}$/.test(photo.driveFileId)) {
    errors.push('Invalid Google Drive file ID');
  }

  if (!photo.thumbnailUrl || !photo.thumbnailUrl.startsWith('https://')) {
    errors.push('Invalid thumbnail URL');
  }

  if (!photo.fullUrl || !photo.fullUrl.startsWith('https://')) {
    errors.push('Invalid full URL');
  }

  return { valid: errors.length === 0, errors };
}
```

### Danmaku Content Validation
```typescript
function validateDanmakuContent(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('Danmaku content cannot be empty');
  }

  if (content.length > 50) {
    errors.push('Danmaku content exceeds 50 characters');
  }

  // 檢查敏感詞
  const profanityFilter = new ProfanityFilter(BLACKLIST);
  const { clean } = profanityFilter.filter(content);
  if (!clean) {
    errors.push('Danmaku content contains inappropriate words');
  }

  return { valid: errors.length === 0, errors };
}
```

### Rate Limiting Check
```typescript
function checkRateLimit(
  session: ParticipantSession,
  type: 'photo' | 'danmaku',
  now: number
): { allowed: boolean; retryAfter?: number } {
  if (type === 'photo') {
    // 20 張 / 60 秒
    const recentUploads = session.photoUploads.filter(t => now - t < 60000);
    if (recentUploads.length >= 20) {
      const oldestUpload = Math.min(...recentUploads);
      return {
        allowed: false,
        retryAfter: 60000 - (now - oldestUpload)
      };
    }
  } else {
    // 1 則 / 2 秒
    const recentSends = session.danmakuSends.filter(t => now - t < 2000);
    if (recentSends.length >= 1) {
      const lastSend = Math.max(...recentSends);
      return {
        allowed: false,
        retryAfter: 2000 - (now - lastSend)
      };
    }
  }

  return { allowed: true };
}
```

---

## Storage Strategy Summary

| Entity | Storage Location | Persistence | Cleanup Strategy |
|--------|-----------------|-------------|------------------|
| Event | Durable Objects 記憶體 | 否 | 活動結束後 24 小時清除 |
| Photo | Durable Objects 記憶體 | 否 | 隨活動清除 |
| DanmakuMessage | **不儲存** | 否 | 即時傳輸後丟棄 |
| ParticipantSession | Durable Objects 記憶體 | 否 | 斷線 5 分鐘後清除 |

**關鍵設計原則**:
1. **零持久化**: 符合隱私保護和「短暫」的設計理念
2. **記憶體優先**: 所有狀態在 DO 記憶體中,存取速度快
3. **自動清理**: 過期資料自動清除,無需手動管理
4. **外部儲存**: 照片存放在使用者的 Google Drive,系統不接觸實際檔案

---

## Google Drive Data Model

參與者 Google Drive 中的資料夾結構 (系統不控制,僅說明最佳實踐):

```
使用者的 Google Drive/
└── 活動照片牆/
    └── [活動名稱] (公開資料夾)
        ├── photo-1.jpg
        ├── photo-2.jpg
        └── photo-3.jpg
```

**資料夾權限設定**: 「知道連結的人可以檢視」

**系統取得資料**:
- 使用 Google Drive API v3 列出資料夾內檔案
- 取得 `thumbnailLink` (縮圖) 和 `webContentLink` (完整檔案)
- 定期輪詢 (每 5 秒) 或使用 Change API (進階)

---

## Next Steps

1. 建立 API contracts (OpenAPI spec)
2. 建立 WebSocket message protocol 文件
3. 實作 TypeScript type definitions
4. 撰寫 data validation utilities
