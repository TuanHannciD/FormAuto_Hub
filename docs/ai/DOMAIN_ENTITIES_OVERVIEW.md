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
- package management UI fields
- payment gateway fields
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
- payment gateway behavior before approval
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
