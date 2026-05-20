# DOMAIN_ENTITIES_OVERVIEW

## Purpose

Describe confirmed conceptual entities and proposed MVP fields without freezing final database contracts.

## Contract Status

The entities are confirmed conceptually. The listed fields are proposed MVP fields and require database review before implementation.

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
- AI mapping/generation fields
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
