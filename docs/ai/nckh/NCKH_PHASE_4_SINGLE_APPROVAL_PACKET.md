# NCKH_PHASE_4_SINGLE_APPROVAL_PACKET

## Purpose

Collect the remaining NCKH Phase 4 approvals into one decision so implementation sub-agents can work without stopping for already-reviewed contract, Google scope, or database choices.

This file is an approval packet. It does not mark Phase 4 as implemented or completed.

## One-Time Approval Statement

If the user approves this packet, the following are approved as the Phase 4 implementation baseline:

- Open NCKH Phase 4 implementation for backend-only Google Form Generation & Update.
- Use `NCKH_PHASE_4_CONTRACT_DB_FREEZE.md` as the authoritative Phase 4 contract, Google scope, and DB freeze baseline.
- Implement only `POST /api/v1/nckh/models/{modelId}/generate-form` with `action` values `create` and `update`.
- Allow Google Forms write scope only through explicit user consent and runtime configuration.
- Keep implementation backend-only unless a later explicit approval opens frontend work.

## Decisions Approved By This Packet

### Google Scope Contract

- Candidate write scope: `https://www.googleapis.com/auth/forms.body`.
- Existing Phase 1 read consent must not be treated as write consent.
- If the stored Google token lacks write scope, return a re-consent-required error.
- Google Sheets scope remains Deferred until Phase 5.

### API Contract

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

Response includes:

- `formId`
- `googleFormId`
- `formUrl`
- `questionsCreated`
- `questionsUpdated`
- `questionsDeleted`
- `reimported`

### Ownership And Readiness Contract

- Model must belong to the current authenticated user.
- Imported/generated form must belong to the same user.
- Generation is allowed for `Draft` and `Active` models.
- Model must have at least one observed mapping before generation.
- Every generated question must trace back to existing mapping/question data unless later approved otherwise.
- No automatic response submission.

### Create Contract

- `create` creates a new Google Form under the current user's consented Google account.
- Generated form title derives from the research model name.
- Question order follows variable `SortOrder`, mapping `SortOrder`, then source question `OrderIndex`.
- After successful Google write, re-import the generated form structure into NCKH persistence.
- Forms created with the Google Forms API after 2026-06-30 may be unpublished by default; implementation must validate publish/response availability behavior live before any closeout claim.

### Update Contract

- `update` may update only a Google Form imported under the current user and authorized by the current user's Google write scope.
- The app must verify Google API authorization before writing.
- Do not delete a Google Form.
- MVP update must not delete unmatched existing Google questions.
- If reconciliation is unsafe, return conflict and preserve current database state.

### Persistence Contract

Approved minimal fields if implementation confirms they are absent and required:

- `ResearchForms.GeneratedFromModelId` nullable GUID FK to `ResearchModels.Id`
- `ResearchForms.GenerationSource` string, allowed values: `Imported`, `Generated`
- `ResearchForms.LastGeneratedAt` nullable `DateTimeOffset`
- `ResearchForms.LastSyncedAt` nullable `DateTimeOffset`

Database behavior:

- `GeneratedFromModelId -> ResearchModels`: restrict/no-action.
- `GenerationSource` defaults to `Imported` for existing rows.
- Add index on `(UserId, GeneratedFromModelId)` if `GeneratedFromModelId` is added.
- Migration must be reversible.

## Approved Sub-Agent Flow

Use this order:

1. Google Forms generation service and integration workflow
2. API route and DTO implementation
3. Approved persistence changes and re-import behavior
4. Validation and closeout docs
5. Final review

The implementation workers must stop only for a real conflict with current source, failed Google scope/runtime configuration that cannot follow this packet, migration design that cannot follow this packet, or a validation blocker. They should not stop to re-ask the approved decisions above.

## Still Deferred

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
- production-readiness claims without current runtime validation

## Validation Required Before Closeout

Minimum required validation before Phase 4 can be marked completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` if migrations are added
- authenticated HTTP smoke for `POST /api/v1/nckh/models/{modelId}/generate-form`
- live Google Forms create/update smoke when credentials and approved scopes are available
- clear `Blocked` label if live Google validation cannot run because credentials/scopes are unavailable
- log inspection after smoke checks
- smoke data cleanup

Not required unless frontend files change:

- `npm run build`
- Playwright/browser smoke
