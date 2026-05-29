# DOMAIN_ENTITIES_OVERVIEW

## TOC

- [Purpose](#purpose) (36)
- [Contract Status](#contract-status) (40)
- [Confirmed Conceptual Entities](#confirmed-conceptual-entities) (44)
- [Proposed MVP Fields](#proposed-mvp-fields) (69)
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
- [Deferred Fields And Decisions](#deferred-fields-and-decisions) (450)
- [Forbidden Invented Fields](#forbidden-invented-fields) (469)
- [Ledger Discipline](#ledger-discipline) (481)
- [Form Automation MVP Scope](#form-automation-mvp-scope) (489)

## Purpose

Describe confirmed conceptual entities and proposed MVP fields without freezing final database contracts.

## Contract Status

The entities are confirmed conceptually. Most listed fields are proposed MVP fields and require database review before implementation. Phase 6 AI provider settings, prompt profiles, question prompts, generation runs, and generation run items have an approved implemented backend subset documented below.

## Confirmed Conceptual Entities

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

## Proposed MVP Fields

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

Approved admin package management follow-up:

- Admin users may create and update the existing fields above.
- `IsActive = false` hides the package from normal user top-up selection.
- Existing `TopupOrders` keep snapshot `Credits` and `Amount` values from creation time.
- Do not hard-delete packages in the approved follow-up.
- Do not add package colors, marketing labels, discount fields, or subscription fields without separate approval.

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

Phase 8 rule:

- For the first PayOS implementation, keep `TopupOrders` as the user-facing credit top-up order.
- Keep top-up lifecycle minimal: `Pending` until verified payment, then `Approved` after the credit ledger write succeeds.
- Do not store PayOS secrets in `TopupOrders`.
- Do not use frontend return URL data as authority to mark a top-up as paid.

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

Phase 8 rule:

- PayOS automatic credit grant must write a `CreditTransactions` row.
- `ReferenceType` should remain `TopupOrder` for PayOS credit grants unless a later ledger review approves a different reference model.

### PaymentRecords

Confirmed concept for Phase 8 PayOS payment metadata and idempotency.

Proposed fields requiring database review:

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

Index and integrity direction:

- unique index on `Provider` + `ProviderOrderCode`
- unique index on `Provider` + `ProviderPaymentLinkId` when available
- foreign key to `TopupOrders`
- never use `RawPayloadJson` to store secrets
- redact or omit sensitive provider data before storage when needed

### PaymentProviderSettings

Confirmed concept for Phase 8 PayOS configuration stored in the database.

Proposed fields requiring database review:

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

Security direction:

- `ApiKey` and `ChecksumKey` must be encrypted before storage.
- API responses and admin UI must never return raw `ApiKey` or raw `ChecksumKey`.
- Admin UI may show only masked secret previews.
- The application may use environment/appsettings only for encryption key material or local fallback, not as the main PayOS configuration source after Phase 8 settings are implemented.
- Secrets must not be committed to source-controlled configuration.

### AiProviderSettings

Approved concept for Phase 6 AI provider configuration stored in the database.

Approved fields for the provider settings backend subset:

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

Security direction:

- AI API keys must be encrypted before storage.
- API responses and admin UI must never return raw API keys.
- Admin UI may show only masked key previews.
- Provider and model are admin-controlled string values and must both be non-empty before enabling a setting.
- `AllowedModelsJson` may store the saved default model for UI compatibility; it is not a hardcoded provider allow-list in the flexible provider settings slice.
- Custom Base URL is approved for the scoped OpenAI-compatible adapter path and is stored as `BaseUrl`.
- Normal-user generation APIs must use enabled server-side provider settings instead of trusting provider or model values from the frontend.
- Raw provider request/response audit belongs to `AiGenerationRuns`, not this settings entity.

### AiPromptProfiles

Approved implemented subset for Phase 6 project-level AI prompt configuration.

Implemented fields:

- Id
- ProjectId
- UserId
- Mode
- AudienceJson
- GlobalPrompt
- CreatedAt
- UpdatedAt

Direction:

- Option 2 stores a default AI prompt/profile for the project.
- Option 3 stores custom global direction for the project.
- `AnswerRules.ConfigJson` must not be used to store AI prompt profiles.
- Unique index: `ProjectId + Mode`.

### AiQuestionPrompts

Approved implemented subset for Phase 6 per-question AI prompt configuration.

Implemented fields:

- Id
- ProfileId
- QuestionId
- Prompt
- UseAi
- CreatedAt
- UpdatedAt

Direction:

- Per-question prompts are used only for AI generation guidance.
- They must not replace `FormQuestions` as the source of detected form metadata.
- They must not make generated previews editable after creation.
- Unique index: `ProfileId + QuestionId`.

### RefreshTokens

Confirmed for Phase 7 as a dedicated refresh token/session storage table.

- Id
- UserId
- TokenHash
- ExpiresAt
- RevokedAt
- CreatedAt

### UserExternalLogins

Confirmed for Phase 7 Google identity linking.

This storage must support provider user id / Google `sub` lookup before email matching.

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

Approved implemented subset for Phase 6 AI generation audit and run state.

Implemented fields:

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

Security and audit direction:

- Raw provider request/response is stored for audit, but must not be exposed to normal users.
- Admin/debug access to raw payloads requires explicit API review.
- Retention and redaction policy must be reviewed before production exposure.
- `AiGenerationRuns` records generation evidence; it is not the credit ledger source of truth.
- Index direction implemented: lookup by `ProjectId + CreatedAt` and `UserId + CreatedAt`.

### AiGenerationRunItems

Approved implemented subset for Phase 6 per-output AI validation and generated response mapping.

Implemented fields:

- Id
- RunId
- GeneratedResponseId
- QuestionId
- Status
- RawAnswerJson
- ValidationMessage
- CreatedAt

Direction:

- Links an AI run to stored `GeneratedResponses`.
- Records per-question or per-output validation evidence.
- Must not make `GeneratedResponses` editable after creation.
- `GeneratedResponseId` and `QuestionId` may be nullable for invalid or rejected output evidence.

## Deferred Fields And Decisions

Deferred:

- exact auth fields beyond MVP user basics
- exact credit pricing
- exact credit cost per action
- refund behavior after failed submission
- package management fields beyond the approved `Name`, `Credits`, `Price`, and `IsActive` follow-up
- payment gateway fields
- PayOS fields beyond the Phase 8 payment record scope
- PayOS configuration fields beyond the Phase 8 provider settings scope
- Google OAuth fields
- final AI mapping/generation behavior beyond the approved scoped Phase 6 backend slice
- live AI provider/model catalog validation beyond the OpenAI-compatible chat completions adapter
- final AI raw audit access, retention, and redaction policy
- webhook fields
- production deployment fields

## Forbidden Invented Fields

Do not add fields for:

- proxy rotation
- captcha solving
- fake-account creation
- spam campaign management
- unauthorized submission targets
- payment provider behavior outside approved Phase 8 PayOS scope
- AI auto-submit behavior

## Ledger Discipline

- `UserCreditAccounts` stores current balance/totals.
- `CreditTransactions` is the credit ledger.
- Balance changes must write ledger entries.
- Tool actions must write `UsageLogs`.
- Submission attempts must write `SubmissionLogs`.

## Form Automation MVP Scope

Supported MVP question types:

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

- file upload, because Google requires sign-in for file upload forms

Supported MVP answer-generation modes:

- random equally
- random by percentage
- random by quantity
- sample text lines for text answers
- sequential date ranges for date questions
- sequential time ranges for time questions
