# NCKH_PHASE_2_KICKOFF_PLAN

## Purpose

Define the approval-gated kickoff plan for NCKH Phase 2 so the work can be delegated in narrow passes without inventing contracts or widening scope.

Closeout note: Phase 2 has now been implemented and validated for the approved backend-only scope. Use `NCKH_PHASE_2_CLOSEOUT.md` as the current completion evidence. Keep this kickoff plan as historical handoff context.

## Phase Goal

Open the first post-Phase-1 implementation slice for the NCKH module:

- create a user-owned `ResearchModel`
- create and manage `ResearchVariable`
- create and manage `ObservedQuestionMapping`

Phase 2 is a model-definition phase. It does not approve canvas relations, Google Form write/update, response collection, normalization, export, credit, or admin UI.

## Current Repo Truth

- NCKH Phase 1 is completed for its approved scope.
- NCKH Phase 2 is completed for its approved backend-only scope.
- No NCKH implementation phase is active by default.
- Phase 3 is the next proposed phase and still requires explicit approval before implementation.
- Current repo evidence shows NCKH Phase 1 Google link requires Forms read permission, not Google Sheets scope.

## Confirmed Phase 2 Scope

In scope for this kickoff plan:

- `ResearchModel` entity, migration, DbSet, service, controller, DTOs, tests
- `ResearchVariable` entity, migration, DbSet, service, controller, DTOs, tests
- `ObservedQuestionMapping` entity, migration, DbSet, service, controller, DTOs, tests
- user-owned CRUD boundaries for the three areas above
- validation rules for variable code, type, scale, and mapping ownership
- allow multiple models per imported form, but at most one `Active` model per imported form
- paged list/detail responses where the API surface is list-shaped
- backend-only delivery in Phase 2

## Out Of Scope

Not allowed in Phase 2:

- `ModelRelation` and `NodePosition`
- React Flow canvas
- Google Forms create/update
- Google Sheets response pull
- normalization or dataset generation
- CSV/Excel/SPSS export
- credit deduction or pricing
- NCKH admin UI
- background jobs, watches, or Pub/Sub

## Entry Gates

Before any implementation worker starts, confirm all of the following:

1. The user explicitly approves opening NCKH Phase 2.
2. Contract review is completed for routes, DTOs, statuses, and lifecycle wording.
3. DB risk review is completed for entity fields, FKs, delete behavior, indexes, and migration reversibility.
4. `docs/ai/nckh` and `docs/vi/nckh` are ready to stay synced for any contract change.
5. Phase 2 work does not silently pull in Phase 3-8 concerns.

## Approved Decisions

The following decisions are now approved for Phase 2 planning:

1. Model cardinality per imported form
   - Multiple models per imported form are allowed.
   - At most one model in `Active` status is allowed per imported form.

2. Phase 2 depth
   - Phase 2 is backend-only first.

3. Mapping contract direction
   - `ObservedQuestionMapping` is handled through separate endpoint(s), not nested variable create/update payloads.

4. Lifecycle direction
   - Phase 2 must support `Draft` as the default and minimum status.
   - Phase 2 also supports an explicit `Draft -> Active` transition.
   - `Archived` stays out of Phase 2 scope.

5. Model deletion direction
   - Model deletion is allowed in Phase 2.
   - The implementation must inspect constraints and dependencies to tables outside the model-owned cascade path before finalizing delete behavior.
   - If a future frontend delete flow is built, the UI must use a standard confirmation dialog that summarizes what data would be affected, shows approximate impacted record counts, and requires the user to type the exact model name before delete confirmation.

## Contract Guardrails

- Do not invent new statuses beyond approved `ResearchModel` lifecycle values.
- Do not invent new variable types or scale types beyond the documented set unless separately approved.
- Do not let NCKH entities leak into FormAuto Hub automation, credit, or payment modules.
- Do not make Google Forms re-import destructive to mappings.
- Do not add Google Sheets scope or write scope under Phase 2.
- Do not fold mappings back into nested variable payloads.
- Do not treat the future delete-confirmation dialog as Phase 2 frontend scope.
- Do not treat proposed API examples as final until reviewed.

## Database Guardrails

- `ResearchModel -> ResearchVariable` uses cascade delete.
- `ResearchVariable -> ObservedQuestionMapping` uses cascade delete.
- `ObservedQuestionMapping -> ResearchFormQuestion` uses `DeleteBehavior.Restrict`.
- `ResearchModel.FormId` must allow multiple models per form while enforcing at most one `Active` model per form.
- Variable code uniqueness must be enforced at the database level per model.
- Mapping uniqueness must be enforced for both `(VariableId, FormQuestionId)` and `(VariableId, ObservedCode)`.
- Delete behavior must be reviewed against non-owned dependent tables before the delete contract is finalized.
- Migration must be reversible and must not alter Phase 1 Google token or form-import behavior.

## Suggested Delivery Passes

### Pass 0 - Contract And DB Freeze

Goal:

- resolve the approval points above
- lock the allowed entity set, lifecycle, route surface, and DB rules

Expected outputs:

- approved Phase 2 scope note
- approved entity/route checklist
- explicit decision log for the approved activation flow

Recommended skill mix:

- `formauto-contract-guard`
- `formauto-db-risk-reviewer`
- `formauto-delivery-planner`

### Pass 1 - Persistence Foundation

Goal:

- add Phase 2 entities and EF Core configuration without widening into later-phase behavior

Allowed file zones:

- `src/FormAutoHub.Api/Entities/Nckh/`
- `src/FormAutoHub.Api/Data/FormAutoHubDbContext.cs`
- `src/FormAutoHub.Api/Data/Migrations/`
- `tests/FormAutoHub.Tests/`

Expected outputs:

- `ResearchModel`
- `ResearchVariable`
- `ObservedQuestionMapping`
- DbSet additions
- `OnModelCreating` rules
- migration
- entity/migration tests where applicable

Stop conditions:

- unclear lifecycle values
- migration needs Phase 3 fields to make sense
- delete behavior to non-owned tables is still unclear after FK review

### Pass 2 - ResearchModel API

Goal:

- implement create/list/detail/update/delete for user-owned models

Allowed file zones:

- `src/FormAutoHub.Api/Contracts/`
- `src/FormAutoHub.Api/Controllers/Nckh/`
- `src/FormAutoHub.Api/Services/Nckh/`
- `tests/FormAutoHub.Tests/`

Expected outputs:

- model DTOs
- service workflow for ownership checks, multi-model-per-form support, and single-active-model enforcement
- controller routes under `/api/v1/nckh/models`
- tests for validation, ownership, duplicate form usage, and delete behavior

Stop conditions:

- contract review discovers route shape conflict with approved mapping approach
- model lifecycle cannot be implemented without relation/data rules from later phases

### Pass 3 - ResearchVariable API

Goal:

- implement variable CRUD under a model with code/type/scale validation

Expected outputs:

- variable DTOs
- service validation for duplicate code, allowed scale/type combinations, and archived-model guard
- tests for invalid scale payloads and duplicate code handling

Stop conditions:

- required business rules for `scalePoint`, `minValue`, and `maxValue` are still ambiguous

### Pass 4 - Mapping API

Goal:

- implement question-to-variable mapping creation, update, list, and delete without pulling in relations/canvas/data logic

Expected outputs:

- mapping DTOs and separate mapping endpoint(s)
- ownership validation across user -> model -> variable -> imported form question
- tests for duplicate observed code, cross-model question mapping, and restricted question delete assumptions

Stop conditions:

- mapping shape is not approved
- implementation would require Google Form re-import rewrite logic beyond Phase 2

### Pass 5 - Deferred Frontend Follow-Up

Goal:

- record the approved delete-confirmation UX requirement for a later frontend phase without implementing frontend work in Phase 2

Expected outputs:

- preserved backend-only scope for Phase 2
- documented requirement for a future delete-impact summary and exact-name confirmation dialog

Stop conditions:

- any attempt to implement frontend in Phase 2 without separate approval

### Pass 6 - Validation And Closeout Prep

Goal:

- verify the approved Phase 2 slice honestly before any closeout claim

Minimum validation target:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build`
- `npm run build` in `apps/web` if frontend changed
- migration add/apply validation when schema changes were made
- authenticated HTTP smoke for changed routes
- log inspection after smoke checks

## Suggested Sub-Agent Routing

The repo skill overlay is available for this work. Recommended routing:

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
   - add: `formauto-contract-guard`

## Worker-Ready Handoff Prompts

### Worker A - Contract/DB Freeze

"Review NCKH Phase 2 only. Do not write production code. Confirm the allowed entity set, lifecycle values including the approved `Draft -> Active` transition, route surface, delete behaviors, indexes, and any remaining approval gaps for `ResearchModel`, `ResearchVariable`, and `ObservedQuestionMapping`. Separate Confirmed, Proposed, Assumption, Deferred, and Approval Needed."

### Worker B - Persistence Foundation

"Implement only NCKH Phase 2 Pass 1 persistence foundation for `ResearchModel`, `ResearchVariable`, and `ObservedQuestionMapping` inside the existing FormAuto Hub solution. Do not add controllers, Google Sheets, relations, canvas, export, or frontend behavior. Respect approved delete behaviors and uniqueness rules. Add or update tests only for this persistence slice."

### Worker C - Model API

"Implement only NCKH Phase 2 Pass 2 model CRUD under `/api/v1/nckh/models`. Enforce user ownership and the approved form-to-model uniqueness rule. Do not add variable, relation, data, export, or frontend work beyond what is required for this API slice. Add route/service/tests for validation and ownership errors."

### Worker D - Variable And Mapping API

"Implement only NCKH Phase 2 Pass 3-4 for `ResearchVariable` and `ObservedQuestionMapping`. Keep scope limited to approved CRUD, validation, and tests. Do not add Phase 3 relations, Google write/update, data collection, normalization, export, or credit behavior."

### Worker E - Review

"Review the NCKH Phase 2 slice for scope discipline, contract safety, migration risk, delete behavior correctness, test honesty, and docs sync. Lead with findings. If no findings exist, state residual risks and validation gaps."

## Documentation Sync Needed When Phase 2 Opens

If implementation is approved, keep these in sync:

- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- phase-specific contract/entity docs if the approved surface changes

Do not mark Phase 2 completed from roadmap wording alone.

## Deferred

- Any Phase 3-8 behavior
- Google Sheets API response pull
- Google Forms write scope
- canvas/node position persistence
- normalization/export
- credit/pricing
- NCKH admin UI
