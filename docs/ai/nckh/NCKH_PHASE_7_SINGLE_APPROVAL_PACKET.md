# NCKH_PHASE_7_SINGLE_APPROVAL_PACKET

## Purpose

Provide a single worker-ready approval packet for the NCKH Phase 7 frontend expansion implementation.

## Approval Status

This packet is prepared by the approved Phase 7 kickoff/freeze task.

Implementation of this packet still requires explicit user approval before code changes.

## Worker Prompt

Implement only NCKH Phase 7 Frontend Expansion inside the existing FormAuto Hub Next.js dashboard. Start by reading `README.md`, `AGENTS.md`, `docs/ai/AI_DOC_ROUTING_MATRIX.md`, `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`, `docs/ai/nckh/NCKH_PHASE_7_KICKOFF_PLAN.md`, `docs/ai/nckh/NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`, `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`, `docs/ai/nckh/NCKH_MODULE_MAP.md`, `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`, and `docs/ai/FRONTEND_STYLE_GUIDE.md`.

Build frontend UI only over existing NCKH Phase 1-6 backend contracts. Extend `/dashboard/nckh` into a usable research workspace with form/model navigation, model management, variable management, observed mapping, canvas relation management, generate-form action, data collection/normalization/dataset views, and CSV/codebook/SPSS export actions.

Do not add backend endpoints, DTO fields, database migrations, Google scopes, Google Sheets, scheduled jobs, statistical analysis, charts, NCKH admin UI, credit/pricing, or collaboration features. If an expected UI action needs an unsupported backend contract, stop and report the contract gap instead of inventing it.

Reuse existing shared frontend components before creating local UI. Keep Vietnamese-first copy. Include loading, empty, error, permission, blocked, and success states. Add or update focused frontend/API client tests and run the smallest applicable frontend build/browser smoke. Report validation with `Verified`, `Not run`, and `Blocked` labels.

## Allowed Files

- `apps/web/app/dashboard/nckh/**`
- `apps/web/lib/api.ts`
- `apps/web/tests/**`
- `apps/web/components/**` only for reusable shared primitives that are justified by repeated use
- paired Phase 7 closeout docs under `docs/ai/nckh` and `docs/vi/nckh` after implementation

## Forbidden Without Separate Approval

- backend entity, migration, controller, service, or DTO contract changes
- new Google scopes or integration behavior
- Google Sheets collection
- scheduled sync, watches, Pub/Sub, or background workers
- statistical analysis, charting, reports, or SPSS execution
- NCKH admin UI
- credit/pricing
- multi-researcher collaboration

## Expected Validation

- frontend build for `apps/web`
- relevant focused tests if available for the touched frontend surface
- Playwright/browser smoke for `/dashboard/nckh` and the primary form/model workspace path
- authenticated API-backed smoke where the UI depends on backend data
- logs inspected after smoke

## Reviewer Prompt

Review NCKH Phase 7 only. Confirm it stays frontend-only over existing Phase 1-6 APIs, does not invent backend/API/database/Google contracts, reuses shared dashboard components, keeps Vietnamese-first copy, handles loading/empty/error/permission/blocked states, and reports validation honestly. Do not perform broad new implementation during review.

