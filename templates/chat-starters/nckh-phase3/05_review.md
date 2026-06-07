# NCKH Phase 3 Final Review

Use `formauto-reviewer`. Add `formauto-contract-guard` and `formauto-db-risk-reviewer`.

Task:

Review the NCKH Phase 3 implementation, validation result, and docs closeout.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
- `docs/ai/nckh/NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- Worker A/B/C/D result summaries and diffs

Prioritize findings on:

- scope drift beyond backend-only Phase 3
- illegal `Archived`, AI, statistics, Google write scope, Google Sheets, data collection, normalization, export, credit/pricing, admin UI, or frontend canvas behavior
- `ModelRelation` FK/delete behavior correctness
- `NodePosition` check/index/FK correctness
- ownership enforcement
- same-model variable/relation validation
- self-relation and duplicate directed relation behavior
- Draft-only edit enforcement and Active read-only behavior
- deterministic hypothesis output and no AI calls
- migration reversibility
- authenticated runtime smoke honesty
- docs AI/VI sync

Lead with findings ordered by severity. If no findings, say so clearly and list residual risks.

Return:

- Findings
- Open questions or assumptions
- Validation gaps
- Go/no-go recommendation for Phase 3 closeout
- Files reviewed

