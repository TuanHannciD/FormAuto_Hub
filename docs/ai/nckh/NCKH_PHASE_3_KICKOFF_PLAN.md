# NCKH_PHASE_3_KICKOFF_PLAN

## Purpose

Define the approval-gated kickoff plan for NCKH Phase 3 so Canvas Relations & Hypothesis work can follow the same controlled path used for NCKH Phase 2.

This document is a planning and handoff artifact. It does not mark Phase 3 as implemented or completed.

## Phase Goal

Open the next post-Phase-2 implementation slice for the NCKH module:

- create and manage model relations between research variables
- save and load canvas node positions for model editing
- generate deterministic hypothesis codes and text from approved variable/relation data

Phase 3 is a canvas-and-relation phase. It does not approve Google Forms write/update, Google Sheets response collection, normalization, export, credit, pricing, admin UI, statistical analysis, or AI-generated hypothesis text.

## Current Repo Truth

- NCKH Phase 1 is completed for its approved OAuth and Google Forms read/import scope.
- NCKH Phase 2 is completed for its approved backend-only model, variable, and mapping scope.
- Phase 3 is the next proposed NCKH phase.
- Phase 3 implementation remains approval-gated until contract review and DB risk review are complete.
- Phase 2 closeout evidence is the dependency baseline for Phase 3 planning.
- Pass 0 contract and database freeze review is recorded in `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`.

## Proposed Phase 3 Scope

In scope for this kickoff plan:

- `ModelRelation` entity, migration, DbSet, service, controller, DTOs, and tests
- `NodePosition` entity, migration, DbSet, service, controller, DTOs, and tests
- user-owned CRUD boundaries for model relations
- save/load node positions for variables and relation canvas nodes if approved during contract freeze
- relation validation for ownership, model membership, duplicate relations, and self-relations
- deterministic hypothesis code/text generation from approved relation and variable metadata
- backend-first delivery unless frontend work is separately approved after backend contracts are frozen

## Out Of Scope

Not allowed in Phase 3:

- AI-generated hypothesis text
- statistical analysis
- Google Forms create/update
- Google Sheets response pull
- response collection
- normalization or dataset generation
- CSV/Excel/SPSS export
- credit deduction or pricing
- NCKH admin UI
- background jobs, watches, or Pub/Sub
- React Flow frontend implementation before backend contracts are approved
- destructive Google Form behavior

## Entry Gates

Before any implementation worker starts, confirm all of the following:

1. The user explicitly approves opening NCKH Phase 3 implementation.
2. Contract review is completed for routes, DTOs, relation types, allowed lifecycle/status interactions, and hypothesis output wording.
3. DB risk review is completed for entity fields, FKs, delete behavior, indexes, uniqueness, and migration reversibility.
4. Phase 3 does not silently pull in Phase 4-8 concerns.
5. `docs/ai/nckh` and `docs/vi/nckh` stay synced for any contract or phase-state change.

## Decisions To Freeze Before Code

The following points must be confirmed before implementation:

1. Relation shape
   - Proposed: relation belongs to one `ResearchModel`.
   - Proposed: relation connects one source `ResearchVariable` to one target `ResearchVariable` in the same model.
   - Approval needed: allowed relation type values and display labels.

2. Duplicate and self-relation behavior
   - Approval needed: whether `sourceVariableId == targetVariableId` is rejected.
   - Approval needed: whether duplicate source-target-type combinations are rejected.
   - Approval needed: whether inverse relations are considered duplicates.

3. Model status constraints
   - Approval needed: whether relations and node positions can be edited only while the model is `Draft`, or also while `Active`.
   - Deferred: any `Archived` behavior until a future lifecycle phase approves it.

4. Node position ownership
   - Proposed: node positions belong to one `ResearchModel`.
   - Approval needed: whether positions are stored only for variables or also for relation/hypothesis nodes.
   - Approval needed: coordinate precision and bounds validation.

5. Hypothesis generation
   - Proposed: deterministic only, using relation order/type and variable names/codes.
   - Deferred: AI-generated hypothesis text.
   - Approval needed: exact text template and code format.

6. Delete behavior
   - Approval needed: cascade or restrict behavior when a variable with relations is deleted.
   - Approval needed: delete behavior for node positions when variables or models are deleted.
   - Must re-review Phase 2 delete behavior before migration work.

## Contract Guardrails

- Do not treat proposed relation fields or route examples as final until contract review is complete.
- Do not invent lifecycle statuses beyond the approved `Draft` and `Active` model states.
- Do not add `Archived` behavior in Phase 3.
- Do not make hypothesis generation AI-backed.
- Do not make canvas save/load require frontend implementation inside Phase 3 unless explicitly approved.
- Do not add Google Forms write scope, Google Sheets scope, export behavior, or credit behavior.

## Database Guardrails

- Phase 3 migration must be reversible.
- New tables must not alter Phase 1 Google token/import behavior.
- New tables must not alter Phase 2 model, variable, or mapping semantics except through reviewed FK/delete behavior.
- Relations must enforce user ownership through the model/variable ownership chain.
- Indexes must support model-scoped relation and node-position lookups.
- Uniqueness rules must be explicit before migration generation.

## Suggested Delivery Passes

### Pass 0 - Contract And DB Freeze

Goal:

- lock allowed entities, route surface, relation rules, node-position rules, hypothesis output rules, and DB behavior

Expected outputs:

- approved Phase 3 scope note
- approved entity and route checklist
- explicit decision log for relation types, duplicate behavior, self-relation behavior, and delete behavior

Recommended skill mix:

- `formauto-contract-guard`
- `formauto-db-risk-reviewer`
- `formauto-delivery-planner`

### Pass 1 - Persistence Foundation

Goal:

- add Phase 3 entities and EF Core configuration without widening into later-phase behavior
- use `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md` as the contract and DB baseline

Allowed file zones:

- `src/FormAutoHub.Api/Entities/Nckh/`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/`
- `tests/FormAutoHub.Tests/`

Expected outputs:

- `ModelRelation`
- `NodePosition`
- DbSet additions
- `OnModelCreating` rules
- migration
- entity/migration tests where applicable

Stop conditions:

- relation types are not approved
- delete behavior is unclear
- node position ownership or coordinate rules are unclear
- migration needs Phase 4-8 fields to make sense

### Pass 2 - Relation API

Goal:

- implement create/list/detail/update/delete for user-owned model relations

Allowed file zones:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Expected outputs:

- relation DTOs
- service workflow for ownership checks and same-model variable validation
- controller routes under the approved NCKH route prefix
- tests for duplicate relation, self-relation, cross-model variable, and ownership errors

Stop conditions:

- route shape is not approved
- relation validation depends on future data-collection rules
- implementation requires statistical analysis or AI behavior

### Pass 3 - Node Position API

Goal:

- implement save/load behavior for node positions within an owned model

Expected outputs:

- node-position DTOs
- bulk upsert or replace behavior only if approved during contract freeze
- tests for ownership, invalid node references, and coordinate validation

Stop conditions:

- node identity rules are unclear
- frontend-specific React Flow payload is being treated as final without approval

### Pass 4 - Deterministic Hypothesis Output

Goal:

- expose deterministic hypothesis code/text output from approved relation and variable data

Expected outputs:

- service logic using approved templates only
- tests for repeatable output
- no AI provider calls

Stop conditions:

- hypothesis wording template is not approved
- request attempts to add AI-generated text
- request attempts to add statistical inference

### Pass 5 - Deferred Frontend Follow-Up

Goal:

- record frontend dependency without implementing React Flow unless separately approved

Expected outputs:

- preserved backend-first scope for Phase 3
- documented frontend handoff for a later approved slice

Stop conditions:

- any attempt to implement frontend in Phase 3 without explicit approval

### Pass 6 - Validation And Closeout Prep

Goal:

- verify the approved Phase 3 slice honestly before any closeout claim

Minimum validation target:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` in the intended development database when migrations are added
- authenticated HTTP smoke for changed routes
- log inspection after smoke checks
- `npm run build` and browser smoke only if frontend files changed

## Suggested Sub-Agent Routing

1. Planning/approval worker
   - primary: `formauto-delivery-planner`
   - add: `formauto-contract-guard`, `formauto-db-risk-reviewer`

2. Backend persistence worker
   - primary: `formauto-implementation-worker`
   - add: `formauto-contract-guard`

3. Backend API worker
   - primary: `formauto-implementation-worker`
   - add: `formauto-contract-guard`

4. Final review worker
   - primary: `formauto-reviewer`
   - add: `formauto-contract-guard`, `formauto-db-risk-reviewer`

## Worker-Ready Handoff Prompts

### Worker A - Contract/DB Freeze

"Review NCKH Phase 3 only. Do not write production code. Confirm the allowed entity set, relation types, route surface, node-position behavior, deterministic hypothesis output, delete behavior, indexes, and remaining approval gaps for `ModelRelation` and `NodePosition`. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Persistence Foundation

"Implement only NCKH Phase 3 Pass 1 persistence foundation for approved `ModelRelation` and `NodePosition` behavior inside the existing FormAuto Hub solution. Do not add controllers, React Flow UI, Google Forms write/update, Google Sheets, data collection, normalization, export, credit, statistical analysis, or AI behavior. Respect approved delete behaviors and uniqueness rules. Add or update tests only for this persistence slice."

### Worker C - Relation API

"Implement only NCKH Phase 3 relation CRUD under the approved `/api/v1/nckh` route surface. Enforce user ownership, same-model variable constraints, approved duplicate/self-relation behavior, and approved model-status constraints. Do not add node-position UI, Google integration, data collection, export, credit, statistical analysis, or AI behavior. Add focused service/controller/tests."

### Worker D - Node Position And Hypothesis API

"Implement only approved NCKH Phase 3 node-position save/load behavior and deterministic hypothesis output. Keep the output template rule-based and repeatable. Do not add React Flow frontend, AI provider calls, statistical analysis, Google Forms write/update, Google Sheets, response collection, normalization, or export. Add focused tests and runtime smoke coverage."

### Worker E - Review

"Review the NCKH Phase 3 slice for scope discipline, contract safety, migration risk, delete behavior correctness, ownership enforcement, deterministic hypothesis behavior, validation honesty, and docs sync. Lead with findings. If no findings exist, state residual risks and validation gaps."

## Documentation Sync Needed When Phase 3 Opens

If implementation is approved, keep these in sync:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- phase-specific contract/entity docs if the approved surface changes

Do not mark Phase 3 completed from kickoff wording alone.

## Deferred

- Any Phase 4-8 behavior
- AI-generated hypothesis text
- statistical analysis
- Google Sheets API response pull
- Google Forms write scope
- response collection
- normalization/export
- credit/pricing
- NCKH admin UI
- production-readiness claims without current runtime validation
