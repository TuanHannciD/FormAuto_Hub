# DOMAIN_ENTITIES_OVERVIEW

## TOC

- [Mục đích](#mục-đích) (36)
- [Trạng thái contract](#trạng-thái-contract) (40)
- [Conceptual entities đã chốt](#conceptual-entities-đã-chốt) (44)
- [Proposed MVP fields](#proposed-mvp-fields) (69)
  - [Users](#users) (71)
  - [UserCreditAccounts](#usercreditaccounts) (82)
  - [CreditPackages](#creditpackages) (91)
  - [TopupOrders](#topuporders) (108)
  - [CreditTransactions](#credittransactions) (129)
  - [PaymentRecords](#paymentrecords) (146)
  - [PaymentProviderSettings](#paymentprovidersettings) (176)
  - [AiProviderSettings](#aiprovidersettings) (205)
  - [AiPromptProfiles](#aipromptprofiles) (237)
  - [AiQuestionPrompts](#aiquestionprompts) (259)
  - [RefreshTokens](#refreshtokens) (280)
  - [UserExternalLogins](#userexternallogins) (291)
  - [UsageLogs](#usagelogs) (305)
  - [FormProjects](#formprojects) (317)
  - [FormQuestions](#formquestions) (328)
  - [AnswerRules](#answerrules) (339)
  - [GeneratedResponses](#generatedresponses) (348)
  - [SubmissionJobs](#submissionjobs) (359)
  - [SubmissionLogs](#submissionlogs) (372)
  - [AuditLogs](#auditlogs) (382)
  - [AiGenerationRuns](#aigenerationruns) (392)
  - [AiGenerationRunItems](#aigenerationrunitems) (428)
- [Deferred fields và decisions](#deferred-fields-và-decisions) (450)
- [Field không được tự bịa](#field-không-được-tự-bịa) (469)
- [Kỷ luật ledger](#kỷ-luật-ledger) (481)
- [Scope Form Automation MVP](#scope-form-automation-mvp) (489)

## Mục đích

Mô tả conceptual entities đã chốt và proposed MVP fields mà không đóng băng database contract cuối.

## Trạng thái contract

Các entity đã được chốt ở mức khái niệm. Hầu hết danh sách field là proposed MVP fields và cần database review trước khi implement. Phase 6 AI provider settings, prompt profiles, question prompts, generation runs, và generation run items đã có backend subset được duyệt và implement như ghi bên dưới.

## Conceptual entities đã chốt

- Users
- UserCreditAccounts
- CreditPackages
- TopupOrders
- CreditTransactions
- RefreshTokens
- UserExternalLogins
- UsageLogs
- FormProjects
- FormQuestions
- AnswerRules
- GeneratedResponses
- SubmissionJobs
- SubmissionLogs
- AuditLogs
- PaymentProviderSettings
- PaymentRecords
- AiProviderSettings
- AiPromptProfiles
- AiQuestionPrompts
- AiGenerationRuns
- AiGenerationRunItems

## Proposed MVP fields

### Users

- Id
- Email
- PasswordHash
- FullName
- Role
- FailedLoginCount
- LockoutUntil
- CreatedAt

### UserCreditAccounts

- Id
- UserId
- Balance
- TotalDeposited
- TotalUsed
- UpdatedAt

### CreditPackages

- Id
- Name
- Credits
- Price
- IsActive
- CreatedAt

Follow-up admin package management đã duyệt:

- Admin users được tạo và cập nhật các field hiện có ở trên.
- `IsActive = false` ẩn package khỏi lựa chọn top-up của normal user.
- `TopupOrders` đã tạo giữ snapshot `Credits` và `Amount` tại thời điểm tạo.
- Không hard-delete package trong follow-up đã duyệt.
- Không thêm màu package, marketing label, discount field hoặc subscription field nếu chưa có approval riêng.

### TopupOrders

- Id
- UserId
- PackageId
- Credits
- Amount
- Status
- PaymentMethod
- PaymentNote
- CreatedAt
- PaidAt
- ApprovedAt

Quy tắc Phase 8:

- Với implementation PayOS đầu tiên, giữ `TopupOrders` là order nạp credit user-facing.
- Giữ lifecycle top-up tối thiểu: `Pending` cho đến khi payment được xác minh, rồi `Approved` sau khi credit ledger write thành công.
- Không lưu PayOS secrets trong `TopupOrders`.
- Không dùng dữ liệu frontend return URL làm authority để đánh dấu top-up đã thanh toán.

### CreditTransactions

- Id
- UserId
- Amount
- BalanceAfter
- Type
- Description
- ReferenceType
- ReferenceId
- CreatedAt

Quy tắc Phase 8:

- PayOS automatic credit grant phải ghi một dòng `CreditTransactions`.
- `ReferenceType` nên giữ là `TopupOrder` cho PayOS credit grant, trừ khi ledger review sau này duyệt reference model khác.

### PaymentRecords

Concept đã chốt cho Phase 8 PayOS payment metadata và idempotency.

Các field đề xuất cần database review:

- Id
- TopupOrderId
- Provider
- ProviderOrderCode
- ProviderPaymentLinkId
- CheckoutUrl
- Amount
- Currency
- ProviderStatus
- SignatureVerifiedAt
- CompletedAt
- LastWebhookAt
- RawPayloadJson
- CreatedAt
- UpdatedAt

Hướng index và integrity:

- unique index trên `Provider` + `ProviderOrderCode`
- unique index trên `Provider` + `ProviderPaymentLinkId` khi available
- foreign key tới `TopupOrders`
- không dùng `RawPayloadJson` để lưu secrets
- redact hoặc bỏ sensitive provider data trước khi lưu khi cần

### PaymentProviderSettings

Concept đã chốt cho Phase 8 để lưu cấu hình PayOS trong database.

Các field đề xuất cần database review:

- Id
- Provider
- ClientId
- EncryptedApiKey
- EncryptedChecksumKey
- ReturnUrl
- CancelUrl
- IsEnabled
- LastCheckedAt
- LastCheckStatus
- LastCheckMessage
- UpdatedByUserId
- CreatedAt
- UpdatedAt

Hướng bảo mật:

- `ApiKey` và `ChecksumKey` phải được mã hóa trước khi lưu.
- API response và admin UI không bao giờ được trả raw `ApiKey` hoặc raw `ChecksumKey`.
- Admin UI chỉ được hiển thị secret preview dạng masked.
- Ứng dụng có thể dùng environment/appsettings cho encryption key material hoặc local fallback, nhưng không dùng làm nguồn cấu hình PayOS chính sau khi Phase 8 settings được implement.
- Secrets không được commit vào source-controlled configuration.

### AiProviderSettings

Concept đã duyệt cho Phase 6 để lưu cấu hình AI provider trong database.

Các field đã duyệt cho backend subset provider settings:

- Id
- Provider
- DisplayName
- EncryptedApiKey
- BaseUrl
- DefaultModel
- AllowedModelsJson
- IsEnabled
- LastCheckedAt
- LastCheckStatus
- LastCheckMessage
- UpdatedByUserId
- CreatedAt
- UpdatedAt

Hướng bảo mật:

- AI API keys phải được mã hóa trước khi lưu.
- API response và admin UI không bao giờ được trả raw API key.
- Admin UI chỉ được hiển thị key preview dạng masked.
- Provider và model là chuỗi do admin kiểm soát và đều không được rỗng trước khi enable setting.
- `AllowedModelsJson` có thể lưu default model đã lưu để tương thích UI; đây không phải hardcoded provider allow-list trong slice provider settings linh hoạt.
- Custom Base URL được duyệt cho scoped OpenAI-compatible adapter path và được lưu trong `BaseUrl`.
- API generation cho normal user phải dùng provider setting đang enabled ở server, không tin provider hoặc model từ frontend gửi lên.
- Raw provider request/response audit thuộc `AiGenerationRuns`, không thuộc settings entity này.

### AiPromptProfiles

Subset đã duyệt và implement cho cấu hình AI prompt cấp project ở Phase 6.

Field đã implement:

- Id
- ProjectId
- UserId
- Mode
- AudienceJson
- GlobalPrompt
- CreatedAt
- UpdatedAt

Hướng xử lý:

- Option 2 lưu default AI prompt/profile cho project.
- Option 3 lưu custom global direction cho project.
- Không dùng `AnswerRules.ConfigJson` để lưu AI prompt profiles.
- Unique index: `ProjectId + Mode`.

### AiQuestionPrompts

Subset đã duyệt và implement cho AI prompt riêng từng câu hỏi ở Phase 6.

Field đã implement:

- Id
- ProfileId
- QuestionId
- Prompt
- UseAi
- CreatedAt
- UpdatedAt

Hướng xử lý:

- Per-question prompts chỉ dùng để hướng dẫn AI generation.
- Không thay thế `FormQuestions` làm nguồn metadata form đã detect.
- Không làm cho generated previews được sửa sau khi tạo.
- Unique index: `ProfileId + QuestionId`.

### RefreshTokens

Đã chốt cho Phase 7 dưới dạng table riêng cho refresh token/session storage.

- Id
- UserId
- TokenHash
- ExpiresAt
- RevokedAt
- CreatedAt

### UserExternalLogins

Đã chốt cho Phase 7 để link Google identity.

Storage này phải hỗ trợ lookup bằng provider user id / Google `sub` trước khi xét email matching.

- Id
- UserId
- Provider
- ProviderUserId
- Email
- EmailVerified
- CreatedAt

### UsageLogs

- Id
- UserId
- ToolName
- Action
- CreditsUsed
- Status
- Description
- ProjectId
- CreatedAt

### FormProjects

- Id
- UserId
- Name
- FormUrl
- FormTitle
- FormActionUrl
- Status
- CreatedAt

### FormQuestions

- Id
- ProjectId
- Label
- EntryId
- QuestionType
- OptionsJson
- Required
- OrderIndex

### AnswerRules

- Id
- ProjectId
- QuestionId
- Mode
- ConfigJson
- CreatedAt

### GeneratedResponses

- Id
- ProjectId
- PayloadJson
- PreviewText
- Status
- Source
- IsReadOnly
- CreatedAt

### SubmissionJobs

- Id
- ProjectId
- Total
- SuccessCount
- FailedCount
- Status
- RateLimitPerMinute
- CreatedAt
- StartedAt
- FinishedAt

### SubmissionLogs

- Id
- JobId
- ResponseId
- PayloadJson
- Status
- ErrorMessage
- SubmittedAt

### AuditLogs

- Id
- UserId
- Action
- TargetType
- TargetId
- MetadataJson
- CreatedAt

### AiGenerationRuns

Subset đã duyệt và implement cho AI generation audit và run state ở Phase 6.

Field đã implement:

- Id
- UserId
- ProjectId
- PromptProfileId
- Mode
- Provider
- Model
- PromptSnapshotJson
- QuestionSnapshotJson
- RawProviderRequestJson
- RawProviderResponseJson
- Multiplier
- RequestedCount
- GeneratedCount
- CreditsUsed
- ValidationSummaryJson
- Status
- ErrorMessage
- CreatedAt
- StartedAt
- CompletedAt

Hướng bảo mật và audit:

- Raw provider request/response được lưu để audit, nhưng không được expose cho normal users.
- Admin/debug access vào raw payloads cần API review rõ.
- Retention và redaction policy phải được review trước khi expose production.
- `AiGenerationRuns` lưu evidence cho generation; nó không phải nguồn truth của credit ledger.
- Index direction đã implement: lookup theo `ProjectId + CreatedAt` và `UserId + CreatedAt`.

### AiGenerationRunItems

Subset đã duyệt và implement cho validation từng output AI và mapping tới generated response ở Phase 6.

Field đã implement:

- Id
- RunId
- GeneratedResponseId
- QuestionId
- Status
- RawAnswerJson
- ValidationMessage
- CreatedAt

Hướng xử lý:

- Link AI run với `GeneratedResponses` đã lưu.
- Ghi evidence validation theo từng câu hỏi hoặc từng output.
- Không làm cho `GeneratedResponses` được sửa sau khi tạo.
- `GeneratedResponseId` và `QuestionId` có thể nullable cho evidence của output invalid hoặc rejected.

## Deferred fields và decisions

Deferred:

- auth fields chi tiết ngoài user basics
- exact credit pricing
- exact credit cost per action
- refund behavior sau failed submission
- package management fields ngoài follow-up đã duyệt gồm `Name`, `Credits`, `Price`, và `IsActive`
- payment gateway fields
- PayOS fields ngoài scope payment record Phase 8
- PayOS configuration fields ngoài scope provider settings Phase 8
- Google OAuth fields
- behavior AI mapping/generation cuối ngoài scoped backend slice Phase 6 đã duyệt
- live AI provider/model catalog validation ngoài OpenAI-compatible chat completions adapter
- chính sách access, retention, và redaction cuối cho raw AI audit
- webhook fields
- production deployment fields

## Field không được tự bịa

Không thêm field cho:

- proxy rotation
- captcha solving
- fake-account creation
- spam campaign management
- unauthorized submission targets
- payment provider behavior ngoài scope PayOS Phase 8 đã duyệt
- AI auto-submit behavior

## Kỷ luật ledger

- `UserCreditAccounts` lưu current balance/totals.
- `CreditTransactions` là credit ledger.
- Balance change phải ghi ledger entry.
- Tool action phải ghi `UsageLogs`.
- Submission attempt phải ghi `SubmissionLogs`.

## Scope Form Automation MVP

MVP question types được hỗ trợ:

- short text
- paragraph text
- multiple choice
- checkbox
- dropdown
- linear scale
- rating
- multiple choice grid
- checkbox grid
- date
- time

Deferred:

- file upload, vì Google yêu cầu đăng nhập với form upload file

MVP answer-generation modes được hỗ trợ:

- random equally
- random by percentage
- random by quantity
- sample text lines cho text answers
- khoảng ngày tuần tự cho câu hỏi ngày
- khoảng giờ tuần tự cho câu hỏi giờ
