# Tasks: 活動照片牆

**Input**: Design documents from `/specs/001-event-photo-wall/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included following TDD principles as specified in the constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

**Project Structure**: Web application with TanStack Start (frontend) + Cloudflare Workers (backend)

- **Frontend**: `app/` (TanStack Start application)
- **Backend**: `workers/src/` (Cloudflare Workers)
- **Tests**: `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create repository structure with app/, workers/, and tests/ directories
- [X] T002 Initialize TanStack Start project in app/ directory (using src/ instead)
- [X] T003 Initialize Cloudflare Workers project in workers/ directory
- [X] T004 [P] Configure TypeScript 5.x with strict mode in tsconfig.json at root
- [X] T005 [P] Configure ESLint and Prettier in .eslintrc.js and .prettierrc
- [X] T006 [P] Setup Vitest configuration in vitest.config.ts
- [X] T007 [P] Setup Playwright configuration in playwright.config.ts
- [X] T008 [P] Configure Wrangler in workers/wrangler.toml for Durable Objects
- [X] T009 [P] Install frontend dependencies (React 18, TanStack Start, TanStack Query)
- [X] T010 [P] Install Workers dependencies (@cloudflare/workers-types, ulid)
- [X] T011 [P] Create .env template with PUBLIC_API_URL and PUBLIC_WS_URL
- [X] T012 [P] Create workers/.dev.vars template for local development
- [ ] T013 [P] Setup Git hooks with husky for pre-commit linting
- [X] T014 [P] Create README.md with project overview and setup instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T015 Create TypeScript type definitions in workers/src/models/Event.ts
- [X] T016 Create TypeScript type definitions in workers/src/models/Photo.ts
- [X] T017 Create TypeScript type definitions in workers/src/models/DanmakuMessage.ts
- [X] T018 Create TypeScript type definitions in workers/src/models/Session.ts
- [X] T019 [P] Implement ULID generator utility in workers/src/utils/ulid.ts
- [X] T020 [P] Implement activity ID generator (6-digit) in workers/src/utils/activityId.ts
- [X] T021 [P] Implement input validation utilities in workers/src/utils/validation.ts
- [X] T022 [P] Implement profanity filter in workers/src/utils/profanityFilter.ts (basic blacklist)
- [X] T023 Create EventRoom Durable Object skeleton in workers/src/durableObjects/EventRoom.ts
- [X] T024 Implement EventRoom state management (sessions Map, photos array, event object)
- [X] T025 Implement EventRoom WebSocket upgrade handler
- [X] T026 Implement EventRoom broadcast utility method
- [X] T027 Implement rate limiting logic in EventRoom
- [X] T028 Create Workers main entry point in workers/src/index.ts with routing
- [X] T029 [P] Setup CORS middleware in workers/src/index.ts (inline implementation)
- [X] T030 [P] Create error response utilities in workers/src/handlers/events.ts (inline implementation)
- [X] T031 [P] Create shared React components: ErrorBoundary in src/components/ErrorBoundary.tsx
- [X] T032 [P] Create WebSocket client hook in src/lib/websocket.ts
- [X] T033 [P] Create Google Drive utilities in src/lib/googleDrive.ts (upload, get URLs)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 3 - 無需登入快速加入 (Priority: P1) 🎯 MVP Foundation

**Goal**: 參與者可以透過活動代碼或 QR Code 快速加入活動,無需註冊登入

**Independent Test**: 參與者掃描 QR Code 或輸入 6 位數活動代碼,直接進入照片牆頁面

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T034 [P] [US3] Unit test for activity ID validation in tests/unit/workers/validation.test.ts
- [ ] T035 [P] [US3] Unit test for activity ID generation in tests/unit/workers/idGenerator.test.ts
- [ ] T036 [P] [US3] Integration test for event creation in tests/integration/workers/events.test.ts
- [ ] T037 [P] [US3] E2E test for joining via activity code in tests/e2e/join-activity.spec.ts
- [ ] T038 [P] [US3] E2E test for QR Code scan flow in tests/e2e/qr-code-join.spec.ts

### Implementation for User Story 3

- [X] T039 [P] [US3] Create event creation handler in workers/src/handlers/events.ts (POST /events)
- [X] T040 [P] [US3] Create event get handler in workers/src/handlers/events.ts (GET /events/:id)
- [ ] T041 [US3] Implement event initialization in EventRoom DO (handle /init endpoint)
- [ ] T042 [US3] Implement event validation and error handling in event handlers
- [X] T043 [P] [US3] Create home page route in app/routes/index.tsx (create/join activity)
- [X] T044 [P] [US3] Create event creation page in app/routes/event/create.tsx
- [ ] T045 [P] [US3] Create QRCodeDisplay component in app/components/QRCodeDisplay.tsx
- [ ] T046 [US3] Create activity join logic in app/routes/event/[eventId]/index.tsx
- [ ] T047 [US3] Implement session creation and storage (sessionStorage)
- [ ] T048 [US3] Add error handling for invalid/ended activities
- [ ] T049 [US3] Add session persistence (remember activity code after browser close)

**Checkpoint**: At this point, User Story 3 should be fully functional - users can create and join activities

---

## Phase 4: User Story 4 - 大螢幕即時顯示 (Priority: P1)

**Goal**: 大螢幕全螢幕顯示照片牆,展示即時照片和彈幕

**Independent Test**: 在大螢幕開啟顯示頁面,驗證 WebSocket 連接成功並能即時更新

### Tests for User Story 4

- [ ] T050 [P] [US4] Unit test for WebSocket client hook in tests/unit/lib/websocket.test.ts
- [ ] T051 [P] [US4] Integration test for WebSocket connection in tests/integration/workers/websocket.test.ts
- [ ] T052 [P] [US4] E2E test for display page real-time updates in tests/e2e/display-realtime.spec.ts

### Implementation for User Story 4

- [X] T053 [US4] Implement WebSocket join message handling in EventRoom
- [X] T054 [US4] Implement WebSocket ping/pong heartbeat in EventRoom
- [X] T055 [US4] Implement session tracking in EventRoom (add/remove sessions Map)
- [X] T056 [P] [US4] Create display page route in src/routes/event.$activityId_.display.tsx
- [X] T057 [P] [US4] Create PhotoWall component in src/components/PhotoWall.tsx (grid/masonry layout)
- [X] T058 [P] [US4] Create DanmakuCanvas component in src/components/DanmakuCanvas.tsx (Canvas API)
- [X] T059 [US4] Implement WebSocket connection in display page
- [X] T060 [US4] Handle 'joined' message and display initial photos
- [X] T061 [US4] Implement fullscreen mode toggle
- [X] T062 [US4] Add responsive design for different screen resolutions (1080p, 4K)
- [X] T063 [US4] Implement photo carousel for idle state (when no new content)

**Checkpoint**: At this point, User Stories 3 AND 4 work together - basic event flow is complete

---

## Phase 5: User Story 1 - 參與者即時上傳照片 (Priority: P1) 🎯 MVP Core

**Goal**: 參與者上傳照片到 Google Drive,即時顯示在照片牆上

**Independent Test**: 參與者上傳一張照片,在 3 秒內出現在大螢幕上

### Tests for User Story 1

- [ ] T064 [P] [US1] Unit test for photo upload to Google Drive in tests/unit/lib/googleDrive.test.ts
- [ ] T065 [P] [US1] Unit test for photo validation in tests/unit/workers/validation.test.ts
- [ ] T066 [P] [US1] Integration test for photo_added WebSocket message in tests/integration/workers/photo.test.ts
- [ ] T067 [P] [US1] E2E test for photo upload flow in tests/e2e/photo-upload.spec.ts
- [ ] T068 [P] [US1] E2E test for concurrent photo uploads in tests/e2e/concurrent-uploads.spec.ts

### Implementation for User Story 1

- [X] T069 [P] [US1] Create PhotoUpload component in app/components/PhotoUpload.tsx (file picker, preview)
- [X] T070 [US1] Implement photo compression in PhotoUpload (Canvas API, max 1920px)
- [X] T071 [US1] Implement Google Drive upload in app/lib/googleDrive.ts (using Folder ID)
- [X] T072 [US1] Implement upload progress tracking and display
- [X] T073 [US1] Implement retry mechanism for failed uploads
- [X] T074 [US1] Send photo_added WebSocket message after upload success
- [X] T075 [US1] Implement photo_added message handler in EventRoom DO
- [X] T076 [US1] Validate photo data (Drive file ID, URLs) in EventRoom
- [X] T077 [US1] Check rate limit (20 photos / 60 seconds) in EventRoom
- [X] T078 [US1] Add photo to EventRoom photos array with ULID
- [X] T079 [US1] Broadcast photo_added message to all connected clients
- [X] T080 [US1] Handle photo_added message in PhotoWall component (add photo to grid)
- [X] T081 [US1] Implement photo lazy loading with Intersection Observer
- [X] T082 [US1] Add error handling for Drive API failures

**Checkpoint**: At this point, complete photo upload and display flow works end-to-end

---

## Phase 6: User Story 2 - 發送彈幕留言 (Priority: P2)

**Goal**: 參與者發送彈幕留言,即時飄過大螢幕

**Independent Test**: 參與者輸入留言並發送,彈幕在 2 秒內從右向左飄過大螢幕

### Tests for User Story 2

- [ ] T083 [P] [US2] Unit test for profanity filter in tests/unit/workers/profanityFilter.test.ts
- [ ] T084 [P] [US2] Unit test for danmaku validation in tests/unit/workers/validation.test.ts
- [ ] T085 [P] [US2] Integration test for danmaku WebSocket message in tests/integration/workers/danmaku.test.ts
- [ ] T086 [P] [US2] E2E test for danmaku send flow in tests/e2e/danmaku-send.spec.ts
- [ ] T087 [P] [US2] E2E test for danmaku density control in tests/e2e/danmaku-density.spec.ts

### Implementation for User Story 2

- [ ] T088 [P] [US2] Create DanmakuInput component in app/components/DanmakuInput.tsx (textarea, character count)
- [ ] T089 [US2] Implement client-side danmaku validation (length ≤ 50 chars)
- [ ] T090 [US2] Implement client-side profanity filter (preview check)
- [ ] T091 [US2] Send danmaku WebSocket message on submit
- [ ] T092 [US2] Implement danmaku message handler in EventRoom DO
- [ ] T093 [US2] Validate danmaku content (length, profanity filter) in EventRoom
- [ ] T094 [US2] Check rate limit (1 danmaku / 2 seconds) in EventRoom
- [ ] T095 [US2] Generate ULID for danmaku message
- [ ] T096 [US2] Broadcast danmaku message to all clients (NO storage)
- [ ] T097 [US2] Handle danmaku message in DanmakuCanvas component
- [ ] T098 [US2] Implement danmaku animation (right to left, random Y position)
- [ ] T099 [US2] Implement danmaku density control (max 10 concurrent)
- [ ] T100 [US2] Implement danmaku queue for overflow messages

**Checkpoint**: All user stories are now independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T101 [P] Implement error logging and monitoring (console.log for Workers)
- [ ] T102 [P] Add performance monitoring (Web Vitals) in app/lib/analytics.ts
- [ ] T103 [P] Optimize bundle size with code splitting (lazy loading routes)
- [ ] T104 [P] Add loading states and skeleton screens for all async operations
- [ ] T105 [P] Implement graceful WebSocket reconnection with exponential backoff
- [ ] T106 [P] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T107 [P] Implement service worker for offline support (optional)
- [ ] T108 [P] Add end-to-end encryption for WebSocket messages (optional)
- [ ] T109 [P] Create deployment scripts in package.json (build, deploy, test)
- [ ] T110 [P] Setup CI/CD pipeline with GitHub Actions (.github/workflows/deploy.yml)
- [ ] T111 [P] Create production environment variables setup guide
- [ ] T112 Perform security audit (XSS, CSRF, rate limiting verification)
- [ ] T113 Run full E2E test suite and fix any failures
- [ ] T114 Verify performance benchmarks (FCP < 1.5s, WebSocket < 200ms)
- [ ] T115 Run quickstart.md validation (follow setup guide and verify all steps work)

---

## Constitution Compliance Checklist

**在完成所有實作後,必須驗證以下憲章合規性：**

### 代碼品質驗證
- [ ] 所有程式碼通過 linter 檢查（零警告）
- [ ] 所有程式碼通過 formatter 檢查
- [ ] 函式和類別遵循單一職責原則
- [ ] 變數和函式命名清晰且具描述性
- [ ] 無不必要的複雜度或過早優化

### 測試驗證
- [ ] 所有測試通過（單元、整合、E2E）
- [ ] 核心業務邏輯測試覆蓋率 ≥ 80%
- [ ] 每個使用者故事都有獨立的測試
- [ ] 測試遵循紅-綠-重構原則撰寫
- [ ] 無跳過或註解掉的測試

### 使用者體驗驗證
- [ ] 使用統一的設計系統和元件庫
- [ ] 符合 WCAG 2.1 AA 無障礙標準
- [ ] 所有使用者操作都有明確回饋
- [ ] 錯誤訊息清晰且提供解決方案
- [ ] 響應式設計在不同裝置上正常運作
- [ ] 超過 200ms 的操作都有載入狀態

### 效能驗證
- [ ] WebSocket 訊息延遲 < 200ms
- [ ] 前端 First Contentful Paint < 1.5s
- [ ] 互動響應時間 < 100ms
- [ ] Bundle 大小 < 200KB (gzipped)
- [ ] Workers CPU time < 50ms per request
- [ ] 關鍵效能指標已設定監控

### 安全性驗證
- [ ] 所有外部輸入都經過驗證和淨化
- [ ] 防護 XSS、CSRF 攻擊
- [ ] React 自動轉義輸出
- [ ] WebSocket origin 檢查實施
- [ ] Rate limiting 在 Durable Objects 中實施
- [ ] 照片存放在使用者 Google Drive（零資料儲存）
- [ ] 彈幕不持久化儲存

### Code Review 準則
- [ ] 至少一位審核者批准
- [ ] 審核者確認功能正確性
- [ ] 審核者確認測試充分
- [ ] 審核者確認代碼可讀性
- [ ] 審核者確認無明顯效能問題
- [ ] 審核者確認無安全漏洞
- [ ] 審核者確認符合專案慣例

### 最終檢查
- [ ] 無未解決的 TODO（除非有 issue 編號）
- [ ] 無未解決的 FIXME（除非有 issue 編號）
- [ ] 所有 commit 訊息清晰明確
- [ ] 實作符合原始計畫
- [ ] 如有違反憲章原則，已記錄充分理由

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US3 (P1): 無需登入快速加入 - **Must complete first** (foundation for all others)
  - US4 (P1): 大螢幕即時顯示 - Depends on US3 (needs event and WebSocket)
  - US1 (P1): 參與者即時上傳照片 - Depends on US3 + US4 (needs join flow and display)
  - US2 (P2): 發送彈幕留言 - Can be done in parallel with US1 after US3+US4
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

**Critical Path** (must be sequential):
1. **User Story 3** (無需登入快速加入) - Foundation
2. **User Story 4** (大螢幕即時顯示) - WebSocket infrastructure
3. **User Story 1** (參與者即時上傳照片) - Core feature

**Parallel Opportunities**:
- **User Story 2** (發送彈幕留言) can be developed in parallel with US1 after US3+US4 complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/Types before handlers
- Handlers before UI components
- Core implementation before integration
- Story complete before moving to next

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Tests within a user story marked [P] can run in parallel
- Implementation tasks within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
T064: Unit test for photo upload to Google Drive
T065: Unit test for photo validation
T066: Integration test for photo_added WebSocket message
T067: E2E test for photo upload flow
T068: E2E test for concurrent photo uploads

# Launch parallel implementation tasks:
T069: Create PhotoUpload component (frontend)
T075: Implement photo_added message handler (backend)
```

---

## Implementation Strategy

### MVP First (Minimal Viable Product)

**Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 = Complete MVP**

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 3 (Join activities)
4. Complete Phase 4: User Story 4 (Display page)
5. Complete Phase 5: User Story 1 (Photo upload)
6. **STOP and VALIDATE**: Test MVP end-to-end
7. Deploy/demo if ready

**MVP Delivers**:
- Users can create activities
- Users can join via activity code/QR Code
- Users can upload photos to Google Drive
- Photos appear on big screen in real-time
- Zero data storage (privacy-first)

### Incremental Delivery

1. MVP (US3 + US4 + US1) → Test independently → Deploy/Demo 🎯
2. Add User Story 2 (Danmaku) → Test independently → Deploy/Demo
3. Add Polish features → Final testing → Production release 🚀

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 3 (foundation)
   - Wait for US3 completion
3. After US3 complete:
   - **Developer B**: User Story 4 (display)
   - **Developer C**: Start US1 prep (write tests)
4. After US4 complete:
   - **Developer A**: User Story 1 (photos)
   - **Developer B**: User Story 2 (danmaku) - in parallel
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow the constitution checklist before final deployment
- Refer to quickstart.md for detailed development workflow

---

## Quick Reference

**Total Tasks**: 115
- Setup: 14 tasks
- Foundational: 19 tasks
- User Story 3 (P1): 16 tasks (11 impl + 5 tests)
- User Story 4 (P1): 14 tasks (11 impl + 3 tests)
- User Story 1 (P1): 19 tasks (14 impl + 5 tests)
- User Story 2 (P2): 18 tasks (13 impl + 5 tests)
- Polish: 15 tasks

**Parallel Opportunities**: 39 tasks marked [P]

**MVP Scope**: Phase 1 + 2 + US3 + US4 + US1 = 76 tasks

**Time Estimate** (rough):
- MVP: 2-3 weeks (1 developer)
- Full Feature: 3-4 weeks (1 developer)
- With 2 developers: 2-2.5 weeks for full feature
