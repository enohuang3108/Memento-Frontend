# Quickstart Guide: 活動照片牆開發

**Date**: 2025-11-17
**Feature**: 001-event-photo-wall

## 目錄

- [環境需求](#環境需求)
- [專案設定](#專案設定)
- [開發工作流程](#開發工作流程)
- [測試](#測試)
- [部署](#部署)
- [疑難排解](#疑難排解)

---

## 環境需求

### 必要工具

- **Node.js**: v20.x 或更高版本
- **npm**: v10.x 或更高版本
- **Wrangler CLI**: Cloudflare Workers 開發工具
  ```bash
  npm install -g wrangler
  ```
- **Git**: 版本控制

### 建議工具

- **VS Code**: 推薦編輯器
  - 擴充套件: ESLint, Prettier, TypeScript
- **Postman** 或 **Thunder Client**: API 測試
- **Chrome DevTools**: WebSocket 除錯

### 帳號需求

- **Cloudflare 帳號**: 用於 Workers 和 Durable Objects 部署
- **Google Cloud 帳號**: 用於 Google Drive API 測試 (可選)

---

## 專案設定

### 1. Clone 專案

```bash
git clone <repository-url>
cd snap-wall
```

### 2. 安裝依賴

```bash
# 安裝根目錄依賴
npm install

# 安裝 Workers 依賴
cd workers
npm install
cd ..
```

### 3. 環境變數設定

建立 `.env` 檔案 (前端):

```env
# TanStack Start 設定
PUBLIC_API_URL=http://localhost:8787
PUBLIC_WS_URL=ws://localhost:8787
```

建立 `workers/.dev.vars` 檔案 (Workers 本地開發):

```env
# Google Drive API (可選,用於測試)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# CORS allowed origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Wrangler 設定

Workers 設定已在 `workers/wrangler.toml` 中定義:

```toml
name = "snap-wall-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "EVENT_ROOM"
class_name = "EventRoom"
script_name = "snap-wall-api"

[[migrations]]
tag = "v1"
new_classes = ["EventRoom"]
```

### 5. 驗證設定

```bash
# 檢查 Node.js 版本
node --version  # 應該是 v20.x+

# 檢查 Wrangler 版本
wrangler --version

# 檢查專案結構
ls -la app/ workers/ tests/
```

---

## 開發工作流程

### 啟動開發伺服器

**方式 1: 使用 npm scripts (推薦)**

在專案根目錄開啟兩個終端:

**終端 1 - 前端開發伺服器**:
```bash
npm run dev
# TanStack Start 會在 http://localhost:3000 啟動
```

**終端 2 - Workers 本地開發**:
```bash
cd workers
npm run dev
# Miniflare 會在 http://localhost:8787 啟動
```

**方式 2: 使用 concurrently (一個終端)**

```bash
npm run dev:all
# 同時啟動前端和 Workers
```

### 開發流程

#### 1. 建立新功能

遵循 TDD 流程:

```bash
# 1. 先寫測試
npm test -- --watch

# 2. 測試失敗 (紅燈)
# 3. 實作功能
# 4. 測試通過 (綠燈)
# 5. 重構代碼
```

#### 2. 前端元件開發

```typescript
// app/components/PhotoWall.tsx
import { useQuery } from '@tanstack/react-query';

export function PhotoWall({ activityId }: { activityId: string }) {
  const { data: photos } = useQuery({
    queryKey: ['photos', activityId],
    queryFn: () => fetchPhotos(activityId),
  });

  return (
    <div className="photo-grid">
      {photos?.map(photo => (
        <img key={photo.id} src={photo.thumbnailUrl} alt="" />
      ))}
    </div>
  );
}
```

#### 3. Workers Handler 開發

```typescript
// workers/src/handlers/events.ts
export async function createEvent(request: Request): Promise<Response> {
  const body = await request.json();

  // 驗證輸入
  const { title, driveFolderId } = body;

  // 生成活動 ID
  const activityId = generateActivityId();

  // 建立 Event 物件
  const event: Event = {
    id: activityId,
    title,
    driveFolderId,
    createdAt: Date.now(),
    status: 'active',
    photoCount: 0,
    participantCount: 0,
  };

  // 儲存到 Durable Object
  const stub = env.EVENT_ROOM.get(env.EVENT_ROOM.idFromName(activityId));
  await stub.fetch('http://internal/init', {
    method: 'POST',
    body: JSON.stringify(event),
  });

  return Response.json({ event }, { status: 201 });
}
```

#### 4. Durable Object 開發

```typescript
// workers/src/durableObjects/EventRoom.ts
export class EventRoom {
  state: DurableObjectState;
  sessions: Map<string, WebSocket>;
  event: Event | null;
  photos: Photo[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Map();
    this.event = null;
    this.photos = [];
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket 升級
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // HTTP 端點
    if (url.pathname === '/init' && request.method === 'POST') {
      return this.handleInit(request);
    }

    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request: Request): Promise<Response> {
    const { 0: client, 1: server } = new WebSocketPair();

    // 接受連接
    server.accept();

    // 處理訊息
    server.addEventListener('message', async (event) => {
      const message = JSON.parse(event.data as string);
      await this.handleMessage(server, message);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async broadcast(message: any) {
    const data = JSON.stringify(message);
    for (const ws of this.sessions.values()) {
      ws.send(data);
    }
  }
}
```

### Hot Reload

兩個開發伺服器都支援 hot reload:

- **前端**: 修改 `app/` 中的檔案會自動重載
- **Workers**: 修改 `workers/src/` 中的檔案會自動重新編譯

---

## 測試

### 執行所有測試

```bash
# 執行所有測試 (單元 + 整合 + E2E)
npm test

# Watch mode (開發時使用)
npm test -- --watch
```

### 單元測試

```bash
# 只執行單元測試
npm run test:unit

# 測試特定檔案
npm run test:unit -- PhotoWall.test.tsx

# 測試覆蓋率
npm run test:coverage
```

### 整合測試

```bash
# Workers 整合測試 (使用 Miniflare)
cd workers
npm run test:integration
```

### E2E 測試

```bash
# Playwright E2E 測試
npm run test:e2e

# 開啟 Playwright UI
npm run test:e2e:ui

# 特定測試
npm run test:e2e -- participant-flow.spec.ts
```

### 測試範例

**單元測試** (`tests/unit/lib/ulid.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { generateId } from '@/lib/ulid';

describe('ULID Generator', () => {
  it('should generate valid ULID', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('should generate time-sortable IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1 < id2).toBe(true);
  });
});
```

**整合測試** (`workers/tests/integration/event-room.test.ts`):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';

describe('EventRoom Durable Object', () => {
  let mf: Miniflare;

  beforeEach(async () => {
    mf = new Miniflare({
      script: './src/index.ts',
      modules: true,
      durableObjects: {
        EVENT_ROOM: 'EventRoom',
      },
    });
  });

  it('should handle WebSocket connections', async () => {
    const response = await mf.dispatchFetch(
      'http://localhost/events/123456/ws',
      { headers: { 'Upgrade': 'websocket' } }
    );

    expect(response.status).toBe(101);
  });
});
```

---

## 部署

### 前置準備

1. **登入 Cloudflare**:
```bash
wrangler login
```

2. **設定 Secrets** (生產環境):
```bash
cd workers
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 部署 Workers

```bash
cd workers
npm run deploy

# 或使用 wrangler 直接部署
wrangler publish
```

**部署輸出**:
```
⛅ wrangler 3.x.x
-------------------
Your worker has been deployed.
✨ https://snap-wall-api.your-subdomain.workers.dev
```

### 部署前端 (Cloudflare Pages)

#### 方式 1: 透過 Git 整合 (推薦)

1. 連接 GitHub repository 到 Cloudflare Pages
2. 設定 Build 指令:
   ```
   npm run build
   ```
3. 設定 Output 目錄:
   ```
   .output/public
   ```
4. 每次 push 到 `main` 分支會自動部署

#### 方式 2: 手動部署

```bash
# 建置專案
npm run build

# 使用 wrangler 部署到 Pages
wrangler pages publish .output/public
```

### 驗證部署

```bash
# 測試 Workers API
curl https://snap-wall-api.your-subdomain.workers.dev/health

# 測試前端
open https://snap-wall.pages.dev
```

### Rollback

如果需要回滾到前一版本:

```bash
# Workers
wrangler rollback

# Pages (透過 Cloudflare Dashboard)
# Dashboard → Pages → snap-wall → Deployments → Rollback
```

---

## 疑難排解

### 問題 1: WebSocket 連接失敗

**症狀**: 前端無法建立 WebSocket 連接

**解決方案**:
```bash
# 檢查 Workers 是否啟動
curl http://localhost:8787/health

# 檢查 CORS 設定
# 確認 workers/.dev.vars 中的 CORS_ALLOWED_ORIGINS 包含前端 URL
```

### 問題 2: Durable Objects 無法初始化

**症狀**: `Error: Durable Object class not found`

**解決方案**:
```bash
# 刪除 .wrangler 快取目錄
rm -rf workers/.wrangler

# 重新啟動 Workers 開發伺服器
cd workers
npm run dev
```

### 問題 3: 測試失敗

**症狀**: 測試執行時出現 module not found

**解決方案**:
```bash
# 清除 node_modules 並重新安裝
rm -rf node_modules package-lock.json
npm install

# 清除測試快取
npm run test -- --clearCache
```

### 問題 4: Google Drive API 錯誤

**症狀**: `Error: Invalid credentials`

**解決方案**:
```bash
# 檢查 .env 檔案中的 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET
cat .env

# 確認 Google Cloud Console 中的憑證設定
# 1. 前往 https://console.cloud.google.com/apis/credentials
# 2. 檢查 OAuth 2.0 Client ID
# 3. 確認 Redirect URIs 包含 http://localhost:3000
```

### 問題 5: 效能問題

**症狀**: 照片載入緩慢

**診斷**:
```bash
# 檢查 Workers 效能
wrangler tail

# 檢查前端效能 (Chrome DevTools)
# 1. 開啟 Network tab
# 2. 檢查 waterfall 圖
# 3. 找出慢速請求
```

**優化建議**:
- 使用 Google Drive 縮圖而非完整圖片
- 實施虛擬滾動 (react-window)
- 啟用 Service Worker 快取

---

## 開發技巧

### 1. 使用 TypeScript 嚴格模式

確保 `tsconfig.json` 啟用嚴格模式:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. Linting 和 Formatting

```bash
# 執行 ESLint
npm run lint

# 自動修復 lint 錯誤
npm run lint:fix

# 執行 Prettier
npm run format
```

### 3. Git Hooks

專案使用 husky 和 lint-staged:

```bash
# 安裝 git hooks
npm run prepare

# Pre-commit hook 會自動執行:
# - ESLint
# - Prettier
# - Type checking
```

### 4. 除錯技巧

**前端除錯**:
```typescript
// 使用 React DevTools
import { useEffect } from 'react';

useEffect(() => {
  console.log('PhotoWall mounted', { activityId });
}, [activityId]);
```

**Workers 除錯**:
```typescript
// 使用 console.log (會顯示在 wrangler dev 輸出)
export async function handleRequest(request: Request) {
  console.log('Request received', {
    url: request.url,
    method: request.method,
  });
}
```

**WebSocket 除錯**:
```javascript
// Chrome DevTools → Network → WS
// 可以看到所有 WebSocket 訊息
```

---

## 資源連結

### 官方文件

- [TanStack Start](https://tanstack.com/start)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Google Drive API](https://developers.google.com/drive/api/v3/reference)

### 相關專案文件

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/api-spec.yaml)
- [WebSocket Protocol](./contracts/websocket-protocol.md)

### 社群資源

- [TanStack Discord](https://discord.com/invite/WrRKjPJ)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)

---

## 下一步

1. 閱讀 [Implementation Plan](./plan.md) 了解技術架構
2. 閱讀 [Data Model](./data-model.md) 了解資料結構
3. 執行 `/speckit.tasks` 生成實作任務清單
4. 開始實作! 🚀
