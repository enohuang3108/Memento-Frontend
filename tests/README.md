# Memento 測試文件

本專案使用兩種測試框架:
- **Vitest**: 單元測試 (驗證函式、工具函式等)
- **Playwright**: E2E 測試 (API 端點、完整工作流程)

## 📁 測試結構

```
tests/
├── README.md                    # 本文件
├── fixtures/                    # 測試用的固定資料
│   └── test-image.png          # 1x1 測試圖片
├── e2e/                        # Playwright E2E 測試
│   └── api/                    # API E2E 測試
│       ├── oauth.spec.ts       # OAuth 授權測試
│       ├── events.spec.ts      # 活動管理測試
│       ├── upload.spec.ts      # 照片上傳測試
│       └── cors.spec.ts        # CORS 測試
└── workers/                     # Vitest 單元測試
    └── validation.test.ts      # 驗證函式測試
```

## 🚀 執行測試

### 前置條件

**確保系統已授權 OAuth** (E2E 測試需要):
```bash
curl http://localhost:8787/admin/token/status | jq .
# 應該看到 "authorized": true
```

### 執行單元測試 (Vitest)

```bash
# 執行所有單元測試
pnpm test

# 只執行特定測試檔案
pnpm test:unit tests/workers/validation.test.ts

# Watch 模式
pnpm test:watch

# 產生覆蓋率報告
pnpm test:coverage
```

### 執行 E2E 測試 (Playwright)

**Playwright 會自動啟動和停止 worker，不需手動啟動！**

```bash
# 執行所有 API E2E 測試 (自動管理 worker)
pnpm test:e2e

# 只執行 API 測試
pnpm test:e2e:api

# 以 headed 模式執行 (可看到測試過程)
pnpm test:e2e:headed

# 以 debug 模式執行 (可逐步除錯)
pnpm test:e2e:debug

# 執行 UI E2E 測試 (未來實作)
pnpm test:e2e:ui
```

### 執行所有測試

```bash
# 執行單元測試 + E2E 測試
pnpm test:all
```

## 📝 測試說明

### 單元測試 (Vitest)

#### validation.test.ts
測試核心驗證邏輯:

**Photo Upload Validation**
- ✓ 驗證正確的照片資料
- ✓ 拒絕無效的 driveFileId、thumbnailUrl、fullUrl

**Danmaku Content Validation**
- ✓ 驗證正確的彈幕內容
- ✓ 拒絕空內容
- ✓ 拒絕超過 50 字元的內容
- ✓ 正確處理 Unicode 字元

**Activity ID Generation**
- ✓ 產生 6 位數字 ID
- ✓ 確保 ID 的唯一性 (>90%)
- ✓ 驗證數字範圍 (000000-999999)

### E2E 測試 (Playwright)

#### oauth.spec.ts
測試系統級 OAuth 授權:

- ✓ 檢查系統 token 狀態 (`/admin/token/status`)
- ✓ 取得授權 URL (`/admin/auth/google`)

#### events.spec.ts
測試活動管理完整流程:

**Health Check**
- ✓ 檢查 `/health` 端點是否正常回應

**Event CRUD**
- ✓ 建立新活動 (`POST /events`)
  - 使用測試用的 Google Drive Folder ID: `1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6`
- ✓ 驗證必填欄位 (拒絕沒有 driveFolderId 的請求)
- ✓ 取得活動詳情 (`GET /events/:id`)
- ✓ 驗證不存在的活動回傳 404
- ✓ 結束活動 (`DELETE /events/:id`)
- ✓ 驗證已結束的活動狀態

#### upload.spec.ts ⭐
測試照片上傳到 Google Drive:

- ✓ 上傳照片到 Google Drive (`POST /upload`)
  - 使用 `tests/fixtures/test-image.png` (1x1 pixel PNG)
  - 驗證回傳的 Drive file ID 和 URLs
  - **實際上傳到 Google Drive 測試**
- ✓ 驗證必填欄位 (activityId)
- ✓ 拒絕非圖片檔案
- ✓ 拒絕無效的 activityId

#### cors.spec.ts
測試 CORS 設定:

- ✓ 驗證 CORS headers
- ✓ 處理 OPTIONS preflight 請求
- ✓ 確認允許的 HTTP methods

## 🔧 測試設定

### 環境變數

測試使用以下環境變數 (從 `.env` 或預設值):

```env
# E2E 測試會使用這個 URL (預設: http://localhost:8787)
VITE_API_URL=http://localhost:8787
```

### 測試資料

- **Google Drive Folder ID**: `1QvBCmxEWaJAzY0oxmaXkvTQFmxenQ2Y6`
  - 這是測試專用的資料夾
  - 測試上傳的照片會存到這個資料夾
  - **注意**: 需要先完成系統 OAuth 授權才能上傳

### Playwright 配置

Playwright 會自動:
- 啟動 worker 於 `http://localhost:8787`
- 等待 `/health` 端點回應 200
- 執行完測試後自動停止 worker

如果 worker 已經在運行，Playwright 會重用現有的伺服器。

## 🐛 除錯測試

### Vitest 除錯

```bash
# 查看詳細輸出
pnpm test -- --reporter=verbose

# 只執行失敗的測試
pnpm test -- --bail=1

# 以 UI 模式執行 (互動式介面)
pnpm vitest --ui
```

### Playwright 除錯

```bash
# Debug 模式 (逐步執行)
pnpm test:e2e:debug

# Headed 模式 (看到瀏覽器)
pnpm test:e2e:headed

# 產生 HTML 報告
pnpm test:e2e
# 報告會儲存在 playwright-report/ 目錄
```

### 手動檢查 API

```bash
# 健康檢查
curl http://localhost:8787/health | jq .

# OAuth 狀態
curl http://localhost:8787/admin/token/status | jq .
```

## 📊 測試覆蓋率

| 測試類型 | 覆蓋範圍 | 狀態 |
|---------|---------|------|
| **Vitest 單元測試** | 驗證函式、工具函式 | ✓ 完整覆蓋 |
| **Playwright E2E** | API 端點、完整流程 | ✓ 完整覆蓋 |
| **UI E2E** | 使用者介面流程 | 📋 待實作 |

### 測試數量統計

- **單元測試**: 12 個測試 (validation.test.ts)
- **E2E 測試**: 14+ 個測試 (4 個測試檔案)
- **總計**: 26+ 個測試

## 🔐 注意事項

### OAuth 授權要求

E2E 測試中的**照片上傳測試**需要系統已完成 OAuth 授權:

1. 確保已完成系統授權 (參考 `SYSTEM_AUTH_SETUP.md`)
2. 驗證授權狀態:
   ```bash
   curl http://localhost:8787/admin/token/status | jq .
   ```
   應該看到:
   ```json
   {
     "authorized": true,
     "hasRefreshToken": true,
     ...
   }
   ```

**注意**: Playwright 會自動啟動 worker，不需手動啟動！

### 清理測試資料

測試結束後,測試上傳的照片會保留在 Google Drive 資料夾中。
如需清理,可以手動刪除測試資料夾中的照片。

## 🎯 CI/CD 整合

### 使用 Playwright (推薦)

Playwright 會自動管理 worker 生命週期，簡化 CI 配置:

```bash
# 安裝依賴
pnpm install

# 安裝 Playwright browsers (CI 環境需要)
pnpm playwright install --with-deps

# 執行所有測試 (Playwright 會自動啟動/停止 worker)
pnpm test:all
```

### 手動管理 Worker (舊方法)

```bash
# 安裝依賴
pnpm install

# 啟動 worker (背景執行)
cd workers && pnpm dev &
WORKER_PID=$!

# 等待 worker 啟動
sleep 5

# 執行單元測試
pnpm test

# 關閉 worker
kill $WORKER_PID
```

## 🏗️ 測試架構優勢

### 關注點分離

- **Vitest**: 快速的單元測試，專注於邏輯驗證
- **Playwright**: 完整的 E2E 測試，包含環境隔離和自動化

### Playwright 優勢

1. **自動化環境管理**: 自動啟動/停止 worker
2. **更好的隔離**: 每個測試檔案獨立運行
3. **內建 API 測試**: 使用 `request` fixture 進行 HTTP 請求
4. **豐富的除錯工具**: UI mode、trace viewer、headed mode
5. **支援未來 UI 測試**: 同一框架可測試 API 和 UI

## 📚 相關資源

- [Vitest 文件](https://vitest.dev/)
- [Playwright 文件](https://playwright.dev/)
- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)
- [專案 API 文件](../SYSTEM_AUTH_SETUP.md)
