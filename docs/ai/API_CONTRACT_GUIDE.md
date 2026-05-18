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

### Forms

- `POST /api/forms/analyze`
- `GET /api/forms/{projectId}/questions`

### Answer rules

- `POST /api/projects/{projectId}/answer-rules`
- `PUT /api/projects/{projectId}/answer-rules/{ruleId}`

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

## Approved Phase 2 Status And Type Values

Approved for Phase 2 implementation:

TopupOrder.Status:

- Pending
- Cancelled
- Approved
- Rejected

CreditTransaction.Type:

- TopupApproved
- CreditUsed

UsageLog.Status:

- Success
- Failed

User.Role:

- User
- Admin

No other Phase 2 status, type, or role values are approved.

## Temporary User Context

Assumption: Until authentication and JWT claims are approved, Phase 2 controllers may use temporary request headers for development and test routing only:

- `X-FormAuto-UserId`
- `X-FormAuto-IsAdmin`

These headers are not the final authentication contract.

## Versioning And OpenAPI

- API versioning policy: Deferred.
- OpenAPI generation is expected but implementation detail is Deferred.

## Change Rule

Any API contract change must update both `docs/ai` and `docs/vi`.
