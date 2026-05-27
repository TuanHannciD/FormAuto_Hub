# PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE

## Mục đích

Định nghĩa gói requirement đã được duyệt ở mức ý tưởng cho slice Phase 6 AI mapping/generation trước khi thiết kế API, database, frontend hoặc provider implementation.

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

Tài liệu này chưa tự duyệt:

- API routes cuối cùng
- tên và field DTO cuối cùng
- database schema hoặc migration cuối cùng
- provider/model cuối cùng
- production AI provider calls
- implementation nếu chưa có approval riêng

## Phase fit

Trạng thái project hiện tại vẫn là: Phase 9 closeout completed; next phase not selected.

Package này dành cho một candidate production integration thuộc Phase 6. Nó không tự kích hoạt Phase 6.

Implementation cần approval rõ sau contract review và database review.

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
- provider và model phải khớp nhau
- API key phải được encrypt trước khi lưu
- API key không bao giờ được trả raw về frontend
- UI chỉ được hiển thị masked key preview
- admin có thể đặt default model
- admin có thể chạy check cấu hình
- provider chỉ được enable khi required configuration hợp lệ
- generation dùng enabled server-side provider setting, không tin provider/model từ normal user frontend gửi lên

Ví dụ provider/model mismatch:

```text
Provider: Google AI
API key: Google AI key
Model: gpt-*
```

Trường hợp này phải fail validation vì key và model không thuộc cùng provider family.

OpenAI-compatible gateways chỉ được support như một provider type rõ ràng với base URL và danh sách model tương thích đã cấu hình.

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
- provider selector
- encrypted API key input
- masked key preview sau khi save
- default model selection
- optional base URL cho OpenAI-compatible provider type
- check configuration action
- status badge cho unchecked, valid, invalid, hoặc disabled state

## Proposed API Areas

Đây chỉ là các area đề xuất và cần contract review trước implementation:

- admin AI provider settings read/update/check
- project AI prompt profile read/update
- per-question AI prompt read/update
- AI prompt auto-fill
- AI preview generation
- AI generation run read/list cho audit

Exact routes, DTOs, error responses, pagination, và authorization rules chưa được chốt trong package này.

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
- provider/model validation
- masked secret response
- configuration check
- admin UI

### Pass 4 - AI backend boundary

Output:

- `Integrations.AI` abstraction
- provider adapter boundary
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
- frontend real API binding trước khi DTO routes ổn định
- browser closeout trước khi backend runtime smoke pass

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
- provider/model validation rules chưa rõ
- raw provider payload access hoặc retention chưa rõ
- credit multiplier behavior chưa rõ
- prompt guard scope bị làm yếu
- output validation cho phép choice-style answers ngoài stored options
- preview-before-submit hoặc confirmation bị làm yếu

