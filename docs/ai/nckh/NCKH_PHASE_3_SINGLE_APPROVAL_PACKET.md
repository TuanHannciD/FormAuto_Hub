# NCKH_PHASE_3_SINGLE_APPROVAL_PACKET

## Purpose

Collect the remaining NCKH Phase 3 approvals into one decision so implementation sub-agents can work without stopping for already-reviewed contract or database choices.

This file is an approval packet. It does not mark Phase 3 as implemented or completed.

## One-Time Approval Statement

If the user approves this packet, the following are approved as the Phase 3 implementation baseline:

- Open NCKH Phase 3 implementation for backend-only Canvas Relations & Hypothesis.
- Use `NCKH_PHASE_3_CONTRACT_DB_FREEZE.md` as the authoritative Phase 3 contract and DB freeze baseline.
- Implement `ModelRelation` and `NodePosition` only.
- Implement relation CRUD, node-position save/load, and deterministic hypothesis output only.
- Keep implementation backend-only unless a later explicit approval opens frontend work.

## Decisions Approved By This Packet

### Relation Contract

- `ModelRelation` belongs to one `ResearchModel`.
- `ModelRelation` connects `FromVariableId` to `ToVariableId` in the same model.
- `Direction` allowed values: `Positive`, `Negative`.
- Reject self-relation where `FromVariableId == ToVariableId`.
- Reject duplicate directed relation by `(ModelId, FromVariableId, ToVariableId)`.
- Allow inverse relation because it represents a different directed influence.
- Relations are editable only while the model is `Draft`.
- `Active` models are read-only for Phase 3 relation edits.
- `Archived` remains Deferred.

### Node Position Contract

- `NodePosition` belongs to one `ResearchModel`.
- `NodeType` allowed values: `Variable`, `Relation`.
- Store positions for variable nodes and relation nodes.
- Exactly one of `VariableId` or `RelationId` must be set.
- Node positions are editable only while the model is `Draft`.
- `Active` models are read-only for Phase 3 position edits.
- Persist coordinates as decimals with two persisted decimal places.
- Do not enforce frontend viewport bounds in the backend.

### Hypothesis Contract

- Generate hypothesis output deterministically only.
- Do not call AI providers.
- `HypothesisCode` uses `H{n}` within the model.
- `HypothesisText` uses deterministic English templates:
  - Positive: `{fromVariableName} has a positive influence on {toVariableName}`
  - Negative: `{fromVariableName} has a negative influence on {toVariableName}`
- Vietnamese display wording is a future frontend/localization concern.
- Statistical interpretation remains Deferred.

### Database Contract

- `ModelRelation.ModelId -> ResearchModels`: cascade delete.
- `ModelRelation.FromVariableId -> ResearchVariables`: restrict delete.
- `ModelRelation.ToVariableId -> ResearchVariables`: restrict delete.
- `NodePosition.ModelId -> ResearchModels`: cascade delete.
- `NodePosition.VariableId -> ResearchVariables`: cascade delete.
- `NodePosition.RelationId -> ModelRelations`: cascade delete.
- Add unique index on `(ModelId, FromVariableId, ToVariableId)`.
- Add unique index on `(ModelId, HypothesisCode)`.
- Add SQL Server-compatible filtered unique indexes for node positions.
- Add check constraints for self-relation rejection and exactly-one node target.
- Migration must be reversible.
- Migration must not alter Phase 1 or Phase 2 tables except by adding reviewed FK references from Phase 3 tables.

### API Contract

Relation endpoints:

- `POST /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/models/{modelId}/relations`
- `GET /api/v1/nckh/relations/{relationId}`
- `PUT /api/v1/nckh/relations/{relationId}`
- `DELETE /api/v1/nckh/relations/{relationId}`

Node position endpoints:

- `GET /api/v1/nckh/models/{modelId}/positions`
- `PUT /api/v1/nckh/models/{modelId}/positions`

Error behavior uses the existing Phase 2 service-result pattern:

- `400` validation failure
- `401` unauthenticated request
- `404` target not found in current user's scope
- `409` duplicate relation or duplicate node-position conflict

## Approved Sub-Agent Flow

Use `templates/chat-starters/nckh-phase3/` in this order:

1. `01_persistence_foundation.md`
2. `02_relation_api.md`
3. `03_node_positions_hypothesis.md`
4. `04_validation_closeout_docs.md`
5. `05_review.md`

The implementation workers must stop only for a real conflict with current source, failed migration design that cannot follow this packet, or a validation blocker. They should not stop to re-ask the approved decisions above.


Implementation note: SQL Server multiple-cascade-path validation required an approved adjustment. The implemented database uses restrict/no-action for `NodePosition.ModelId -> ResearchModels` and `NodePosition.VariableId -> ResearchVariables`, with service-owned cleanup for variable positions. See `NCKH_PHASE_3_CLOSEOUT.md`.

## Still Deferred

- `Archived` lifecycle behavior
- AI-generated hypothesis text
- statistical analysis
- Google Forms create/update
- Google Sheets response pull
- response collection
- normalization/export
- credit/pricing
- NCKH admin UI
- React Flow/frontend canvas implementation
- production-readiness claims without current runtime validation

## Validation Required Before Closeout

Minimum required validation before Phase 3 can be marked completed:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` against the intended Development SQL Server database
- authenticated HTTP smoke for relation CRUD
- authenticated HTTP smoke for position save/load
- log inspection after smoke checks
- smoke data cleanup

Not required unless frontend files change:

- `npm run build`
- Playwright/browser smoke



