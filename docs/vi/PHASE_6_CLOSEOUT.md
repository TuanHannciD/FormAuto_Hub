# PHASE_6_CLOSEOUT

## Mục đích

Ghi lại trạng thái closeout Phase 6 AI mapping/generation scoped follow-up sau khi hoàn thành implementation và live smoke verification.

## Trạng thái closeout

Status: Completed cho approved Phase 6 AI scoped slice.

Phase 6 AI scoped follow-up slice đã đóng. Các tính năng AI rộng hơn vẫn là Deferred.

Closeout này bao gồm scoped implementation đã được duyệt trong Phase 6 AI requirement package: ba chế độ sinh, cài đặt AI provider, prompt profiles, AI preview generation với credit multipliers, full audit trail, và safety guards. Live provider OpenAI-compatible chỉ được phép khi có runtime config rõ ràng.

## Scope Phase 6 AI đã hoàn thành

### Backend - Entities & Migrations mới

- `AiProviderSetting` entity với API key được mask và admin CRUD
- `AiPromptProfile` entity hỗ trợ 3 mode: `CurrentRules`, `FullAi`, `CustomAi`
- `AiQuestionPrompt` entity cho prompt tùy chỉnh theo từng câu hỏi
- `AiGenerationRun` entity với status lifecycle (Pending → InProgress → Completed/Failed)
- `AiGenerationRunItem` entity liên kết run với từng question prompt
- `GeneratedResponse` mở rộng với `AiGenerationRunItemId` FK và `Source = "Ai"`
- 4 EF Core migrations đã áp dụng sạch sẽ
- Provider secret protection qua `AiProviderSecretProtector` masking

### Backend - AI Provider Adapters

- `DeterministicAiProviderAdapter` - output xác định, chỉ dùng cho local/test config
- `OpenAiCompatibleProviderAdapter` - gọi live OpenAI-compatible (DeepSeek, OpenAI, v.v.), chỉ dùng khi có runtime config rõ ràng
- `DisabledAiProviderAdapter` - fail-safe no-op mặc định
- `AiProviderModels` registry với model metadata và token limits
- Provider health-check qua `AiProviderCheckStatuses`

### Backend - AI Generation Service

- `AiGenerationService.GeneratePreviewAsync` điều phối toàn bộ pipeline:
  1. Prompt guard check qua `AiPromptGuardService`
  2. Credit validation với mode-specific multiplier (x1/x2/x3)
  3. Gọi provider cho từng câu hỏi với retry (tối đa 2 lần/call)
  4. Output validation qua `AiOutputValidator`
  5. Credit deduction qua `CreditTransactionService`
  6. Full audit writes: `AiGenerationRuns` → `AiGenerationRunItems` → `GeneratedResponses`
  7. `UsageLogs` write
- Parallel batch generation với configurable concurrency
- Graceful degradation: trả về partial results khi từng câu hỏi lỗi

### Backend - Safety Guards

- `AiPromptGuardService` chặn các mẫu prompt nguy hiểm (injection, system override, v.v.)
- `AiOutputValidator` kiểm tra max length, nội dung cấm, format constraints
- `AiSafetyTextRules` định nghĩa blocked patterns và content rules
- Prompt profiles giới hạn theo form project qua `AiPromptProfileLimits`

### Backend - API Endpoints

- `POST /api/v1/ai/generate` - AI preview generation (đã xác thực)
- `GET/POST/PUT/DELETE /api/v1/admin/ai-provider-settings` - admin CRUD
- `GET/POST/PUT/DELETE /api/v1/ai-prompt-profiles` - prompt profile CRUD

### Frontend

- Trang admin AI provider settings (`/admin/ai-provider-settings`) với masked API key display
- Trang form automation workflow mở rộng với 3 generation mode selector
- Credit multiplier labels hiển thị theo mode (x1/x2/x3)
- AI-generated responses hiển thị với badge `Source = "Ai"` và confidence indicator
- Preview accordion UI được giữ cho AI-generated responses

### Tài liệu

- `PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md` trong cả `docs/ai` và `docs/vi`
- Model benchmark documentation đã thêm
- API contracts, domain entities, architecture boundaries, module map, tech stack decisions đã cập nhật
- Environment setup docs đã cập nhật với AI provider configuration

## Architecture boundaries được giữ

- Controllers chỉ xử lý HTTP request/response.
- `AiGenerationService` điều phối AI generation workflow.
- `AiProviderSettingsService` xử lý provider CRUD và secret protection.
- `AiPromptProfileService` xử lý business rules và limits của prompt profile.
- AI provider adapters nằm trong `Integrations/AI/` và xử lý external calls.
- `CreditTransactionService` xử lý mọi credit deduction với ledger writes.
- Entities không gọi external APIs.
- Google Forms integration không bị trộn vào AI services.
- Deferred integrations không bị stub như production-complete features.

## Credit & Audit Trail

Chuỗi 5 bảng audit đã được verify end-to-end qua live HTTP smoke:

| # | Bước | Bảng | Đã verify |
|---|------|------|-----------|
| 1 | Tạo generation run | `AiGenerationRuns` | ✅ |
| 2 | Tạo per-question items | `AiGenerationRunItems` | ✅ |
| 3 | Lưu AI responses | `GeneratedResponses` | ✅ |
| 4 | Trừ credit với ledger | `CreditTransactions` | ✅ |
| 5 | Ghi usage event | `UsageLogs` | ✅ |

Credit multipliers:
- Option 1 (Quy tắc hiện tại): **x1** - dùng answer rules có sẵn, không gọi AI
- Option 2 (AI mặc định): **x2** - một lần gọi AI sinh tất cả câu trả lời
- Option 3 (AI tùy chỉnh): **x3** - gọi AI riêng cho từng câu hỏi với prompt tùy chỉnh



## A1 — AI Usage Analytics Dashboard (Follow-up đã hoàn thành)

Sau Phase 6 closeout, một follow-up scoped implement dashboard thống kê AI cho cả admin và user.

### API Endpoints

- `GET /api/dashboard/ai-usage` — thống kê AI theo user
- `GET /api/admin/ai-usage` — thống kê tổng quan cho admin
- `GET /api/admin/ai-usage/runs` — danh sách lượt AI có phân trang và bộ lọc (status, mode, provider, model, ngày)

### Giao diện User

- Trang `/dashboard/ai-usage` hiển thị:
  - Thẻ metric: tổng lượt AI, tỉ lệ thành công, credit đã dùng, previews đã tạo
  - Thẻ phân tích theo mode (Option 2 / Option 3)
  - Biểu đồ cột sử dụng theo ngày (30 ngày)
  - Bảng 10 lượt AI gần đây

### Giao diện Admin

- Trang `/admin/ai-usage` với hai tab:
  - **Tổng quan** — đầy đủ số liệu: thẻ metric, phân tích mode, bảng hiệu suất provider, bảng top users, biểu đồ ngày
  - **Lịch sử** — bảng lượt AI có phân trang với bộ lọc: status dropdown, mode dropdown, provider text, model text, từ ngày/đến ngày, điều khiển phân trang

### Hiệu suất Provider

- Đếm thành công/thất bại theo cặp (provider, model)
- Thời gian trung bình (milliseconds) cho các run hoàn thành
- Dữ liệu được materialize client-side để tránh lỗi EF Core LINQ translation

### API Paged Runs

- Tham số query: `page` (mặc định 1), `pageSize` (mặc định 20, tối đa 100), `status`, `mode`, `provider`, `model`, `fromDate`, `toDate`
- Response: `{ items, page, pageSize, totalItems, totalPages }`
- Chỉ admin, sắp xếp theo `CreatedAt` giảm dần

### Data Model

- Tất cả query read-only từ bảng `AiGenerationRuns` hiện có
- Email người dùng lấy từ bảng `Users` cho top-users display
- Không có entity, migration hay DB change mới

### Scope Notes

- Chỉ query từ bảng hiện có; không entity mới
- Frontend dùng các component có sẵn: `BaseTable`, `PaginationControls`, `Badge`, `StatusBadge`
- Không có lazy loading, CSV export hay notifications — các tính năng này vẫn Deferred

## Deferred items được giữ

Implementation không thêm:

- Full production AI generation workflow ngoài scoped preview
- AI auto-submit không có preview và confirmation
- AI model fine-tuning hoặc training
- AI response caching hoặc prompt optimization
- Real-time streaming AI responses
- AI-powered form analysis (phát hiện cấu trúc form)
- Multi-provider fallback hoặc load balancing
- Google Forms API integration
- Payment gateway changes
- New user-facing AI features ngoài 3 mode đã duyệt

## Validation summary

### Verified

- `dotnet build FormAutoHub.sln -c Release` passed: 0 warnings, 0 errors.
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: **88 tests passed, 0 failed** (tăng từ 40 của Phase 9).
- `npm run build` passed trong `apps/web`.
- EF Core migration list succeeded.
- EF Core pending model changes check passed, không có pending changes.

### Live HTTP AI Generation Smoke (DeepSeek v4-flash)

| Lần | Mode | Items | Đã sinh | Credits | Audit | Time | Kết quả |
|-----|------|-------|---------|---------|-------|------|---------|
| 1 | Option 2 (Full AI, x2) | 15 | 15 hợp lệ | -2.00 | 5 bảng ✅ | ~12s | Thành công |
| 2 | Option 3 (Custom AI, x3) | 15 | 30 hợp lệ | -6.00 | 5 bảng ✅ | ~15s | Thành công |

### Browser Smoke (Playwright)

Cả 3 generation mode hiển thị đúng trên trang form automation workflow:
- Option 1 (Quy tắc hiện tại, x1): preview sinh từ answer rules có sẵn ✅
- Option 2 (AI mặc định, x2): AI-generated preview với badge `Source = "Ai"` ✅
- Option 3 (AI tùy chỉnh, x3): custom AI preview với prompt từng câu hỏi ✅

### Not run

- Chưa chạy live smoke với AI provider khác (OpenAI, Groq).
- Chưa chạy load/stress testing với concurrent AI generation.
- Chưa chạy browser smoke với mobile viewport cho AI generation.
- Chưa chạy full end-to-end user journey từ registration đến AI generation.

## Rủi ro còn lại

- Live AI provider behavior phụ thuộc external API availability và rate limits.
- Model metadata fallback có thể giảm performance với model không được nhận diện.
- Deterministic adapter chỉ dùng cho development; production phải dùng live provider.
- AI output quality phụ thuộc provider và model được cấu hình.
- Prompt profiles chưa được validate với form context lúc save.

## Phase 6 exit criteria đã đạt

- [x] Ba generation mode đã implement và verify
- [x] AI provider settings admin CRUD hoạt động
- [x] Prompt profile CRUD hoạt động
- [x] AI preview generation endpoint đã live-verify
- [x] Credit multipliers được enforce (x1/x2/x3)
- [x] Full 5-table audit trail đã verify
- [x] Safety guards (prompt + output) đã implement
- [x] Provider adapters với fail-safe defaults
- [x] Parallel batch generation đã implement
- [x] Tài liệu đồng bộ giữa `docs/ai` và `docs/vi`

