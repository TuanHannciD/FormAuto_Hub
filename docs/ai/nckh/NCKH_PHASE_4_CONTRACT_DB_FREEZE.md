# NCKH_PHASE_4_CONTRACT_DB_FREEZE

## Purpose

Record the Pass 0 contract, Google scope, and database freeze review for NCKH Phase 4 before any production implementation starts.

This file is a review and approval artifact. It does not mark Phase 4 as implemented or completed.

## Review Result

Status: **Ready for explicit Phase 4 implementation approval after user accepts the freeze decisions below**.

Phase 4 may proceed to implementation only after this freeze is accepted. Until then, Google Forms create/update routes, DTOs, Google write scope, and persistence changes remain proposed.

## Source Evidence Read

- `NCKH_PROGRESS_LEDGER.md`
- `NCKH_PHASE_TRANSITION_GUIDE.md`
- `NCKH_PHASE_ROADMAP.md`
- `NCKH_PHASE_3_CLOSEOUT.md`
- `NCKH_PHASE_4_KICKOFF_PLAN.md`
- `NCKH_REQUIREMENT_PACKAGE.md`
- `NCKH_DOMAIN_ENTITIES_OVERVIEW.md`
- `NCKH_API_CONTRACT_GUIDE.md`
- `NCKH_MODULE_MAP.md`
- `NCKH_ARCHITECTURE_BOUNDARIES.md`
- Official Google Forms API docs for create/update scope review

## Current Confirmed Baseline

- NCKH Phase 1, Phase 2, and Phase 3 are completed for their approved scopes.
- Existing route prefix is `/api/v1/nckh`.
- Phase 1 has Google Forms read/import behavior.
- Phase 2 has model, variable, and observed mapping behavior.
- Phase 3 has relation, node-position, and deterministic hypothesis behavior.
- Current implemented `ResearchModel.Status` values are `Draft` and `Active` only.
- `Archived` remains Deferred.
- Phase 4 must not add Google Sheets response pull, normalization, export, credit, admin UI, scheduled jobs, or auto-submit.

## Google Scope Review

Approval status: **Proposed for Phase 4 implementation approval**.

Candidate write scope:

- `https://www.googleapis.com/auth/forms.body`

Reason:

- Google Forms API create and batch-update operations require Forms body write permission according to official Google Forms API documentation reviewed for this planning pass.

Rules:

- The scope must be requested only through explicit user Google consent.
- The implementation must not silently assume existing Phase 1 read consent includes write permission.
- If the stored Google token lacks write scope, the API must return a clear re-consent-required error instead of attempting the write.
- Google Sheets scope remains Deferred until Phase 5.

Google API behavior risk:

- Official Google Forms API docs state that forms created with the API after 2026-06-30 will be unpublished by default. Phase 4 implementation must verify publish/response availability behavior during runtime validation instead of assuming created forms immediately accept responses.

## Freeze Decision: Phase 4 Route Surface

Approval status: **Proposed for Phase 4 implementation approval**.

Endpoint:

- `POST /api/v1/nckh/models/{modelId}/generate-form`

Request:

```json
{
  "action": "create"
}
```

or:

```json
{
  "action": "update"
}
```

Allowed action values:

- `create`
- `update`

Response 200:

```json
{
  "formId": "guid",
  "googleFormId": "xyz789",
  "formUrl": "https://docs.google.com/forms/d/xyz789/edit",
  "questionsCreated": 12,
  "questionsUpdated": 0,
  "questionsDeleted": 0,
  "reimported": true
}
```

Expected status mapping:

- `400` validation failure, unsupported action, model not ready for generation
- `401` unauthenticated request or Google account not linked
- `403` missing Google Forms write scope or not authorized to update the target form
- `404` model/form target not found in current user's scope
- `409` unsafe update conflict, stale mappings, or duplicate generated-form conflict
- `502` Google Forms API write/import failure

## Freeze Decision: Ownership And Model Readiness

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- The model must belong to the current authenticated user.
- The model's imported form must belong to the same user.
- Generation is allowed for `Draft` and `Active` models because Phase 2/3 already use `Active` as a selectable current model state and Phase 4 output does not mutate model structure.
- The model must have at least one observed mapping before generation.
- Every generated question must trace back to an existing `ObservedQuestionMapping` and `ResearchFormQuestion` unless a later approved create-from-variable template is added.
- The implementation must not submit responses to the generated form.

## Freeze Decision: Create Behavior

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- `create` creates a new Google Form using Google Forms API under the current user's consented Google account.
- The generated form title should derive from the research model name.
- Questions are generated from observed mappings ordered by variable sort order, then mapping sort order, then source question order.
- After a successful Google create/write, the app re-imports the generated Google Form structure into `ResearchForms` and `ResearchFormQuestions`.
- The generated/imported form remains user-owned in the NCKH data model.

## Freeze Decision: Update Behavior

Approval status: **Constrained for Phase 4 implementation approval**.

Rules:

- `update` may update only a Google Form that is already imported under the current user and can be accessed with the current user's Google write scope.
- The app must verify Google API authorization before writing.
- The implementation must not delete a Google Form.
- Question deletion inside a Google Form is not approved for Phase 4 MVP unless the implementation can prove the target question was previously generated by the app and is no longer represented by current mappings.
- Safer MVP default: update/create mapped questions and leave unmatched existing Google questions untouched.

## Freeze Decision: Question Mapping

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- Source order: variable `SortOrder`, mapping `SortOrder`, source question `OrderIndex`.
- Source question text remains the default generated question text.
- Variable code and observed code may be used in internal mapping metadata but must not be exposed to survey respondents unless explicitly approved by UI/copy requirements.
- Question type mapping must stay conservative:
  - Likert/Scale: Google scale-style question only if existing source question metadata supports it; otherwise keep text/question type mapping from imported question metadata.
  - Nominal/Ordinal: use choice-style question only when options are known from imported metadata; otherwise stop with validation error.
  - Text-like unknowns: use short text only if approved by current imported metadata.
- Do not invent survey answer choices that are not present in the imported form metadata or approved model data.

## Freeze Decision: Persistence

Approval status: **Proposed for Phase 4 implementation approval**.

Use existing `ResearchForms` and `ResearchFormQuestions` for generated form import wherever possible.

Approved minimal new fields if implementation confirms they are absent and required:

- `ResearchForms.GeneratedFromModelId` nullable GUID FK to `ResearchModels.Id`
- `ResearchForms.GenerationSource` string, allowed values: `Imported`, `Generated`
- `ResearchForms.LastGeneratedAt` nullable `DateTimeOffset`
- `ResearchForms.LastSyncedAt` nullable `DateTimeOffset`

Database rules:

- `GeneratedFromModelId -> ResearchModels`: restrict/no-action delete behavior to avoid deleting generated form history when a model is deleted.
- `GenerationSource` defaults to `Imported` for existing rows.
- Add index on `(UserId, GeneratedFromModelId)` if `GeneratedFromModelId` is added.
- Migration must be reversible and must not alter Phase 1/2/3 semantics.

DB risk notes:

- Adding generated-form tracking to `ResearchForms` is lower risk than creating a separate generated-form table for Phase 4 MVP.
- Delete behavior must avoid cycles between `ResearchModels` and `ResearchForms`.
- Existing imported forms must keep working after default values are applied.
- Google Forms API publish/default responder behavior may differ after 2026-06-30 and must be validated live when Phase 4 is implemented.

## Freeze Decision: Re-Import Behavior

Approval status: **Proposed for Phase 4 implementation approval**.

Rules:

- After successful Google write, re-read the Google Form structure through the existing import path or a shared import helper.
- New questions are inserted.
- Existing questions with matching Google question IDs are updated in place.
- Questions referenced by existing mappings must not be hard-deleted during Phase 4 re-import.
- If Google returns a structure that cannot be reconciled safely, return conflict and preserve current database state.

## Required Implementation Safeguards

- Keep Google Forms integration outside model/variable services.
- Controllers own HTTP only; services own workflow and validation orchestration.
- No Google tokens or secrets in DTO responses.
- No new lifecycle statuses.
- No Google Sheets scope.
- No response submit or response collection.
- No frontend expansion unless separately approved.

## Deferred

- Google Sheets API response pull
- response collection
- normalization/export
- statistical analysis
- credit/pricing
- NCKH admin UI
- React Flow/frontend expansion
- scheduled jobs
- Google Forms watches / Cloud Pub/Sub
- AI-generated questionnaire text
- automatic response submission

## Approval Needed Before Implementation

Approve or revise these freeze decisions before assigning an implementation worker:

- Google Forms write scope candidate: `https://www.googleapis.com/auth/forms.body`
- route: `POST /api/v1/nckh/models/{modelId}/generate-form`
- allowed `action` values: `create`, `update`
- generation allowed for `Draft` and `Active` models
- update limited to current-user authorized imported forms
- safe MVP update rule: do not delete unmatched Google questions
- minimal `ResearchForms` generated-form tracking fields
- re-import reconciliation behavior

## Next Pass If Approved

Proceed to **Phase 4 Pass 1 - Google Forms Generation Service** only after this freeze is explicitly accepted.
