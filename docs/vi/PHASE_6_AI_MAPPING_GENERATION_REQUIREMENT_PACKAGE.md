# PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE

## TOC

- [Mục đích](#mục-đích) (45)
- [Trạng thái duyệt hiện tại](#trạng-thái-duyệt-hiện-tại) (51)
- [Phase fit](#phase-fit) (107)
- [Tiến độ hiện tại của scoped slice](#tiến-độ-hiện-tại-của-scoped-slice) (117)
- [Mục tiêu sản phẩm](#mục-tiêu-sản-phẩm) (135)
- [Các generation mode](#các-generation-mode) (151)
  - [Option 1 - Mode mặc định rule-based](#option-1-mode-mặc-định-rule-based) (153)
  - [Option 2 - Full AI mode](#option-2-full-ai-mode) (171)
  - [Option 3 - Custom AI mode](#option-3-custom-ai-mode) (187)
- [Lưu prompt](#lưu-prompt) (202)
- [AI Provider Settings](#ai-provider-settings) (215)
- [Credit rules](#credit-rules) (256)
- [AI Audit](#ai-audit) (298)
- [AI Output Validation Rules](#ai-output-validation-rules) (333)
- [Prompt Guard Rules](#prompt-guard-rules) (361)
- [Giới hạn độ dài prompt](#giới-hạn-độ-dài-prompt) (389)
- [UI Requirements](#ui-requirements) (399)
- [Proposed API Areas](#proposed-api-areas) (436)
- [Proposed Module Ownership](#proposed-module-ownership) (455)
- [Delivery Pass Plan](#delivery-pass-plan) (469)
  - [Pass 1 - Requirement and contract docs](#pass-1-requirement-and-contract-docs) (471)
  - [Pass 2 - API and DB contract review](#pass-2-api-and-db-contract-review) (479)
  - [Pass 3 - AI provider settings](#pass-3-ai-provider-settings) (488)
  - [Pass 4 - AI backend boundary](#pass-4-ai-backend-boundary) (500)
  - [Pass 5 - Prompt profile backend](#pass-5-prompt-profile-backend) (511)
  - [Pass 6 - AI generate API](#pass-6-ai-generate-api) (520)
  - [Pass 7 - Frontend UI](#pass-7-frontend-ui) (540)
  - [Pass 8 - Validation and review](#pass-8-validation-and-review) (551)
- [AI Provider Config Reference](#ai-provider-config-reference) (576)
  - [Cách batch splitting hoạt động](#cách-batch-splitting-hoạt-động) (587)
- [AI Model Compatibility Notes](#ai-model-compatibility-notes) (601)
- [Nhóm việc có thể chạy song song an toàn](#nhóm-việc-có-thể-chạy-song-song-an-toàn) (619)
  - [Combo A - Provider settings](#combo-a-provider-settings) (623)
  - [Combo B - AI safety core](#combo-b-ai-safety-core) (634)
  - [Combo C - Prompt profile](#combo-c-prompt-profile) (646)
  - [Combo D - Frontend visual mode preparation](#combo-d-frontend-visual-mode-preparation) (658)
- [Việc phải chạy tuần tự](#việc-phải-chạy-tuần-tự) (666)
- [Validation Expectations](#validation-expectations) (676)
- [Stop Conditions](#stop-conditions) (709)

## Mục đích

Định nghĩa gói requirement đã được duyệt và ranh giới implementation hiện tại cho slice Phase 6 AI mapping/generation.

Tài liệu này ghi lại hướng sản phẩm đã được user duyệt và các vùng contract vẫn phải review riêng.

## Trạng thái duyệt hiện tại

Đã duyệt cho planning và contract package:

- ba mode tạo câu trả lời cho form automation
- AI provider settings là phần setup bắt buộc
- lưu AI prompt cho các AI mode
- AI mode sinh trực tiếp preview responses
- credit multiplier cho AI preview generation
- AI audit đầy đủ với raw provider request/response
- prompt guard và output guard chống abuse
- thứ tự delivery pass và nhóm việc có thể chạy song song an toàn

Đã duyệt có điều kiện cho scoped implementation planning:

- Phase 6 AI mapping/generation được chuyển từ candidate package sang implementation planning và scoped implementation.
- Approval này chưa mở toàn bộ production AI generation workflow cùng lúc.
- `Worker J - AI Generate API` đã được unblock sau khi provider settings, prompt profile, prompt guard, output validator, credit contract, và audit contract được implement và review.
- Backend AI preview generation endpoint đã được implement cho scoped slice đã duyệt.
- Runtime AI provider execution mặc định fail-safe: deterministic adapter chỉ được dùng khi bật rõ qua cấu hình local/test, và OpenAI-compatible live adapter chỉ được dùng khi bật rõ qua runtime configuration.
- OpenAI-compatible live provider calls dùng provider/model/Base URL/API key do admin lưu được duyệt cho scoped slice này.
- Năm khái niệm persistence AI được duyệt thành table riêng, nhưng vẫn cần DB proposal cuối trước khi tạo migration:
  - `AiProviderSettings`
  - `AiPromptProfiles`
  - `AiQuestionPrompts`
  - `AiGenerationRuns`
  - `AiGenerationRunItems`
- Không được lưu AI prompts trong `AnswerRules.ConfigJson`.
- `AiPromptProfiles` nên unique theo `ProjectId + Mode`.
- `AiQuestionPrompts` nên unique theo `ProfileId + QuestionId`.
- `AiGenerationRunItems.GeneratedResponseId` được nullable cho evidence của output invalid hoặc rejected.
- Status của `AiGenerationRun` được duyệt gồm `Pending`, `Running`, `Succeeded`, `Partial`, và `Failed`.
- Transition được duyệt là `Pending -> Running -> Succeeded | Partial | Failed`.
- Terminal status không được đổi tiếp; retry phải tạo run mới.
- Provider và model identifiers là chuỗi do admin kiểm soát và lưu server-side; backend validation yêu cầu giá trị không rỗng và không được trở thành quyền quyết định tùy ý từ normal frontend.
- Custom Base URL support và OpenAI-compatible gateway calls chỉ được duyệt cho scoped server-side admin settings và adapter path.
- Option 2 default AI prompt/profile persistence theo project được duyệt.
- Option 3 global prompt và per-question prompt persistence theo project được duyệt.
- Prompt auto-fill miễn phí.
- Giới hạn độ dài prompt ban đầu được duyệt làm guardrail: short context field 200 ký tự, global prompt 2,000 ký tự, per-question prompt 1,000 ký tự, và total prompt payload per run 20,000 ký tự.
- Credit multiplier được duyệt là Option 1 `x1`, Option 2 `x2`, và Option 3 `x3`.
- AI audit đầy đủ là bắt buộc ngay từ implementation đầu tiên.
- Raw provider request/response hiện chỉ admin/debug được xem và không được hiển thị cho normal users.
- Frontend AI mode preparation được bắt đầu chỉ khi không bind vào real API chưa ổn định.

Vẫn cần proposal hoặc review riêng trước broader production rollout:

- live provider/model catalog validation ngoài required local configuration checks
- provider-specific SDK adapters ngoài OpenAI-compatible HTTP contract
- API đọc danh sách/chi tiết AI generation run cho normal-user hoặc admin audit
- pagination, filtering, và authorization details cụ thể cho AI audit read APIs
- raw payload retention và redaction policy
- raw OpenAI-compatible gateway behavior ngoài chat completions adapter đã duyệt
- frontend/API binding bổ sung ngoài scoped slice đã duyệt
- production browser closeout sau khi live provider adapter được duyệt

## Phase fit

Current global project phase vẫn là: Phase 9 closeout completed; next phase not selected.

Active approved follow-up slice: không có. Phase 6 AI mapping/generation scoped implementation đã hoàn thành; package này giữ vai trò historical scope và contract context.

Package này dành cho một candidate production integration thuộc Phase 6. Checklist đã duyệt cho phép scoped implementation planning, một số prerequisite implementation work, và backend AI preview generation endpoint sau prerequisite review.

Điều này chưa mở full production AI provider integration, frontend/API scope ngoài scoped binding đã duyệt, broad raw-audit exposure, hoặc AI auto-submit.

## Tiến độ hiện tại của scoped slice

| Khu vực | Trạng thái hiện tại |
|---|---|
| AI provider settings backend | Đã implement cho scoped slice |
| Admin AI provider config UI | Đã implement cho scoped slice |
| AI prompt profile persistence | Đã implement cho scoped slice |
| AI generate preview API | Đã implement cho scoped slice |
| Normal-user AI mode UI/API binding | Đã implement cho scoped slice |
| Runtime deterministic AI adapter | Chỉ được dùng khi bật rõ qua cấu hình local/test |
| Live OpenAI-compatible provider calls | Đã implement cho scoped slice phía sau runtime configuration rõ ràng |
| Broad AI audit read UI/API và raw payload exposure | Deferred |
| Custom base URL và live OpenAI-compatible gateway calls | Đã implement cho scoped slice |
| Parallel batch generation (SemaphoreSlim + Task.WhenAll) | Đã implement cho scoped slice |
| Configurable HTTP timeout cho AI provider | Đã implement qua AI:RequestTimeoutSeconds |
| Cấu hình batch size và parallel concurrency | Đã implement qua AI:BatchSize và AI:MaxParallelBatches |
| AI model compatibility testing | Đã verify — DeepSeek v4-flash 100% pass rate (2026-05-29) |

## Mục tiêu sản phẩm

Thêm AI-assisted form answer generation nhưng vẫn giữ workflow an toàn hiện có:

```text
analyze form
-> cấu hình hoặc generate cách trả lời
-> generate preview responses
-> chỉ trừ credit cho preview lưu thành công
-> user review preview
-> user confirm submission
-> controlled submission
```

AI không bao giờ được auto-submit.

## Các generation mode

### Option 1 - Mode mặc định rule-based

Đây là behavior hiện tại.

Behavior:

- user bấm action phân tích form mặc định
- frontend hiển thị chi tiết câu hỏi và rule editor
- user cấu hình answer rules
- response generation hiện có tạo `GeneratedResponses`
- credit cost là `generatedCount x 1`

Ràng buộc:

- không làm regression các answer-rule mode hiện có
- không đổi preview-before-submit hiện có
- không đổi giới hạn 1 đến 100 preview hiện có

### Option 2 - Full AI mode

Behavior:

- user bấm action AI analysis/generation mới cùng cấp với action phân tích form hiện có
- backend vẫn dùng question metadata và options đã lưu để AI xử lý
- frontend không hiển thị danh sách option chi tiết trong các block câu hỏi
- frontend hiển thị block câu hỏi/câu trả lời dạng thu gọn, có đánh dấu AI
- frontend dùng AI badge và hover emphasis vừa phải, không phá dashboard style
- lưu default AI prompt/profile cho project
- AI sinh trực tiếp `GeneratedResponses`
- generated previews là read-only; user không sửa `GeneratedResponses`
- credit cost là `generatedCount x 2`

AI chỉ được tạo free-form text cho các câu hỏi dạng text.

### Option 3 - Custom AI mode

Behavior:

- user bấm custom AI action mới
- UI nổi bật hơn Option 2 nhưng vẫn theo operational dashboard style
- đầu workflow có các field định hướng AI như độ tuổi, nghề nghiệp, bối cảnh, văn phong, độ dài câu trả lời, mục tiêu câu trả lời
- user có thể chọn custom tổng hoặc custom từng câu
- custom prompts được lưu để user quay lại project vẫn chỉnh tiếp được
- AI có thể auto-fill prompt fields cho user
- auto-fill prompt miễn phí
- AI sinh trực tiếp `GeneratedResponses`
- generated previews là read-only; user không sửa `GeneratedResponses`
- credit cost là `generatedCount x 3`

## Lưu prompt

Option 2 lưu default AI prompt/profile cho project.

Option 3 lưu custom prompts cho project.

Các khái niệm persistence đề xuất, cần database review:

- `AiPromptProfiles`
- `AiQuestionPrompts`

Không được dùng `AnswerRules.ConfigJson` để lưu AI prompt profiles. Answer rules là cấu hình deterministic để tạo preview; AI prompts là instruction cho AI generation.

## AI Provider Settings

Setup AI cần admin-controlled provider settings trước khi production generation có thể chạy.

Khái niệm persistence đề xuất, cần database review:

- `AiProviderSettings`

Expected behavior:

- admin chọn provider trước
- provider và model là giá trị server-side do admin nhập và đều không được rỗng
- API key phải được encrypt trước khi lưu
- API key không bao giờ được trả raw về frontend
- UI chỉ được hiển thị masked key preview
- admin có thể đặt default model
- admin có thể chạy check cấu hình
- provider chỉ được enable khi required configuration hợp lệ
- generation dùng enabled server-side provider setting, không tin provider/model từ normal user frontend gửi lên

Ví dụ cấu hình provider/model không hợp lệ:

```text
Provider:
API key: đã cấu hình
Model: gpt-4o-mini
```

Trường hợp này phải fail validation vì thiếu provider. Mismatch theo provider family không được kiểm tra trong scoped slice này vì provider/model được chủ đích cho admin nhập linh hoạt.

Tên OpenAI-compatible gateway có thể được nhập như provider identifier linh hoạt trong UI settings. Việc dùng custom Base URL và live calls chỉ được duyệt qua scoped OpenAI-compatible chat completions adapter.

Behavior Base URL và live adapter đã duyệt trong scoped slice:

- admin có thể nhập Base URL/API endpoint optional
- nếu nhập, Base URL phải là absolute URL dùng `http` hoặc `https`
- OpenAI-compatible runtime calls dùng Base URL đã lưu và gọi `{baseUrl}/chat/completions`, trừ khi URL đã lưu đã kết thúc bằng `/chat/completions`
- runtime calls dùng API key đã mã hóa phía server và không được expose raw API key
- runtime calls chỉ bật khi `AI:ProviderAdapter` được set rõ là `OpenAICompatible`
- live model catalog validation vẫn Deferred

## Credit rules

Credit chỉ bị trừ cho preview responses được lưu thành công.

Công thức:

```text
creditsUsed = generatedCount x multiplier
```

Multipliers:

- Option 1: `1`
- Option 2: `2`
- Option 3: `3`

Không trừ credit cho:

- phân tích form
- prompt auto-fill
- AI provider call failed
- AI output bị reject trước khi lưu bất kỳ preview nào
- prompt invalid bị prompt guard chặn

Partial generation:

- nếu credit hiện có thấp hơn chi phí cần thiết, chỉ tạo số preview responses đủ credit
- chỉ trừ credit cho preview đã lưu
- trả requested count, generated count, credits used, balance after, và missing credits

Ví dụ:

```text
Mode: Option 3
Requested previews: 10
Multiplier: 3
Available credits: 18
Generated previews: 6
Credits used: 18
Missing credits: 12
```

## AI Audit

AI audit phải được làm như một production audit surface hoàn chỉnh ngay từ đầu.

Các khái niệm persistence đề xuất, cần database review:

- `AiGenerationRuns`
- `AiGenerationRunItems`

Status values bắt buộc cho run:

- `Pending`
- `Running`
- `Succeeded`
- `Partial`
- `Failed`

Hướng audit bắt buộc:

- lưu raw provider request/response
- lưu provider và model
- lưu prompt profile snapshot
- lưu snapshot câu hỏi/options dùng cho generation
- lưu requested count, generated count, multiplier, và credits used
- lưu output validation result
- lưu generated response ids
- lưu error details khi generation fail

Security requirements:

- raw provider payload storage cần access control
- raw provider payload không được expose cho normal users
- admin/debug access phải được xem xét riêng trong API review
- retention và redaction policy phải được review trước khi expose production

## AI Output Validation Rules

Backend không được tin AI output trực tiếp.

Validation bắt buộc:

1. AI output phải là structured JSON.
2. Mỗi item phải tham chiếu `questionId` hợp lệ thuộc project hiện tại.
3. Output không được chứa câu hỏi ngoài project.
4. Multiple choice, dropdown, linear scale, và rating answers phải chứa đúng một value nằm trong stored options.
5. Checkbox answers chỉ được chứa values nằm trong stored options và phải nằm trong safe selection limits.
6. Grid question output chỉ được map vào row và option hợp lệ; grid shape chưa support phải fail an toàn.
7. Short text và paragraph text được dùng free-form text nhưng phải qua giới hạn độ dài và content safety.
8. Date và time values phải đúng accepted format.
9. AI output không được chứa captcha bypass, proxy, fake-account, spam, unauthorized submission, hoặc Google restriction bypass content.
10. Invalid items không được lưu thành `GeneratedResponses`.

Nếu toàn bộ output invalid:

- run status là `Failed`
- generated count là `0`
- credits used là `0`

Nếu một phần output valid:

- run status là `Partial`
- chỉ lưu và tính credit cho preview responses hợp lệ

## Prompt Guard Rules

User prompt và auto-fill input phải bị reject khi yêu cầu hoặc ngụ ý:

- spam
- thao túng khảo sát ở scale lạm dụng
- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- bypass Google restrictions
- AI auto-submit khi chưa preview và confirmation
- ép câu trả lời nằm ngoài allowed options cho choice-style questions
- mạo danh người thật
- thu thập hoặc bịa dữ liệu cá nhân nhạy cảm khi không có quyền

Ví dụ prompt hợp lệ:

```text
Tạo câu trả lời ngắn, tự nhiên cho sinh viên Việt Nam 18 đến 24 tuổi, văn phong thân thiện.
```

Ví dụ prompt không hợp lệ:

```text
Tạo nhiều phản hồi giả và bypass Google restrictions để form nhìn có vẻ phổ biến.
```

## Giới hạn độ dài prompt

Giới hạn đề xuất ban đầu, cần contract review:

- audience hoặc context short field: 200 ký tự mỗi field
- global prompt: 2,000 ký tự
- per-question prompt: 1,000 ký tự
- tổng prompt payload cho một generation run: 20,000 ký tự
- generated text value phải nằm trong backend answer value length limits

## UI Requirements

UI phải giữ đúng baseline Next.js dashboard, shadcn/ui, Tailwind CSS, và lucide-react hiện có.

Option 2 UI:

- AI button cùng cấp với action phân tích form hiện có
- question blocks dạng thu gọn
- AI badge
- hover effect nhẹ
- block preview generation nổi bật
- credit notice nổi bật cho `x2`
- không hiển thị detailed option list

Option 3 UI:

- custom AI button cùng cấp với các action phân tích
- visual emphasis mạnh hơn Option 2
- AI direction panel ở đầu
- control cho global custom và per-question custom mode
- per-question prompt fields
- prompt auto-fill button
- block preview generation nổi bật
- credit notice nổi bật cho `x3`

Provider settings UI:

- admin-only AI settings page hoặc section
- provider input
- API endpoint / Base URL input
- encrypted API key input
- masked key preview sau khi save
- default model input
- optional Base URL cho OpenAI-compatible provider type
- check configuration action
- status badge cho unchecked, valid, invalid, hoặc disabled state

## Proposed API Areas

Các area hiện đã implement/approve:

- admin AI provider settings read/update/check
- project AI prompt profile read/update
- per-question AI prompt read/update
- AI prompt auto-fill
- AI preview generation: `POST /api/projects/{projectId}/ai-responses/generate`
- live OpenAI-compatible provider adapter phía sau runtime configuration rõ ràng

Vẫn Deferred hoặc cần review riêng:

- AI generation run read/list cho audit
- API đọc raw provider payload
- live provider model catalog validation
- provider-specific SDK adapters ngoài OpenAI-compatible HTTP contract
- pagination và filtering cuối cho audit reads

## Proposed Module Ownership

| Module | Owns | Must not own |
|---|---|---|
| Integrations.AI | provider calls, provider adapters, provider response parsing | credit deduction, submission |
| AiProviderSettings | admin AI provider configuration | normal-user prompt behavior |
| AiPromptProfiles | stored project-level AI instructions | generated preview persistence |
| AiQuestionPrompts | stored per-question AI instructions | answer submission |
| ResponseGeneration | storing generated previews and credit-aware generation orchestration | provider-specific API calls |
| CreditManagement | AI generation credit deduction | AI prompt construction |
| GeneratedResponses | stored preview payloads | editable AI draft content |
| UsageLogs | user-visible action history | raw AI provider audit replacement |
| AiGenerationRuns | raw provider audit and generation run state | credit ledger source of truth |

## Delivery Pass Plan

### Pass 1 - Requirement and contract docs

Output:

- package này và counterpart tiếng Anh
- routing matrix update
- không có production code

### Pass 2 - API and DB contract review

Output:

- reviewed DTO and entity proposal
- reviewed status values
- reviewed migration direction
- reviewed raw payload retention/access direction

### Pass 3 - AI provider settings

Output:

- admin provider settings API
- encrypted API key storage
- validation provider/model bắt buộc có giá trị
- validate Base URL optional là absolute URL dùng `http` hoặc `https`
- masked secret response
- configuration check
- admin UI

### Pass 4 - AI backend boundary

Output:

- `Integrations.AI` abstraction
- provider adapter boundary
- OpenAI-compatible live adapter phía sau runtime configuration rõ ràng
- prompt guard
- output validator
- không cho frontend tự quyết provider/model

### Pass 5 - Prompt profile backend

Output:

- lưu default Option 2 profile
- lưu Option 3 global prompt
- lưu Option 3 per-question prompt
- free prompt auto-fill endpoint

### Pass 6 - AI generate API

Output:

- Option 2 và Option 3 AI preview generation
- tạo trực tiếp `GeneratedResponses`
- xử lý credit multiplier
- xử lý partial generation
- ghi AI audit run/item đầy đủ

Trạng thái hiện tại:

- đã implement backend `POST /api/projects/{projectId}/ai-responses/generate`
- lưu AI `GeneratedResponses` dạng read-only
- ghi `CreditTransactions`, `UsageLogs`, `AiGenerationRuns`, và `AiGenerationRunItems`
- chỉ tính credit cho preview hợp lệ đã lưu thành công
- dùng deterministic provider adapter chỉ khi bật rõ cho local/test validation
- dùng OpenAI-compatible live adapter chỉ khi bật rõ bằng runtime configuration
- mặc định dùng disabled provider adapter khi chưa có runtime adapter được duyệt

### Pass 7 - Frontend UI

Output:

- ba generation mode entry points
- Option 2 collapsed AI UI
- Option 3 custom prompt UI
- read-only AI generated preview display
- mode-specific credit notices
- provider settings UI nếu chưa xong trong Pass 3

### Pass 8 - Validation and review

Output:

- backend build/tests
- frontend lint/build
- EF Core migration validation
- authenticated API smoke
- browser smoke
- audit/security review
- docs sync review


Tiến độ hiện tại:

- backend build: Đã verify (2026-05-29)
- backend tests: Đã verify — 42/42 AI-related tests pass (2026-05-29)
- EF Core migration validation: Đã verify
- authenticated API smoke: Đã verify — DeepSeek v4-flash 100% pass rate, parallel batch đã xác nhận hoạt động (2026-05-29)
- frontend lint/build: Chưa chạy
- browser smoke: Chưa chạy
- audit/security review: Chưa chạy
- docs sync review: Đã cập nhật (2026-05-29)


## AI Provider Config Reference

Các key config AI sau điều khiển hành vi generation:

| Key | Mặc định | Mô tả |
|---|---|---|
| ProviderAdapter | Disabled | Chọn adapter: Disabled, Deterministic, hoặc OpenAICompatible |
| RequestTimeoutSeconds | 300 | HTTP timeout cho mỗi lần gọi AI provider (giây) |
| BatchSize | 10 | Số preview mỗi lần gọi AI provider |
| MaxParallelBatches | 5 | Số batch chạy song song tối đa (SemaphoreSlim limit) |

### Cách batch splitting hoạt động

1. generationLimit preview được chia thành ceil(generationLimit / BatchSize) batch.
2. Mỗi batch tạo một AiProviderGenerateRequest độc lập và gọi provider adapter.
3. SemaphoreSlim(MaxParallelBatches) giới hạn số HTTP call đồng thời.
4. Tất cả OutputJsons được gom bằng Task.WhenAll, sau đó validate chung.
5. Credit chỉ bị trừ cho preview đã validate thành công và lưu.
6. Raw audit lưu batch markers: [Batch X/Y] trong RawProviderRequestJson và RawProviderResponseJson.

Ví dụ: 50 preview với BatchSize=10, MaxParallelBatches=5:
- 5 batch mỗi batch 10 preview
- 5 batch chạy đồng thời (SemaphoreSlim cho phép 5)
- Tổng thời gian ≈ max(thời gian các batch) ≈ ~20-40s

## AI Model Compatibility Notes

Các model đã test với strict JSON output validator (form 15 câu, Option 2):

| Model | Provider | Pass Rate | Ghi chú |
|---|---|---|---|
| deepseek-v4-flash | DeepSeek direct API | 100% (21/21) | Khuyến nghị — model free tốt nhất |
| cx/gpt-5.5-review | OpenCode proxy | 100% (30/30) | Dự phòng, chậm hơn |
| cx/gpt-5.5 | OpenCode proxy | 100% (15/15) | Dự phòng |
| oc/deepseek-v4-flash-free | OpenCode proxy | 0% | Trả về SSE streaming format — adapter chưa hỗ trợ |
| gemini-2.5-flash (Google) | Google free tier | 100% nhưng rate-limited | Lỗi 429 ngăn parallel |
| Groq llama-3.3-70b | Groq free tier | 1.4% | JSON không tuân thủ |
| Groq llama-3.1-8b | Groq free tier | 0% | JSON không tuân thủ |
| Groq llama-4-scout-17b | Groq free tier | 0% | Không khả dụng trên free tier |
| Groq qwen3-32b | Groq free tier | 0% | Không khả dụng trên free tier |
| Groq gpt-oss-20b | Groq free tier | 0% | Không khả dụng trên free tier |

Ngày test: 2026-05-29. Yêu cầu JSON compliance bao gồm: copy chính xác giá trị option, phải trả lời đủ 15 câu, không bịa giá trị, map đúng questionId.
## Nhóm việc có thể chạy song song an toàn

Sau khi Pass 1 và Pass 2 hoàn tất, các nhóm sau có thể chạy song song:

### Combo A - Provider settings

- worker A1: DB/API provider settings
- worker A2: admin provider settings UI

Không được đụng:

- AI generation transaction
- prompt profile persistence ngoài shared contracts
- `GeneratedResponses`

### Combo B - AI safety core

- worker B1: prompt guard
- worker B2: output validator
- worker B3: provider abstraction interface

Không được đụng:

- credit deduction
- database migration finalization nếu chưa DB review
- frontend mode UI

### Combo C - Prompt profile

- worker C1: prompt profile DB/API
- worker C2: Option 3 prompt UI với mocked hoặc contract-stable API
- worker C3: auto-fill prompt endpoint boundary

Không được đụng:

- provider settings validation
- final AI generation transaction
- submission workflow

### Combo D - Frontend visual mode preparation

- worker D1: Option 2 collapsed AI UI state
- worker D2: Option 3 custom UI state
- worker D3: AI badge, hover effect, và credit notice styling

Không được bind vào API chưa ổn định.

## Việc phải chạy tuần tự

Các task này không nên chạy trước dependency:

- AI generation API trước khi provider settings và output validator contracts ổn định
- credit multiplier transaction trước credit contract review
- AI audit raw payload storage trước access/retention review
- frontend/API binding bổ sung trước khi DTO routes ổn định
- production browser closeout trước khi backend runtime smoke pass và live provider adapter được duyệt

## Validation Expectations

Unit tests:

- prompt guard nhận prompt an toàn và reject prompt không an toàn
- output validator reject value ngoài options
- output validator reject schema invalid
- multiplier calculation trả đúng generated count và credits used

Integration tests:

- AI generation ghi `GeneratedResponses`
- AI generation ghi `CreditTransactions`
- AI generation ghi `UsageLogs`
- AI generation ghi `AiGenerationRuns` và run items
- failed generation trừ 0 credit
- partial generation chỉ tính credit cho preview đã lưu

Runtime smoke:

- admin save và check AI provider settings
- normal user không truy cập được provider secrets
- Option 2 tạo read-only previews
- Option 3 lưu prompts và tạo read-only previews
- submission vẫn cần preview và confirmation

Browser smoke:

- Option 1 vẫn chạy
- Option 2 UI render và hydrate
- Option 3 UI render và hydrate
- AI badges, credit notices, và collapsed blocks không overlap hoặc phá mobile layout

## Stop Conditions

Dừng trước implementation nếu:

- API routes hoặc DTOs chưa review
- database fields chưa review
- rule validation provider/model bắt buộc có giá trị chưa rõ
- raw provider payload access hoặc retention chưa rõ
- credit multiplier behavior chưa rõ
- prompt guard scope bị làm yếu
- output validation cho phép choice-style answers ngoài stored options
- preview-before-submit hoặc confirmation bị làm yếu
