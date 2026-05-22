# API_CONTRACT_GUIDE

## Purpose

Control API contract design for FormAuto Hub.

## Current Status

The API areas below are proposed, not final contracts. Every endpoint requires contract review before implementation.

## REST Naming Rules

- Use resource-oriented REST routes.
- Use nouns for resources.
- Use action subroutes only for explicit workflows such as `approve`, `reject`, `generate`, `send`, `pause`, and `cancel`.
- Keep API contracts frontend-agnostic.
- Do not create undocumented endpoints.

## Proposed API Areas

### Dashboard

- `GET /api/dashboard/summary`

### Packages

- `GET /api/packages`

Approved public behavior:

- returns only active credit packages
- used by normal users when creating manual or PayOS top-up orders

Approved admin package management follow-up:

- `GET /api/admin/packages`
- `POST /api/admin/packages`
- `PUT /api/admin/packages/{id}`

Approved admin behavior:

- admin-only access
- list all credit packages, including inactive packages
- create a credit package with `name`, `credits`, `price`, and `isActive`
- update an existing credit package's `name`, `credits`, `price`, and `isActive`
- use `isActive` to hide a package from normal user top-up selection
- do not hard-delete packages in this follow-up
- existing top-up orders keep their snapshot `credits` and `amount`
- PayOS package price must be a positive whole VND amount

Approved request DTO fields:

- `name`
- `credits`
- `price`
- `isActive`

Approved response behavior:

- reuse `CreditPackageResponse`
- list responses are wrapped as `{ items: CreditPackageResponse[] }`

Deferred:

- hard delete
- package popularity analytics
- package display colors or merchandising metadata
- package-specific discounts or subscription pricing

### Top-up orders

- `POST /api/topup-orders`
- `GET /api/topup-orders`
- `GET /api/topup-orders/recent`
- `GET /api/topup-orders/{id}`
- `POST /api/topup-orders/{id}/cancel`

Phase 8 PayOS top-up extension:

- `POST /api/topup-orders/payos`

Approved behavior:

- creates a top-up order for the authenticated user from an active credit package
- uses PayOS as the payment provider
- creates a PayOS payment link from server-side package amount and credit values
- returns the top-up order id and PayOS checkout URL to the frontend
- does not allow the frontend to provide amount, credits, or free-form payment method for the PayOS flow
- does not grant credit when the payment link is created
- credit is granted only after verified PayOS payment handling and `CreditTransactions` ledger write

Proposed request DTO:

- `packageId`

Proposed response DTO:

- `topupOrderId`
- `packageId`
- `credits`
- `amount`
- `paymentProvider`
- `checkoutUrl`
- `paymentLinkId`
- `status`
- `createdAt`

Pending contract review before implementation:

- exact DTO names
- exact error responses
- whether to reuse `TopupOrderResponse` or return a dedicated PayOS response DTO
- whether `paymentLinkId` is available immediately from PayOS for every successful create-link response

### Admin top-up orders

- `GET /api/admin/topup-orders`
- `POST /api/admin/topup-orders/{id}/approve`
- `POST /api/admin/topup-orders/{id}/reject`

Phase 8 admin reporting extension:

- `GET /api/admin/revenue/summary`
- `GET /api/admin/payments`
- `GET /api/admin/payments/{id}`
- `GET /api/admin/payment-providers/payos`
- `PUT /api/admin/payment-providers/payos`
- `POST /api/admin/payment-providers/payos/check`

Approved behavior:

- admin-only access
- exposes revenue, payment, top-up order, credit issued, and credit usage read models
- admin payment read models expose `userEmail` for display and may retain `userId` for traceability
- reads and updates PayOS configuration through admin-only APIs
- stores PayOS configuration in the database through `PaymentProviderSettings`
- does not expose PayOS secrets
- returns only masked secret previews for configured `ApiKey` and `ChecksumKey`
- does not expose raw sensitive webhook payloads unless a later task explicitly approves a redacted audit view

Approved PayOS settings behavior:

- `ClientId`, `ReturnUrl`, `CancelUrl`, and enabled state may be returned to admin users
- `ApiKey` and `ChecksumKey` are write-only from the UI perspective
- `ApiKey` and `ChecksumKey` must be encrypted before storage
- empty secret inputs in an update request should preserve the existing encrypted secret values
- PayOS config check must not grant credit or create payment records
- PayOS config check may verify only that the required configuration is present unless a later task approves a live provider check

Pending contract review before implementation:

- pagination shape
- filtering fields
- sorting fields
- exact revenue aggregation period
- exact payment detail DTO
- exact PayOS settings DTO names
- exact masked secret response shape

### PayOS webhooks

- `POST /api/payments/payos/webhook`
- Frontend proxy for single public-domain local smoke: `POST /api/payments/payos/webhook` on the Next.js app forwards the unchanged PayOS payload to the backend endpoint above.

Approved behavior:

- accepts PayOS payment webhook payload
- allows PayOS to call the frontend public domain during local/tunnel testing while preserving backend authority
- frontend proxy must not grant credit, verify payment as authoritative, or mutate payment state
- backend payment service remains the only component that verifies PayOS signature, matches payment identity, and grants credit
- verifies PayOS signature before applying any state change
- matches webhook data to an existing PayOS top-up order
- verifies amount and payment identity before granting credit
- grants credit at most once for the matching top-up order
- writes `CreditTransactions` for every automatic credit grant
- returns a 2xx response after an already-applied duplicate webhook is safely recognized
- does not grant credit from the PayOS return URL

PayOS contract facts from official documentation:

- payment link creation uses `POST https://api-merchant.payos.vn/v2/payment-requests`
- create-link signature uses the checksum key and HMAC-SHA256 over the sorted data string containing `amount`, `cancelUrl`, `description`, `orderCode`, and `returnUrl`
- webhook body includes `code`, `desc`, `success`, `data`, and `signature`
- webhook `data` includes values such as `orderCode`, `amount`, `description`, `reference`, `transactionDateTime`, `currency`, and `paymentLinkId`
- return URL query params may include `code`, `id`, `cancel`, `status`, and `orderCode`; this is for user-facing result display and must not be used as the credit-grant authority
- for a single frontend tunnel, configure PayOS webhook to the frontend origin plus `/api/payments/payos/webhook`; Return URL and Cancel URL still use `/payment/payos/return` and `/payment/payos/cancel`

Pending contract review before implementation:

- exact PayOS request/response DTO names
- raw request capture strategy
- signature verification helper boundary
- payment idempotency key
- provider error mapping
- logging and redaction policy
- encryption service boundary for stored PayOS secrets

### Usage logs

- `GET /api/usage-logs`
- `GET /api/usage-logs/recent`

### Credit transactions

- `GET /api/credit-transactions`

### Profile

- `GET /api/profile`
- `PUT /api/profile`
- `PUT /api/profile/change-password`

### Authentication and account access

Phase 7 approved behavior baseline:

- `POST /api/auth/register` registers with email/password and returns JWT after successful registration
- `POST /api/auth/login` logs in with email/password
- `POST /api/auth/google` logs in or auto-registers with Google identity only
- `POST /api/auth/refresh` rotates the current refresh token/session and returns new tokens
- `POST /api/auth/logout` revokes the current refresh token/session only
- `POST /api/auth/link-google` links a verified Google identity after password login
- `PUT /api/profile/change-password` changes password from profile
- password recovery is not implemented yet and may be shown in UI as currently being updated

Approved token/session rules:

- access token expiry: 1 hour
- refresh token expiry: 7 days
- refresh token/session storage uses a dedicated `RefreshTokens` table
- lockout threshold: 5 failed login attempts
- lockout duration: 15 minutes

Approved registration credit rule:

- new users receive 5 starting credits
- the starting credit grant must write a `CreditTransactions` row
- `InitialGrant` is the approved `CreditTransaction.Type` value for starting credits

Approved Google identity rules:

- if `provider_user_id` or Google `sub` already exists in storage, login succeeds for that linked user
- if no provider user id exists but the Google email matches an existing password account, link is considered only when `email_verified = true`
- matching verified email must not silently auto-link; the preferred flow is password login first, then Google linking
- if `email_verified = false`, do not auto-link
- Google auto-register is allowed when there is no existing matching account conflict
- this does not approve official Google Forms API scopes or Google Forms integration behavior

Pending contract review before implementation:

- error response details

Approved JWT claims:

- `sub`: user id
- `email`: user email
- `role`: user role
- `jti`: token id

### Forms

- `POST /api/forms/analyze`
- `GET /api/forms/{projectId}/questions`

### Answer rules

- `POST /api/projects/{projectId}/answer-rules`
- `PUT /api/projects/{projectId}/answer-rules/{ruleId}`

Approved Checkbox answer-rule config extension:

- applies only to `FormQuestionTypes.Checkbox`
- existing choice modes stay unchanged: `RandomEqually`, `RandomByPercentage`, `RandomByQuantity`
- `RandomByPercentage` uses integer percentage weights from 0 to 100
- frontend should display percentage inputs and keep the visible total at or below 100%
- `ConfigJson.minSelections`: minimum selected options per generated answer
- `ConfigJson.maxSelections`: maximum selected options per generated answer
- if omitted, both default to `1` for backward compatibility
- `maxSelections` must not exceed the configured option count or generated answer value limit
- `MultipleChoice`, `Dropdown`, `LinearScale`, and `Rating` remain single-value answer questions
- `CheckboxGrid` remains Deferred for separate rule design

### Generated responses

- `POST /api/projects/{projectId}/responses/generate`
- `GET /api/projects/{projectId}/responses`

Approved preview generation behavior:

- request `count` must remain from 1 to 100
- each generated preview response costs 1 credit
- if available credit is lower than requested `count` but greater than 0, generate only the available-credit count instead of failing the whole request
- when partial generation happens, deduct only the generated count and return the missing credit count so the UI can prompt top-up
- if available credit is 0, reject preview generation without storing generated responses or writing a credit transaction

Approved `GenerateResponsesResponse` fields:

- `items`: generated preview responses
- `creditsUsed`: number of credits deducted for this generation
- `balanceAfter`: user credit balance after deduction
- `requestedCount`: requested preview count
- `generatedCount`: actual generated preview count
- `missingCredits`: credits still needed to satisfy the requested preview count

### Submissions

- `POST /api/projects/{projectId}/submissions/send`
- `GET /api/projects/{projectId}/submissions/jobs/{jobId}`
- `POST /api/projects/{projectId}/submissions/jobs/{jobId}/pause`
- `POST /api/projects/{projectId}/submissions/jobs/{jobId}/cancel`

Submission safety rules:

- Preview generation accepts 1 to 100 responses per action.
- Submission accepts at most 100 confirmed preview response IDs per job.
- Submission processing must run sequentially in batches of 10, with no artificial delay and no parallel submission burst.
- A project may have only one active submission job at a time.
- Pause/cancel may stop processing only at a batch boundary; an already-running response send is not force-killed.

## DTO Rules

- Every request body must have an explicit request DTO.
- Every response must have an explicit response DTO or documented primitive response.
- Do not expose EF Core entities directly as API responses.
- Do not add fields because a frontend might need them later.
- Validation rules must be documented with the DTO contract.

## Error Response Rules

Use a consistent error shape once implementation begins.

Assumption: ASP.NET Core `ProblemDetails` is a reasonable default candidate, but this is not approved as the final error contract.

## Pagination And Filtering

- List endpoints should support pagination before production use.
- Exact pagination shape is Deferred.
- Filtering fields must be documented before implementation.
- Sorting fields must be documented before implementation.

## Status Discipline

- Status fields are proposed only until reviewed.
- Do not add lifecycle names casually.
- Each status needs allowed transitions, owner, and terminal-state behavior.

## Approved Status And Type Values

Approved values:

TopupOrder.Status:

- Pending
- Cancelled
- Approved
- Rejected

Phase 8 rule:

- Keep `TopupOrder.Status` as `Pending -> Approved` for the first PayOS implementation unless a later lifecycle review approves payment-specific top-up statuses.
- Store PayOS-specific status details in payment metadata instead of adding top-up lifecycle names casually.

CreditTransaction.Type:

- TopupApproved
- CreditUsed
- InitialGrant

Phase 8 rule:

- Automatic PayOS credit grants should reuse `TopupApproved` unless a later ledger review approves a new credit transaction type.

UsageLog.Status:

- Success
- Failed

User.Role:

- User
- Admin

No other status, type, or role values are approved unless explicitly documented.

## Temporary User Context

Assumption: Phase 7 JWT authentication is now the normal app authentication path. Temporary request headers may remain only as development/test fallback behavior in the current user context implementation and are not used by the Next.js dashboard API client:

- `X-FormAuto-UserId`
- `X-FormAuto-IsAdmin`

These headers are not the final authentication contract.

## Versioning And OpenAPI

- API versioning policy: Deferred.
- OpenAPI generation is expected but implementation detail is Deferred.

## Change Rule

Any API contract change must update both `docs/ai` and `docs/vi`.
