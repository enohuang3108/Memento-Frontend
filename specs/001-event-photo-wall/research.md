# Technical Research: 活動照片牆

**Date**: 2025-11-17
**Feature**: 001-event-photo-wall
**Purpose**: 解決技術選型和架構設計問題,確保所有 Technical Context 中的技術決策有充分理由支持

## Research Areas

### 1. TanStack Start 架構決策

**Decision**: 使用 TanStack Start 作為全棧 React 框架

**Rationale**:
- **SSR/RSC 支援**: 提供伺服器端渲染和 React Server Components,優化首次載入效能 (FCP < 1.5s)
- **檔案系統路由**: 直觀的路由結構,符合專案的頁面組織需求 (首頁/活動頁/顯示頁)
- **Full-stack 整合**: 統一前後端開發體驗,減少配置複雜度
- **Type-safe API**: 完整的 TypeScript 支援,減少執行時期錯誤

**Alternatives Considered**:
- **Next.js**: 功能成熟但與 Cloudflare Workers 整合較複雜,且 bundle size 較大
- **Remix**: 優秀的 full-stack 框架,但社群生態不如 Next.js,學習曲線陡峭
- **Vite + React Router**: 較輕量但缺少 SSR 支援,需自行整合更多工具

**Best Practices**:
- 使用 `createFileRoute` 定義路由和 loader
- 利用 TanStack Query 整合進行資料獲取和快取
- 實施程式碼分割 (code splitting) 減少初始 bundle
- 使用 React Server Components 處理伺服器端邏輯

### 2. Cloudflare Durable Objects 狀態管理

**Decision**: 使用 Durable Objects 管理活動房間和 WebSocket 連接

**Rationale**:
- **強一致性**: DO 保證單一活動的所有操作在同一個實例中執行,避免分散式同步問題
- **內建 WebSocket 支援**: 原生支援 WebSocket,每個 DO 可處理 500 個並發連接
- **狀態持久化**: 支援 transactional storage API,雖然本專案不需要持久化,但提供狀態管理基礎
- **自動擴展**: Cloudflare 自動管理 DO 實例的生命週期和擴展

**Alternatives Considered**:
- **Redis + Pub/Sub**: 需額外服務,增加架構複雜度和成本
- **Workers KV**: 不支援 WebSocket,最終一致性不適合即時互動
- **Cloudflare Queues**: 適合非同步任務,不適合即時雙向通訊

**Best Practices**:
- 每個活動一個 DO 實例 (`EventRoom`),使用 activity_id 作為 DO ID
- 實施 WebSocket 心跳機制 (ping/pong) 檢測連接狀態
- 限制每個 DO 最多 500 個連接,超過時回傳錯誤提示
- 實施訊息廣播優化,避免 O(n²) 複雜度

**Implementation Pattern**:
```typescript
// EventRoom Durable Object 結構
class EventRoom {
  state: DurableObjectState;
  sessions: Map<string, WebSocket>; // sessionId -> WebSocket
  photos: Photo[]; // 活動照片列表 (記憶體中)

  async fetch(request: Request) {
    // 處理 WebSocket 升級或 HTTP 請求
  }

  async broadcast(message: any) {
    // 廣播訊息給所有連接的客戶端
  }
}
```

### 3. Google Drive API 整合策略

**Decision**: 使用 Google Drive API v3,要求參與者提供公開資料夾 ID

**Rationale**:
- **零資料儲存**: 符合隱私保護需求,系統不保留照片副本
- **使用者控制權**: 參與者完全控制自己的照片,可隨時刪除或管理
- **免費儲存**: 利用 Google Drive 的免費 15GB 空間
- **API 成熟**: Drive API v3 穩定且文件完整

**Alternatives Considered**:
- **直接上傳到 Workers**: 需要 R2 儲存,違反零資料儲存原則且增加成本
- **使用者自己的 S3/Azure**: 要求過高,降低參與意願
- **Cloudflare Images**: 需要付費,且違反零儲存原則

**Best Practices**:
- **簡化 OAuth 流程**: 使用公開資料夾 ID,參與者只需建立資料夾並設定為「知道連結的人可以檢視」
- **API 配額管理**:
  - 實施指數退避重試機制
  - 使用 batch requests 減少 API 呼叫次數
  - 快取資料夾內容列表 (TTL: 5 秒)
- **照片 URL 取得**:
  ```typescript
  // 取得公開資料夾中的檔案
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?` +
    `q='${folderId}' in parents&fields=files(id,name,webContentLink,thumbnailLink)`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  ```
- **前端壓縮**: 使用 Canvas API 在前端壓縮照片到 1920px,減少上傳時間

### 4. ULID 與 Deterministic ID 生成

**Decision**:
- **活動 ID**: Deterministic 6 位數字 (000000-999999)
- **照片 ID/彈幕 ID**: ULID (Universally Unique Lexicographically Sortable Identifier)

**Rationale**:
- **活動 ID (Deterministic)**:
  - 易於記憶和輸入 (6 位數字)
  - 唯一性透過隨機生成 + 衝突檢查保證
  - 範圍: 100萬個可能的活動代碼
- **照片/彈幕 ID (ULID)**:
  - 時間排序: 內建時間戳,天然按時間排序
  - 唯一性: 128-bit 隨機性保證全域唯一
  - 效能: 比 UUID v4 更高效,且可按時間排序

**Alternatives Considered**:
- **UUID v4**: 無時間排序特性,需額外欄位記錄時間
- **Nanoid**: 較短但無時間排序
- **Snowflake ID**: 需要分散式 ID 生成器,過於複雜

**Best Practices**:
- 使用 `ulid` npm 套件生成 ULID
- 活動 ID 生成時檢查 DO storage 避免衝突
- ULID 作為照片和彈幕的主鍵,確保時間順序正確

**Implementation**:
```typescript
import { ulid } from 'ulid';

// 生成活動 ID (6 位數字)
function generateActivityId(): string {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

// 生成照片/彈幕 ID
function generateId(): string {
  return ulid(); // 例如: 01ARZ3NDEKTSV4RRFFQ69G5FAV
}
```

### 5. WebSocket 即時通訊架構

**Decision**: 使用 Cloudflare Durable Objects 的原生 WebSocket 支援

**Rationale**:
- **低延遲**: DO 的 WebSocket 提供 < 200ms 的訊息延遲
- **自動擴展**: Cloudflare 自動處理連接管理和負載平衡
- **強一致性**: 同一活動的所有連接在同一個 DO 實例中

**Message Protocol**:
```typescript
// 客戶端 → 伺服器
type ClientMessage =
  | { type: 'join', activityId: string, sessionId: string }
  | { type: 'photo', photoId: string, driveFileId: string, thumbnailUrl: string }
  | { type: 'danmaku', content: string, timestamp: number }
  | { type: 'ping' };

// 伺服器 → 客戶端
type ServerMessage =
  | { type: 'joined', activityId: string, photos: Photo[] }
  | { type: 'photo_added', photo: Photo }
  | { type: 'danmaku', content: string, timestamp: number, id: string }
  | { type: 'pong' }
  | { type: 'error', message: string };
```

**Best Practices**:
- 實施心跳機制 (每 30 秒 ping/pong)
- 連接斷線時自動重連 (指數退避)
- 訊息序列化使用 JSON (簡單且易於除錯)
- 實施訊息佇列避免背壓 (backpressure)

### 6. 彈幕敏感詞過濾

**Decision**: 前後端雙重過濾,使用基本黑名單

**Rationale**:
- **前端過濾**: 即時回饋,改善使用者體驗
- **後端過濾**: 安全防護,防止繞過前端檢查
- **簡單黑名單**: MVP 階段使用基本詞庫,避免過度複雜

**Alternatives Considered**:
- **第三方 API** (如 Perspective API): 增加延遲和成本
- **機器學習模型**: 過於複雜,不適合 MVP
- **正則表達式**: 易繞過,維護困難

**Implementation**:
```typescript
// 基本敏感詞過濾器
class ProfanityFilter {
  private blacklist: Set<string>;

  constructor(words: string[]) {
    this.blacklist = new Set(words.map(w => w.toLowerCase()));
  }

  filter(text: string): { clean: boolean; filtered: string } {
    const words = text.split(/\s+/);
    let clean = true;
    const filtered = words.map(word => {
      if (this.blacklist.has(word.toLowerCase())) {
        clean = false;
        return '*'.repeat(word.length);
      }
      return word;
    }).join(' ');

    return { clean, filtered };
  }
}
```

**Best Practices**:
- 維護繁體中文和英文黑名單
- 前端即時檢查並標記不當詞彙
- 後端拒絕包含敏感詞的彈幕
- 提供清晰的錯誤訊息引導使用者修改

### 7. 效能優化策略

**Decision**: 多層次優化確保符合效能目標

**Frontend Optimization**:
- **Code Splitting**: 路由層級的程式碼分割
  ```typescript
  const PhotoWall = lazy(() => import('./components/PhotoWall'));
  ```
- **圖片懶載入**: 使用 `loading="lazy"` 和 Intersection Observer
- **Canvas 渲染彈幕**: 使用 Canvas API 而非 DOM,提升效能
- **虛擬滾動**: 照片列表超過 100 張時使用虛擬滾動
- **Bundle 優化**:
  - Tree shaking 移除未使用代碼
  - Minification 和 gzip 壓縮
  - 目標: < 200KB (gzipped)

**Backend Optimization**:
- **Workers CPU Time**:
  - 避免同步阻塞操作
  - 使用 `waitUntil()` 處理非關鍵路徑任務
- **DO 廣播優化**:
  ```typescript
  async broadcast(message: any) {
    const data = JSON.stringify(message);
    const promises = [];
    for (const [_, ws] of this.sessions) {
      promises.push(ws.send(data));
    }
    await Promise.all(promises); // 並行發送
  }
  ```
- **快取策略**:
  - Google Drive 檔案列表快取 5 秒
  - 活動 metadata 快取在 DO 記憶體中

**Monitoring**:
- 使用 Cloudflare Analytics 監控 Workers 效能
- 實施前端效能監控 (Web Vitals)
- 設定告警: CPU time > 40ms, 錯誤率 > 5%

### 8. 測試策略

**Decision**: 三層測試金字塔 (單元 > 整合 > E2E)

**Unit Tests (Vitest)**:
- React 元件測試 (React Testing Library)
- 工具函式測試 (ID 生成、過濾器、驗證)
- Workers handlers 單元測試
- 目標覆蓋率: 80% (核心邏輯)

**Integration Tests**:
- Durable Objects 整合測試 (Miniflare)
- WebSocket 訊息流測試
- Google Drive API mock 測試

**E2E Tests (Playwright)**:
- 關鍵使用者流程:
  1. 建立活動 → 取得 QR Code
  2. 參與者加入 → 上傳照片
  3. 大螢幕顯示 → 即時更新
  4. 彈幕發送 → 即時顯示

**Best Practices**:
- TDD 流程: 先寫測試再實作
- Mock Google Drive API 避免實際 API 呼叫
- 使用 Miniflare 本地測試 Workers 和 DO
- CI/CD 整合: 每次 commit 自動執行測試

### 9. 安全性考量

**Decision**: 實施多層次安全防護

**Input Validation**:
- 活動 ID: 6 位數字,正則驗證
- 照片檔案: 大小 < 20MB,MIME type 檢查
- 彈幕內容: 長度 < 50 字,敏感詞過濾
- Google Drive Folder ID: 格式驗證

**CSRF Protection**:
- WebSocket 連接驗證 session token
- API 端點使用 Origin header 檢查

**Rate Limiting**:
```typescript
// 使用 DO state 實施 rate limiting
class RateLimiter {
  private attempts: Map<string, number[]>; // sessionId -> timestamps

  check(sessionId: string, limit: number, window: number): boolean {
    const now = Date.now();
    const timestamps = this.attempts.get(sessionId) || [];
    const recent = timestamps.filter(t => now - t < window);

    if (recent.length >= limit) {
      return false; // 超過限制
    }

    recent.push(now);
    this.attempts.set(sessionId, recent);
    return true;
  }
}
```

**Rate Limits**:
- 照片上傳: 20 張 / 60 秒 / session
- 彈幕發送: 1 則 / 2 秒 / session
- API 請求: 100 req / 分鐘 / IP

**XSS Protection**:
- React 自動轉義輸出
- 彈幕內容 sanitize (移除 HTML 標籤)
- Content-Security-Policy headers

### 10. 部署與 DevOps

**Decision**: Cloudflare Pages (前端) + Workers (後端)

**Deployment Architecture**:
- **Frontend**: Cloudflare Pages
  - 自動從 Git 部署
  - 全球 CDN 分發
  - 預覽部署 (PR-based)
- **Backend**: Cloudflare Workers
  - Wrangler CLI 部署
  - 環境變數管理 (secrets)
  - Durable Objects 自動擴展

**CI/CD Pipeline**:
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - run: wrangler publish
```

**Monitoring & Logging**:
- Cloudflare Analytics (Workers metrics)
- Sentry (錯誤追蹤)
- Custom logs (DO state 變化)

**Rollback Strategy**:
- Workers 版本控制 (Cloudflare dashboard)
- 快速回滾到前一版本
- Canary deployment (逐步推出新版本)

## Summary of Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Frontend Framework | TanStack Start | SSR/RSC, 檔案系統路由, Type-safe |
| Backend | Cloudflare Workers + DO | Serverless, 自動擴展, 低延遲 |
| Storage | Google Drive API | 零資料儲存, 使用者控制權 |
| ID Generation | ULID + 6-digit code | 時間排序, 易記憶 |
| Real-time | WebSocket (DO) | 低延遲, 強一致性 |
| Content Filter | 前後端雙重黑名單 | 安全且使用者友善 |
| Testing | Vitest + Playwright | 完整測試覆蓋 |
| Deployment | Pages + Workers | 自動化 CI/CD |

## Next Steps

1. **Phase 1**: 建立 data-model.md 定義資料結構
2. **Phase 1**: 建立 contracts/ 定義 API 介面
3. **Phase 1**: 建立 quickstart.md 開發者指南
4. **Phase 2**: 使用 `/speckit.tasks` 生成實作任務
