# NCKH Phase 2 Sub-Agent Runbook

Use this runbook to dispatch the existing Codex sub-agents in a controlled order for NCKH Phase 2.

## Goal

Deliver NCKH Phase 2 as a backend-only slice with these approved rules preserved:

- multiple models per imported form are allowed
- at most one `Active` model per imported form
- Phase 2 supports `Draft -> Active`
- `ObservedQuestionMapping` uses separate endpoint(s)
- `Archived` stays out of Phase 2
- model delete is allowed only after FK/dependency review to non-owned tables
- future frontend delete confirmation UX is out of Phase 2 execution scope

## Required Reading Before Any Worker

Every worker should read these first:

1. `README.md`
2. `AGENTS.md`
3. `docs/ai/AI_DOC_ROUTING_MATRIX.md`
4. `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
5. `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
6. `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`
7. `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
8. `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
9. `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md`

## Worker Order

1. Worker A: contract and DB freeze
2. Worker B: persistence foundation
3. Worker C: model API
4. Worker D: variable and mapping API
5. Worker E: final review

Do not skip Worker A. Do not run Worker E before the implementation passes are complete.

## Worker A

Skill:

- `formauto-contract-guard`
- add `formauto-db-risk-reviewer`

Prompt file:

- `templates/chat-starters/nckh-phase2/01_contract_db_freeze.md`

Input to provide:

- current approved NCKH Phase 2 docs
- any proposed route or entity shape from the latest plan

Expected output:

- confirmed route surface
- confirmed entity/index/FK/delete-behavior surface
- explicit list of remaining conflicts or risks
- safe constraints for Worker B/C/D

Stop if:

- a new status beyond `Draft` and `Active` is proposed
- `Archived` is pulled into Phase 2
- mappings are pushed back into nested variable payloads
- delete behavior for non-owned tables is still unclear

Handoff to Worker B only when:

- contract surface is stable enough for schema work
- DB risks are named clearly enough to implement the persistence slice

## Worker B

Skill:

- `formauto-implementation-worker`

Prompt file:

- `templates/chat-starters/nckh-phase2/02_persistence_foundation.md`

Input to provide:

- Worker A output
- current Phase 2 kickoff plan

Expected output:

- `ResearchModel`, `ResearchVariable`, `ObservedQuestionMapping`
- `DbSet` additions
- `OnModelCreating` rules
- migration
- persistence-scope tests if appropriate

Stop if:

- the only safe way forward needs Phase 3 entities
- single-active enforcement cannot be expressed safely yet
- non-owned delete dependencies make the model delete contract unsafe

Handoff to Worker C only when:

- schema is stable
- migration shape is clear
- model lifecycle storage is ready for `Draft -> Active`

## Worker C

Skill:

- `formauto-implementation-worker`

Prompt file:

- `templates/chat-starters/nckh-phase2/03_model_api.md`

Input to provide:

- Worker A output
- Worker B output/diff

Expected output:

- model create/list/detail/update/delete API
- `Draft -> Active` transition support
- ownership enforcement
- single-active-per-form enforcement
- tests for validation and conflict behavior

Stop if:

- the API needs variable or mapping behavior to be invented first
- delete behavior for non-owned tables is unresolved
- implementation starts drifting into frontend or Phase 3+

Handoff to Worker D only when:

- model endpoints are stable
- activation rules are implemented or explicitly blocked with evidence

## Worker D

Skill:

- `formauto-implementation-worker`

Prompt file:

- `templates/chat-starters/nckh-phase2/04_variable_mapping_api.md`

Input to provide:

- Worker A output
- Worker B output/diff
- Worker C output/diff

Expected output:

- variable CRUD
- mapping CRUD through separate endpoint(s)
- ownership checks across model, variable, imported form question
- tests for duplicate code, duplicate observed code, invalid scale payload, and cross-model misuse

Stop if:

- mappings are being folded into variable payloads
- relation/canvas behavior starts appearing
- data collection or export behavior starts appearing

Handoff to Worker E only when:

- all approved backend Phase 2 slices are implemented or honestly blocked

## Worker E

Skill:

- `formauto-reviewer`

Prompt file:

- `templates/chat-starters/nckh-phase2/05_review.md`

Input to provide:

- diffs or result summaries from Workers B/C/D

Expected output:

- findings first, by severity
- explicit scope-drift callouts if any
- contract/DB/delete risk review
- validation honesty review

Stop if:

- the review starts proposing broad new implementation instead of reviewing the delivered slice

## Operator Checklist

Before dispatching each worker:

- confirm the previous worker has either completed or produced a real blocker
- paste only the relevant prompt file plus the latest approved context
- keep Deferred items out of scope

After each worker returns:

- capture a short summary
- decide whether the next worker has enough stable input
- stop if the worker surfaced a real contract or DB blocker

## Minimal Handoff Format

When you pass work from one worker to the next, use this compact structure:

```md
Task:
[one-sentence scope]

Approved baseline:
- [facts that must not change]

Input from previous worker:
- [confirmed decisions]
- [open risks]

Required output:
- [deliverables for this worker]

Stop if:
- [concrete stop conditions]
```

## Fast Start

If you want to start immediately, use this order:

1. Open `templates/chat-starters/nckh-phase2/01_contract_db_freeze.md`
2. Dispatch to the contract/DB sub-agent
3. After that result is stable, dispatch `02_persistence_foundation.md`
4. Then `03_model_api.md`
5. Then `04_variable_mapping_api.md`
6. Finish with `05_review.md`
