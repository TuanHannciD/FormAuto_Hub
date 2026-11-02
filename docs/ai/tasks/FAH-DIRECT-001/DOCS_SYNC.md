# FAH-DIRECT-001 — Baseline documentation sync

Date: 2026-11-01. Writer: `/root/direct_rules_docs_sync`, `gpt-5.6-sol`, reasoning `low`; no nested agents.

## Summary and scope

Aligned the current baseline with the approved Option 1 direct rules flow: one **Tạo và gửi ngay** action without preview UI or a second confirmation. Options 2/3 retain human preview and explicit confirmation. This is a local follow-up to the unchanged closed baseline phase, not an integration or release claim.

Updated only current baseline/owner documentation and its Vietnamese counterparts. Historical phase packages, closeout evidence, and task ledgers owned by other agents were not rewritten.

## Files changed

- `README.md`; `AGENTS.md`.
- `docs/ai/API_CONTRACT_GUIDE.md` and `docs/vi/API_CONTRACT_GUIDE.md`.
- `docs/ai/ARCHITECTURE_BOUNDARIES.md` and `docs/vi/ARCHITECTURE_BOUNDARIES.md`.
- This report and `docs/vi/tasks/FAH-DIRECT-001/DOCS_SYNC.md`.

## Contract alignment

Documented the implemented `POST /api/projects/{projectId}/submissions/send-rules-direct` request and existing response, count bounds, x1 partial-credit total, first-call-wins read-only replay, authorized 4xx failure audit, sequential batches, and fail-closed recovery boundary. No new schema, DTO field, status, refund rule, provider behavior, exactly-once guarantee, automatic resume, phase, or release commitment was introduced.

## Validation

- Verified: compared the wording with the exact controller, DTO, direct service and admission source signatures, plus the frozen backend contract/review.
- Verified: scoped AI/VI meaning review, Markdown link targets, UTF-8 reading, and `git diff --check` for these files.
- Not run: application build/test/runtime/browser checks; this is documentation-only and runnable work remains owned by the frontend/runtime/root agents.

## Risks and next step

Frontend corrections and final runtime evidence were still pending when this sync was written. Root should combine their final results with the already passed backend rereview before making any local completion claim.
