# NCKH Phase 3 Sub-Agent Runbook

Use this runbook to dispatch existing Codex sub-agents in a controlled order for NCKH Phase 3.

## Goal

Deliver NCKH Phase 3 as a backend-only slice:

- `ModelRelation` persistence and API
- `NodePosition` persistence and API
- deterministic hypothesis output
- validation and closeout docs after runtime proof

## Required Approval

Do not start implementation until the user explicitly approves:

- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`

After approval, do not re-open approved choices unless source evidence contradicts them.

## Worker Order

1. Worker A: persistence foundation
2. Worker B: relation API
3. Worker C: node positions and deterministic hypothesis output
4. Worker D: validation and closeout docs
5. Worker E: final review

Do not run Worker D before implementation workers complete. Do not run Worker E before validation/doc closeout is complete or explicitly blocked.

## Worker A

Skill:

- `formauto-implementation-worker`
- add `formauto-contract-guard` if contract drift is suspected

Prompt file:

- `templates/chat-starters/nckh-phase3/01_persistence_foundation.md`

Expected output:

- Phase 3 entities
- DbSet additions
- `OnModelCreating` rules
- migration
- persistence tests

Handoff to Worker B only when schema and migration are stable or honestly blocked.

## Worker B

Skill:

- `formauto-implementation-worker`

Prompt file:

- `templates/chat-starters/nckh-phase3/02_relation_api.md`

Expected output:

- relation DTOs/service/controller routes
- same-model and ownership validation
- duplicate/self-relation handling
- Draft-only edit enforcement
- relation API tests

Handoff to Worker C only when relation API is stable or honestly blocked.

## Worker C

Skill:

- `formauto-implementation-worker`

Prompt file:

- `templates/chat-starters/nckh-phase3/03_node_positions_hypothesis.md`

Expected output:

- node-position save/load behavior
- deterministic hypothesis output behavior if not fully covered by Worker B
- tests for node positions and deterministic output

Handoff to Worker D only when all approved backend Phase 3 scope is implemented or honestly blocked.

## Worker D

Skill:

- `formauto-http-behavior-tester`
- add `formauto-controlled-doc-editor`

Prompt file:

- `templates/chat-starters/nckh-phase3/04_validation_closeout_docs.md`

Expected output:

- build/test results
- migration apply result
- authenticated HTTP smoke results
- logs inspected
- smoke data cleanup
- paired `docs/ai` and `docs/vi` closeout/progress updates if validation passes

Handoff to Worker E after validation and docs update, or after a clear blocker report.

## Worker E

Skill:

- `formauto-reviewer`
- add `formauto-contract-guard`, `formauto-db-risk-reviewer`

Prompt file:

- `templates/chat-starters/nckh-phase3/05_review.md`

Expected output:

- findings first, ordered by severity
- scope discipline review
- contract and DB risk review
- validation honesty review
- go/no-go recommendation for Phase 3 closeout

## Minimal Handoff Format

```md
Task:
[one-sentence scope]

Approved baseline:
- NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md is approved.
- NCKH_PHASE_3_CONTRACT_DB_FREEZE.md is the contract/DB baseline.

Input from previous worker:
- [confirmed changes]
- [validation or blockers]

Required output:
- [deliverables]

Stop if:
- [concrete stop conditions]
```

