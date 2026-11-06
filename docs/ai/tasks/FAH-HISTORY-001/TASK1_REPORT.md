# Task 1 author report

## Summary

**Verified: documentation authoring and self-review only, 2026-11-05.** Concrete proposed contracts, SQL schema/transitions, legacy policy and cutover/reconciliation gates are ready for root's independent review. This does not mark Task1 accepted, approve new financial decisions, implement Tasks2–5 or activate sending.

## Files changed

Created only these four paired files in `docs/ai/tasks/FAH-HISTORY-001/` and `docs/vi/tasks/FAH-HISTORY-001/`:

- [CONTRACTS.md](CONTRACTS.md): exact owner routes, DTOs/interfaces, server command fingerprint/replay, errors, compatibility and evidence constraints.
- [DB_REVIEW.md](DB_REVIEW.md): exact proposed fields/types/nullable/index/FK/checks, immutable snapshots/events, ordered locks/retries, state/entitlement matrix and SQL proof requirements.
- [CUTOVER.md](CUTOVER.md): proven grouping/backfill, drain/client recovery, operator evidence policy and four decisions.
- TASK1_REPORT.md (this report).

## Scope alignment

Base HEAD remains `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`; dossier was already untracked at start, so no tracked diff represents those pre-existing files. Preserved INDEX, IMPLEMENTATION_PLAN, PROGRESS, TASK1_BRIEF and all unrelated work. No canonical or production edits. No DB/process/provider/network/install/commit/remote/deployment/cleanup. No nested agents; author route is parent-dispatched Sol under the configured ceiling, independent review belongs to root.

Used contract guard, DB architecture planner and verification-before-completion. DB risk analysis is author self-review, not the independent reviewer role. Read README/AGENTS/authority/execution/routing/skill matrix, approved AI+VI spec, plan constraints/file map/Task1 only; source entities/EF/contracts/controller/service/integration and relevant tests/consumers. Source search found only ResponseGenerationService/AiGenerationService currently deduct usage; CreditService owns balance mutation. Current Google parser Required=false/fallback and 2xx/302 success prevent a claim of trustworthy receipt support.

## Validation performed

- Verified read-only source evidence: actual GoogleFormSubmitResult symbol/path; account decimal/RowVersion, missing reservation/unique-owner model, project-first admission and direct read-only replay; existing failure/unknown/cancel/commit-ack tests and resume consumers inspected, not executed.
- Verified paired document self-review: equal API/schema/type/financial commitments, 0/1/2+send1, 20 account runs, 1–100 and sequential10; legacy L1 explicitly unapproved; Unknown is never Failed/TTL-release/auto-retry; new names remain proposed.
- Verified structural checks: strict UTF-8 decoding, no replacement characters, every authored file <400 lines, relative links exist, paired C# record/enum/interface code agrees excluding translated comments; no conflict markers. Final command output is reported to root alongside these files.
- Verified final workspace status/diff scope: only existing untracked dossier directories; no tracked change. New four paired files are the authorized output. Parent may be writing the separate PROGRESS ledger concurrently; author did not edit it.

## Validation not performed

Not run: application build/unit/API/browser/SQL/migration/provider/live Google, because Task1 authorizes documentation only. These proposals have no runtime validation and must not be reported as implemented. Independent review: Not run by author; root will dispatch a fresh reviewer. User approval: Blocked pending presentation of reviewed artifacts/decisions; no request sent by author.

## Risks / Deferred items

Root decision packet: **L1** retain prepaid first-success after confirmed legacy failure; **L2** proven-only grouping and quarantine/recovery policy; **P1** restricted fail-closed provider support with no established reliable receipt; **O1** scoped operator authority/evidence/tooling. L1 blocks entitlement consumers/backfill; evidence and reconciliation capability block production paid-send activation. The underlying generation/history feature remains approved. No financial choice is silently adopted.

Proposed batch retry identity is first fixed response ID (explicitly described to retain AppendBatchAsync's planned signature); reviewer must check this and all filtered uniqueness/FK/check assumptions in eventual SQL migration. Historical Success as well as Failed can be ambiguous under old boolean classifier. Twenty reusable slots do not bound audit/payload storage. Physical purge, broader parser work, operator endpoint, worker, official API and NCKH remain Deferred/out of scope.

## Next recommended step

Root obtains independent contract/DB/submission-safety review of all eight files on this snapshot, fixes/rechecks/re-reviews findings, then presents L1/L2/P1/O1 to user. Do not start dependent production implementation while required financial/schema/lifecycle decisions remain unapproved. No commit/integration/release claim.

## Review fix round 1 — author response

Addressed all three Important findings in the same eight authorized files, with no source/DB/runtime change: (1) normative v2 status/FinishedAt/RunnerAcknowledgedAt matrix, exact active-project predicate and v2-vs-legacy counters; a stopped Unknown still fences its project/holds funds; (2) separate ReconcileLegacyAttemptAsync(response/log/manifest identity,evidence) for legacy without item/hold, proposed fifth append-only evidence table and immutable AuditLog, SQL idempotency/conflicts with no ledger writes; (3) incomplete ObservedMetadata at creation remains visible history, nullable required/constraints and Unknown receipt, while complete fresh CompatibilityEvidence is required only for send admission and copied into immutable job items.

Fresh documentation checks rerun after fixes: UTF-8, links/anchors, paired C# contracts, <400 lines/file, no conflict markers and git diff --check. Product/runtime checks remain Not run. Independent acceptance/re-review remains required from root; L1/L2/P1/O1 remain unapproved. Reviewer should assess the proposed project-wide Unknown fence and fifth legacy-evidence table as concrete technical choices, not existing implemented behavior.

## Review regression fix round 2 — author response

Replaced the invalid SubmissionJobs index key containing current `Status nvarchar(max)` with nonclustered key `(ProjectId,RunnerAcknowledgedAt)` INCLUDE `(Status)` in both DB_REVIEW copies. No Status type narrowing is proposed. The complete active predicate, item-state EXISTS checks, legacy handling and ordered-lock enforcement are unchanged. Fresh docs checks cover UTF-8, links/anchors, line limits, paired proposal text and git diff --check; no SQL/runtime/source/commit operation. Only DB_REVIEW and TASK1_REPORT AI/VI changed in this round. All eight artifacts are frozen for re-review after this check.
