# NCKH_PHASE_7_SINGLE_APPROVAL_PACKET

## Mục đích

Cung cấp một approval packet sẵn cho worker để implement NCKH Phase 7 frontend expansion.

## Trạng thái approval

Packet này được chuẩn bị bởi task kickoff/freeze Phase 7 đã được duyệt.

Implementation packet này vẫn cần user approve rõ trước khi sửa code.

## Worker prompt

Implement only NCKH Phase 7 Frontend Expansion inside the existing FormAuto Hub Next.js dashboard. Start by reading `README.md`, `AGENTS.md`, `docs/ai/AI_DOC_ROUTING_MATRIX.md`, `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`, `docs/ai/nckh/NCKH_PHASE_7_KICKOFF_PLAN.md`, `docs/ai/nckh/NCKH_PHASE_7_CONTRACT_UI_FREEZE.md`, `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`, `docs/ai/nckh/NCKH_MODULE_MAP.md`, `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`, and `docs/ai/FRONTEND_STYLE_GUIDE.md`.

Build frontend UI only over existing NCKH Phase 1-6 backend contracts. Extend `/dashboard/nckh` into a usable research workspace with form/model navigation, model management, variable management, observed mapping, canvas relation management, generate-form action, data collection/normalization/dataset views, and CSV/codebook/SPSS export actions.

Do not add backend endpoints, DTO fields, database migrations, Google scopes, Google Sheets, scheduled jobs, statistical analysis, charts, NCKH admin UI, credit/pricing, or collaboration features. If an expected UI action needs an unsupported backend contract, stop and report the contract gap instead of inventing it.

Reuse existing shared frontend components before creating local UI. Keep Vietnamese-first copy. Include loading, empty, error, permission, blocked, and success states. Add or update focused frontend/API client tests and run the smallest applicable frontend build/browser smoke. Report validation with `Verified`, `Not run`, and `Blocked` labels.

## Files được phép

- `apps/web/app/dashboard/nckh/**`
- `apps/web/lib/api.ts`
- `apps/web/tests/**`
- `apps/web/components/**` chỉ cho reusable shared primitives có lý do dùng lặp lại
- paired Phase 7 closeout docs dưới `docs/ai/nckh` và `docs/vi/nckh` sau implementation

## Cấm nếu chưa có approval riêng

- backend entity, migration, controller, service, hoặc DTO contract changes
- Google scopes hoặc integration behavior mới
- Google Sheets collection
- scheduled sync, watches, Pub/Sub, hoặc background workers
- phân tích thống kê, charting, reports, hoặc SPSS execution
- admin UI riêng cho NCKH
- credit/pricing
- multi-researcher collaboration

## Validation kỳ vọng

- frontend build cho `apps/web`
- focused tests phù hợp nếu có cho frontend surface bị chạm
- Playwright/browser smoke cho `/dashboard/nckh` và primary form/model workspace path
- authenticated API-backed smoke khi UI phụ thuộc backend data
- kiểm tra logs sau smoke

## Reviewer prompt

Review NCKH Phase 7 only. Confirm it stays frontend-only over existing Phase 1-6 APIs, does not invent backend/API/database/Google contracts, reuses shared dashboard components, keeps Vietnamese-first copy, handles loading/empty/error/permission/blocked states, and reports validation honestly. Do not perform broad new implementation during review.

