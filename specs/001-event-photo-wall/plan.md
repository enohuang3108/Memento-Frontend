# Implementation Plan: 活動照片牆

**Branch**: `001-event-photo-wall` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-photo-wall/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

活動照片牆是一個即時互動平台,讓活動參與者可以透過手機上傳照片和發送彈幕留言,即時顯示在大螢幕上。核心特點包括:

- **零資料儲存架構**: 照片存放在參與者自己的 Google Drive 公開資料夾,彈幕不持久化
- **無需註冊登入**: 使用活動代碼或 QR Code 即可加入
- **即時互動**: WebSocket 連接實現照片和彈幕的即時推送
- **Serverless 架構**: 使用 Cloudflare Workers 和 Durable Objects 實現高擴展性

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+
**Primary Dependencies**:
- **Frontend**: React, TanStack Start (full-stack React framework), TanStack Query, WebSocket client
- **Backend**: Cloudflare Workers (Serverless 網關), Cloudflare Durable Objects (狀態管理和 WebSocket)
- **Storage**: Google Drive API (照片存放), Cloudflare KV (活動 metadata, 可選)
- **ID Generation**: ULID (時間排序 ID), Deterministic activity_id (活動識別碼)

**Testing**: Vitest (單元測試), Playwright (E2E 測試), Miniflare (Workers 本地測試)

**Target Platform**: Web (桌面和行動瀏覽器), 特別優化 iOS Safari 15+, Android Chrome 90+

**Project Type**: Web application (前後端全棧,使用 TanStack Start 的 SSR/RSC 架構)

**Performance Goals**:
- WebSocket 訊息延遲 < 200ms
- 照片顯示延遲 < 3 秒 (從上傳到顯示)
- 前端 FCP < 1.5s, FID < 100ms
- 支援單一活動 500 並發使用者,多活動總計 2000 使用者

**Constraints**:
- Cloudflare Workers 限制: CPU time < 50ms/request (標準), 記憶體 < 128MB
- Durable Objects: 每個 DO 實例最多 500 個並發 WebSocket 連接
- Google Drive API: 每日配額限制,需實施快取和重試機制
- Bundle 大小: 初始載入 < 200KB (gzipped)

**Scale/Scope**:
- 目標: 2000 並發使用者,100 個同時進行的活動
- 照片: 每個活動最多 500 張照片
- 彈幕: 即時傳輸不儲存,無數量限制

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

根據 `.specify/memory/constitution.md` 檢查以下原則合規性：

### 代碼品質檢查
- [x] 遵循單一職責原則 - 每個元件/handler/DO 都有明確的單一職責
- [x] 命名清晰且具描述性 - 使用語義化命名 (Event, Photo, DanmakuMessage, EventRoom)
- [x] 避免過早優化 - 專注於簡單直接的解決方案,效能優化基於明確需求
- [x] 符合專案編碼風格 - 使用 TypeScript strict mode, ESLint, Prettier

### 測試驅動開發檢查
- [x] 測試優先策略已規劃 - TDD 流程在 quickstart.md 中明確定義
- [x] 測試覆蓋率目標設定（核心邏輯 ≥ 80%） - 目標設定在 research.md 第8節
- [x] 包含單元、整合和契約測試計畫 - Vitest (單元), Miniflare (整合), Playwright (E2E)

### 使用者體驗檢查
- [x] 設計系統已定義或複用 - 使用 TanStack Start 元件,響應式設計
- [x] 無障礙性要求（WCAG 2.1 AA）已考慮 - 在憲章中要求,需在實作時遵循
- [x] 錯誤處理和使用者回饋機制已設計 - WebSocket error types, 友善錯誤訊息
- [x] 響應式設計已規劃 - 支援桌面和行動裝置 (iOS Safari, Android Chrome)

### 效能標準檢查
- [x] API 響應時間目標 < 200ms (95th percentile) - WebSocket 延遲 < 200ms
- [x] 前端效能目標已設定（FCP < 1.5s） - FCP < 1.5s, FID < 100ms, Bundle < 200KB
- [x] 資源使用限制已定義 - Workers CPU < 50ms, DO memory < 128MB
- [x] 擴展性需求已評估 - 2000 並發使用者,100 個同時活動

### 安全性檢查
- [x] 輸入驗證策略已規劃 - data-model.md 中定義所有驗證規則
- [x] 常見攻擊防護（XSS, SQL Injection, CSRF）已考慮 - React 自動轉義, WebSocket origin check, rate limiting
- [x] 敏感資料保護機制已設計 - 零持久化儲存,照片在使用者 Google Drive
- [x] 權限控制已定義 - Session-based access control, rate limiting per session

**Result**: ✅ All checks passed - Ready for implementation

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                           # TanStack Start 應用程式
├── routes/                    # 檔案系統路由
│   ├── index.tsx              # 首頁 (建立/加入活動)
│   ├── event/
│   │   ├── [eventId]/
│   │   │   ├── index.tsx      # 參與者頁面 (上傳照片/彈幕)
│   │   │   └── display.tsx    # 大螢幕顯示頁面
│   │   └── create.tsx         # 建立活動頁面
│   └── api/                   # API 路由 (代理到 Workers)
│       ├── events.ts          # 活動管理
│       └── ws.ts              # WebSocket 升級端點
├── components/                # React 元件
│   ├── PhotoWall.tsx          # 照片牆元件 (瀑布流/網格)
│   ├── DanmakuCanvas.tsx      # 彈幕畫布 (Canvas API)
│   ├── PhotoUpload.tsx        # 照片上傳元件
│   ├── QRCodeDisplay.tsx      # QR Code 顯示
│   └── ErrorBoundary.tsx      # 錯誤邊界
├── lib/                       # 工具函式和 hooks
│   ├── googleDrive.ts         # Google Drive API 封裝
│   ├── websocket.ts           # WebSocket 客戶端
│   ├── ulid.ts                # ULID 生成器
│   └── profanityFilter.ts     # 敏感詞過濾
└── styles/                    # 樣式檔案

workers/                       # Cloudflare Workers 後端
├── src/
│   ├── index.ts               # Workers 主入口
│   ├── durableObjects/
│   │   └── EventRoom.ts       # Durable Object: 活動房間
│   ├── handlers/
│   │   ├── events.ts          # 活動 CRUD
│   │   ├── photos.ts          # 照片處理
│   │   └── danmaku.ts         # 彈幕處理
│   ├── models/
│   │   ├── Event.ts           # 活動模型
│   │   ├── Photo.ts           # 照片參考模型
│   │   └── Session.ts         # Session 模型
│   └── utils/
│       ├── idGenerator.ts     # activity_id 生成器
│       └── validation.ts      # 輸入驗證
└── wrangler.toml              # Workers 設定

tests/
├── unit/                      # 單元測試 (Vitest)
│   ├── components/
│   ├── lib/
│   └── workers/
├── integration/               # 整合測試
│   └── workers/               # Workers + DO 測試
└── e2e/                       # E2E 測試 (Playwright)
    ├── participant-flow.spec.ts
    └── display-flow.spec.ts
```

**Structure Decision**:

採用 **Web Application** 架構,結合 TanStack Start (full-stack) 和 Cloudflare Workers:

1. **前端** (`app/`): 使用 TanStack Start 的檔案系統路由,支援 SSR/RSC
2. **後端** (`workers/`): Cloudflare Workers 處理 API 請求和 WebSocket 連接
3. **Durable Objects**: `EventRoom` DO 管理每個活動的狀態和 WebSocket 連接
4. **無傳統資料庫**: 照片在 Google Drive,活動 metadata 在 Durable Objects 記憶體中

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
