# DOMAIN_ENTITIES_OVERVIEW

## Mục đích

Mô tả conceptual entities đã chốt và proposed MVP fields mà không đóng băng database contract cuối.

## Trạng thái contract

Các entity đã được chốt ở mức khái niệm. Danh sách field là proposed MVP fields và cần database review trước khi implement.

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

## Deferred fields và decisions

Deferred:

- auth fields chi tiết ngoài user basics
- exact credit pricing
- exact credit cost per action
- refund behavior sau failed submission
- package management UI fields
- payment gateway fields
- Google OAuth fields
- AI mapping/generation fields
- webhook fields
- production deployment fields

## Field không được tự bịa

Không thêm field cho:

- proxy rotation
- captcha solving
- fake-account creation
- spam campaign management
- unauthorized submission targets
- payment gateway behavior khi chưa duyệt
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
