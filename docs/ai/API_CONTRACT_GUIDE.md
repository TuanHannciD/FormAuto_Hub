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

### Top-up orders

- `POST /api/topup-orders`
- `GET /api/topup-orders`
- `GET /api/topup-orders/recent`
- `GET /api/topup-orders/{id}`
- `POST /api/topup-orders/{id}/cancel`

### Admin top-up orders

- `GET /api/admin/topup-orders`
- `POST /api/admin/topup-orders/{id}/approve`
- `POST /api/admin/topup-orders/{id}/reject`

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

CreditTransaction.Type:

- TopupApproved
- CreditUsed
- InitialGrant

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
