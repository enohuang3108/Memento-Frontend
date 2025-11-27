# WebSocket Protocol: 活動照片牆

**Version**: 1.0.0
**Date**: 2025-11-17

## Overview

WebSocket 連接用於即時推送照片和彈幕更新給所有連接的參與者和大螢幕顯示端。

**Connection URL**: `wss://api.snapwall.example.com/events/{activityId}/ws?sessionId={sessionId}`

**Protocol**: JSON-based message exchange

---

## Connection Lifecycle

### 1. 建立連接

**Client → Server**:
```javascript
const ws = new WebSocket(
  `wss://api.snapwall.example.com/events/123456/ws?sessionId=${sessionId}`
);
```

**Server Response** (Upgrade to WebSocket 101):
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

### 2. 初始化

連接建立後,伺服器立即發送初始化訊息:

**Server → Client**:
```json
{
  "type": "joined",
  "activityId": "123456",
  "photos": [
    {
      "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "activityId": "123456",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "driveFileId": "1a2B3c4D5e6F7g8H9i0J",
      "thumbnailUrl": "https://lh3.googleusercontent.com/...",
      "fullUrl": "https://drive.google.com/uc?id=...",
      "uploadedAt": 1700000100000,
      "width": 1920,
      "height": 1080
    }
  ],
  "timestamp": 1700000200000
}
```

### 3. 保持連接 (Heartbeat)

**Client → Server** (每 30 秒):
```json
{
  "type": "ping"
}
```

**Server → Client**:
```json
{
  "type": "pong",
  "timestamp": 1700000300000
}
```

### 4. 關閉連接

**Client**:
```javascript
ws.close(1000, "User left activity");
```

**Server** (在連接關閉時清理 session):
```json
{
  "type": "disconnected",
  "reason": "User left activity"
}
```

---

## Message Types

### Client → Server Messages

#### 1. JOIN (已在連接建立時完成,不需額外訊息)

#### 2. PHOTO_ADDED (照片已上傳到 Google Drive)

**Purpose**: 通知伺服器新照片已上傳到 Google Drive

```json
{
  "type": "photo_added",
  "driveFileId": "1a2B3c4D5e6F7g8H9i0J",
  "thumbnailUrl": "https://lh3.googleusercontent.com/...",
  "fullUrl": "https://drive.google.com/uc?id=...",
  "width": 1920,
  "height": 1080
}
```

**Validation**:
- `driveFileId`: Required, string, valid Google Drive file ID
- `thumbnailUrl`: Required, string, HTTPS URL
- `fullUrl`: Required, string, HTTPS URL
- `width`, `height`: Optional, positive integers

**Rate Limit**: 20 photos / 60 seconds per session

**Server Response** (Success):
```json
{
  "type": "photo_added",
  "photo": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "activityId": "123456",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "driveFileId": "1a2B3c4D5e6F7g8H9i0J",
    "thumbnailUrl": "https://lh3.googleusercontent.com/...",
    "fullUrl": "https://drive.google.com/uc?id=...",
    "uploadedAt": 1700000400000,
    "width": 1920,
    "height": 1080
  }
}
```

**Server Response** (Error):
```json
{
  "type": "error",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Photo upload rate limit exceeded. Please wait 5 seconds.",
  "retryAfter": 5000
}
```

#### 3. DANMAKU (發送彈幕)

**Purpose**: 發送彈幕留言

```json
{
  "type": "danmaku",
  "content": "活動好好玩！"
}
```

**Validation**:
- `content`: Required, string, 1-50 characters, pass profanity filter

**Rate Limit**: 1 danmaku / 2 seconds per session

**Server Response** (Success - broadcast to all):
```json
{
  "type": "danmaku",
  "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "content": "活動好好玩！",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1700000500000
}
```

**Server Response** (Error - only to sender):
```json
{
  "type": "error",
  "code": "PROFANITY_DETECTED",
  "message": "Your message contains inappropriate content. Please modify and try again."
}
```

#### 4. PING (心跳)

**Purpose**: 保持連接活躍

```json
{
  "type": "ping"
}
```

**Server Response**:
```json
{
  "type": "pong",
  "timestamp": 1700000600000
}
```

---

### Server → Client Messages

#### 1. JOINED (連接成功)

**Purpose**: 確認連接並提供初始資料

```json
{
  "type": "joined",
  "activityId": "123456",
  "photos": [ /* Photo[] */ ],
  "timestamp": 1700000200000
}
```

#### 2. PHOTO_ADDED (新照片廣播)

**Purpose**: 廣播新照片給所有連接的客戶端

```json
{
  "type": "photo_added",
  "photo": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "activityId": "123456",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "driveFileId": "1a2B3c4D5e6F7g8H9i0J",
    "thumbnailUrl": "https://lh3.googleusercontent.com/...",
    "fullUrl": "https://drive.google.com/uc?id=...",
    "uploadedAt": 1700000400000,
    "width": 1920,
    "height": 1080
  }
}
```

#### 3. DANMAKU (彈幕廣播)

**Purpose**: 廣播彈幕給所有連接的客戶端

```json
{
  "type": "danmaku",
  "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "content": "活動好好玩！",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1700000500000
}
```

#### 4. ACTIVITY_ENDED (活動結束)

**Purpose**: 通知所有客戶端活動已結束

```json
{
  "type": "activity_ended",
  "activityId": "123456",
  "reason": "Ended by organizer",
  "timestamp": 1700086400000
}
```

**Client Action**: 關閉連接並顯示「活動已結束」訊息

#### 5. PONG (心跳回應)

**Purpose**: 回應客戶端的心跳檢查

```json
{
  "type": "pong",
  "timestamp": 1700000600000
}
```

#### 6. ERROR (錯誤訊息)

**Purpose**: 通知客戶端發生錯誤

```json
{
  "type": "error",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Photo upload rate limit exceeded. Please wait 5 seconds.",
  "retryAfter": 5000
}
```

**Error Codes**:
- `RATE_LIMIT_EXCEEDED`: 超過頻率限制
- `VALIDATION_ERROR`: 訊息驗證失敗
- `PROFANITY_DETECTED`: 彈幕包含敏感詞
- `ACTIVITY_NOT_FOUND`: 活動不存在
- `ACTIVITY_ENDED`: 活動已結束
- `INTERNAL_ERROR`: 伺服器內部錯誤

---

## Example Flows

### Flow 1: 參與者上傳照片

```
1. Client: (透過 Google Drive API 上傳照片)
2. Client: (取得 Drive file ID 和 URLs)
3. Client → Server:
   {
     "type": "photo_added",
     "driveFileId": "...",
     "thumbnailUrl": "...",
     "fullUrl": "..."
   }
4. Server: (驗證 rate limit, 建立 Photo 物件)
5. Server → All Clients (broadcast):
   {
     "type": "photo_added",
     "photo": { ... }
   }
6. All Clients: (更新照片牆 UI)
```

### Flow 2: 參與者發送彈幕

```
1. Client → Server:
   {
     "type": "danmaku",
     "content": "活動好好玩！"
   }
2. Server: (驗證 rate limit, 過濾敏感詞)
3. Server → All Clients (broadcast):
   {
     "type": "danmaku",
     "id": "...",
     "content": "活動好好玩！",
     "timestamp": ...
   }
4. All Clients: (顯示彈幕動畫)
```

### Flow 3: 主辦方結束活動

```
1. Organizer: (呼叫 DELETE /events/{activityId} API)
2. Server → All Clients (broadcast):
   {
     "type": "activity_ended",
     "activityId": "123456",
     "reason": "Ended by organizer",
     "timestamp": ...
   }
3. Server: (關閉所有 WebSocket 連接)
4. All Clients: (顯示「活動已結束」訊息)
```

---

## Error Handling

### Client-side

```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // 顯示錯誤訊息給使用者
};

ws.onclose = (event) => {
  if (event.code !== 1000) {
    // 非正常關閉,嘗試重連
    setTimeout(() => reconnect(), 1000 * Math.pow(2, retryCount));
  }
};
```

**Reconnection Strategy**:
- 指數退避: 1s, 2s, 4s, 8s, 16s, ...
- 最大重試次數: 5 次
- 重連成功後重新獲取活動狀態

### Server-side

```typescript
// Durable Object EventRoom
async handleWebSocket(request: Request) {
  try {
    const { 0: client, 1: server } = new WebSocketPair();
    await this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  } catch (error) {
    return new Response('WebSocket upgrade failed', { status: 400 });
  }
}
```

---

## Performance Considerations

### Broadcast Optimization

避免 O(n²) 複雜度的廣播:

```typescript
async broadcast(message: any) {
  const data = JSON.stringify(message);
  const promises = Array.from(this.sessions.values()).map(ws =>
    ws.send(data).catch(err => console.error('Send failed:', err))
  );
  await Promise.allSettled(promises);
}
```

### Message Queue

實施訊息佇列避免背壓:

```typescript
class MessageQueue {
  private queue: any[] = [];
  private processing = false;

  async enqueue(message: any) {
    this.queue.push(message);
    if (!this.processing) {
      await this.process();
    }
  }

  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const message = this.queue.shift()!;
      await this.broadcast(message);
    }
    this.processing = false;
  }
}
```

### Connection Limits

- 每個 Durable Object 最多 500 個 WebSocket 連接
- 超過限制時回傳錯誤:

```json
{
  "type": "error",
  "code": "CAPACITY_EXCEEDED",
  "message": "Activity room is at full capacity. Please try again later."
}
```

---

## Security

### Message Validation

所有客戶端訊息必須通過嚴格驗證:

```typescript
function validateClientMessage(message: any): boolean {
  // 檢查訊息類型
  if (!['photo_added', 'danmaku', 'ping'].includes(message.type)) {
    return false;
  }

  // 針對不同類型進行特定驗證
  switch (message.type) {
    case 'photo_added':
      return validatePhotoMessage(message);
    case 'danmaku':
      return validateDanmakuMessage(message);
    default:
      return true;
  }
}
```

### Rate Limiting

在 Durable Object 層級實施 rate limiting,避免濫用。

### Authentication

Session ID 在 URL query parameter 中傳遞,伺服器驗證:

```typescript
const url = new URL(request.url);
const sessionId = url.searchParams.get('sessionId');
if (!isValidUUID(sessionId)) {
  return new Response('Invalid session ID', { status: 400 });
}
```

---

## Monitoring & Logging

### Metrics

- 連接數 (current/peak)
- 訊息發送率 (messages/second)
- 錯誤率 (errors/total messages)
- 平均延遲 (message latency)

### Logging

```typescript
console.log({
  timestamp: Date.now(),
  activityId: '123456',
  event: 'photo_added',
  sessionId: '550e8400...',
  latency: 150 // ms
});
```

---

## Testing

### Integration Tests

```typescript
describe('WebSocket Protocol', () => {
  it('should broadcast photo to all connected clients', async () => {
    const clients = await connectMultipleClients(3);
    await clients[0].send({ type: 'photo_added', ... });

    const messages = await Promise.all(
      clients.map(c => c.waitForMessage())
    );

    messages.forEach(msg => {
      expect(msg.type).toBe('photo_added');
      expect(msg.photo.id).toBeDefined();
    });
  });
});
```
