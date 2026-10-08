# NCKH_API_CONTRACT_GUIDE

## TOC

- [Purpose](#purpose) — line 59
- [Base Path](#base-path) — line 74
- [Auth](#auth) — line 78
- [Implemented Phase 1 Endpoints](#implemented-phase-1-endpoints) — line 82
  - [1. Google OAuth & Forms Import](#1-google-oauth--forms-import) — line 84
    - [POST /api/v1/nckh/auth/google-link](#post-apiv1nckhauthgoogle-link) — line 86
    - [POST /api/v1/nckh/forms/import](#post-apiv1nckhformsimport) — line 108
    - [GET /api/v1/nckh/forms](#get-apiv1nckhforms) — line 135
    - [GET /api/v1/nckh/forms/{formId}](#get-apiv1nckhformsformid) — line 153
- [Implemented Phase 2 Endpoints](#implemented-phase-2-endpoints) — line 177
  - [2. Research Models](#2-research-models) — line 179
    - [POST /api/v1/nckh/models](#post-apiv1nckhmodels) — line 181
    - [GET /api/v1/nckh/models](#get-apiv1nckhmodels) — line 211
    - [GET /api/v1/nckh/models/{modelId}](#get-apiv1nckhmodelsmodelid) — line 220
    - [PUT /api/v1/nckh/models/{modelId}](#put-apiv1nckhmodelsmodelid) — line 241
    - [POST /api/v1/nckh/models/{modelId}/activate](#post-apiv1nckhmodelsmodelidactivate) — line 246
    - [DELETE /api/v1/nckh/models/{modelId}](#delete-apiv1nckhmodelsmodelid) — line 257
  - [3. Variables](#3-variables) — line 264
    - [POST /api/v1/nckh/models/{modelId}/variables](#post-apiv1nckhmodelsmodelidvariables) — line 266
    - [GET /api/v1/nckh/models/{modelId}/variables](#get-apiv1nckhmodelsmodelidvariables) — line 298
    - [PUT /api/v1/nckh/variables/{variableId}](#put-apiv1nckhvariablesvariableid) — line 303
    - [DELETE /api/v1/nckh/variables/{variableId}](#delete-apiv1nckhvariablesvariableid) — line 331
  - [4. Observed Question Mappings](#4-observed-question-mappings) — line 336
- [Implemented Phase 3 Endpoints](#implemented-phase-3-endpoints) — line 356
  - [5. Relations](#5-relations) — line 362
    - [POST /api/v1/nckh/models/{modelId}/relations](#post-apiv1nckhmodelsmodelidrelations) — line 364
    - [GET /api/v1/nckh/models/{modelId}/relations](#get-apiv1nckhmodelsmodelidrelations) — line 400
    - [GET /api/v1/nckh/relations/{relationId}](#get-apiv1nckhrelationsrelationid) — line 405
    - [PUT /api/v1/nckh/relations/{relationId}](#put-apiv1nckhrelationsrelationid) — line 410
    - [DELETE /api/v1/nckh/relations/{relationId}](#delete-apiv1nckhrelationsrelationid) — line 415
  - [6. Canvas Positions](#6-canvas-positions) — line 420
    - [PUT /api/v1/nckh/models/{modelId}/positions](#put-apiv1nckhmodelsmodelidpositions) — line 422
    - [GET /api/v1/nckh/models/{modelId}/positions](#get-apiv1nckhmodelsmodelidpositions) — line 437
- [Implemented Phase 4 Endpoint](#implemented-phase-4-endpoint) — line 442
  - [7. Form Generation](#7-form-generation) — line 448
    - [POST /api/v1/nckh/models/{modelId}/generate-form](#post-apiv1nckhmodelsmodelidgenerate-form) — line 450
- [Implemented Phase 5 Endpoints](#implemented-phase-5-endpoints) — line 483
  - [8. Data Collection](#8-data-collection) — line 493
    - [POST /api/v1/nckh/models/{modelId}/collect](#post-apiv1nckhmodelsmodelidcollect) — line 495
    - [GET /api/v1/nckh/models/{modelId}/responses](#get-apiv1nckhmodelsmodelidresponses) — line 520
  - [9. Data Normalization](#9-data-normalization) — line 529
    - [POST /api/v1/nckh/models/{modelId}/normalize](#post-apiv1nckhmodelsmodelidnormalize) — line 531
    - [GET /api/v1/nckh/models/{modelId}/dataset](#get-apiv1nckhmodelsmodeliddataset) — line 554
- [Implemented Phase 6 Endpoint](#implemented-phase-6-endpoint) — line 585
  - [10. Export](#10-export) — line 591
    - [GET /api/v1/nckh/models/{modelId}/export?format=csv](#get-apiv1nckhmodelsmodelidexportformatcsv) — line 593
    - [GET /api/v1/nckh/models/{modelId}/export?format=codebook](#get-apiv1nckhmodelsmodelidexportformatcodebook) — line 607
    - [GET /api/v1/nckh/models/{modelId}/export?format=spss](#get-apiv1nckhmodelsmodelidexportformatspss) — line 619
- [Proposed Future Endpoints](#proposed-future-endpoints) — line 635
- [Pagination Standard](#pagination-standard) — line 639
- [Error Response Format](#error-response-format) — line 654
- [Current browser authorization distinction](#current-browser-authorization-distinction) — line 666
- [Model-delete confirmation follow-up](#model-delete-confirmation-follow-up) — line 674

## Purpose

API contract guide cho NCKH Survey Module.

Phase 1/2 note:

- The Phase 1 endpoints in section 1 are implemented with repo evidence and should be treated as the current documented contract baseline for NCKH Phase 1.
- The Phase 2 endpoints in sections 2-4 are implemented with repo evidence and current closeout validation. See `NCKH_PHASE_2_CLOSEOUT.md`.
- The Phase 3 endpoints in sections 5-6 are implemented with repo evidence and current closeout validation. See `NCKH_PHASE_3_CLOSEOUT.md`.
- The Phase 4 endpoint in section 7 is implemented with repo evidence and local runtime validation. See `NCKH_PHASE_4_CLOSEOUT.md`; live Google write smoke remains blocked until credentials/write consent are available.
- The Phase 5 endpoints in sections 8-9 are implemented with repo evidence and local runtime validation. See `NCKH_PHASE_5_CLOSEOUT.md`; live Google response-read smoke remains blocked until credentials/response-read consent/submitted responses are available.
- The Phase 6 endpoint in section 10 is implemented with repo evidence and local runtime validation. See `NCKH_PHASE_6_CLOSEOUT.md`; no database migration was added for Phase 6.
- Current runtime readiness is not claimed by this file alone for future changes; re-run validation before new closeout/runtime claims.
- Endpoints outside sections 1-10 remain proposed until their later NCKH phases are explicitly approved and implemented.

## Base Path

Tất cả NCKH API endpoints bắt đầu với `/api/v1/nckh`.

## Auth

All endpoints require JWT Bearer authentication and enforce user ownership. Existing core roles are `User` and `Admin`; no `Researcher` role is defined by the current implementation.

## Implemented Phase 1 Endpoints

### 1. Google OAuth & Forms Import

#### POST /api/v1/nckh/auth/google-link
Link Google Account with the approved NCKH Forms read scope.

Request:
```json
{
  "authorizationCode": "4/0AY0e-g7..."
}
```

Response 200:
```json
{
  "linked": true,
  "email": "researcher@gmail.com"
}
```

Errors: 400 (invalid code), 409 (already linked)

---

#### POST /api/v1/nckh/forms/import
Import Google Form structure.

Request:
```json
{
  "formUrl": "https://docs.google.com/forms/d/abc123/edit"
}
```

Response 201:
```json
{
  "id": "guid",
  "googleFormId": "abc123",
  "formUrl": "https://docs.google.com/forms/d/abc123/edit",
  "title": "Khảo sát sinh viên",
  "status": "Draft",
  "questionCount": 15,
  "importedAt": "2026-05-30T10:00:00Z"
}
```

Errors: 400 (invalid URL), 401 (Google not linked), 404 (form not found), 409 (already imported)

---

#### GET /api/v1/nckh/forms
List imported forms.

Query: status (Draft|Active, optional)

Response 200:
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "totalItems": 5,
  "totalPages": 1
}
```

---

#### GET /api/v1/nckh/forms/{formId}
Get form detail with questions.

Response 200:
```json
{
  "id": "guid",
  "googleFormId": "abc123",
  "title": "Khảo sát sinh viên",
  "questions": [
    {
      "id": "guid",
      "googleQuestionId": "q1",
      "questionText": "Bạn bao nhiêu tuổi?",
      "questionType": "text",
      "isRequired": false,
      "orderIndex": 0
    }
  ]
}
```

---

## Implemented Phase 2 Endpoints

### 2. Research Models

#### POST /api/v1/nckh/models
Create research model.

Request:
```json
{
  "formId": "guid",
  "name": "Các yếu tố ảnh hưởng đến kết quả học tập",
  "description": "Khảo sát sinh viên năm 2026"
}
```

Response 201:
```json
{
  "id": "guid",
  "name": "Các yếu tố ảnh hưởng đến kết quả học tập",
  "description": "...",
  "status": "Draft",
  "formTitle": "Khảo sát sinh viên",
  "variableCount": 0,
  "hasGeneratedForm": false,
  "createdAt": "2026-05-30T10:00:00Z"
}
```

Errors: 400 (validation), 404 (imported form not found), 409 (another active model already exists during activation)

---

#### GET /api/v1/nckh/models
List user models.

Query: status (Draft|Active, optional)

Response 200: paged list

---

#### GET /api/v1/nckh/models/{modelId}
Get model detail with variables and Phase 2 summary.

Response 200:
```json
{
  "id": "guid",
  "name": "...",
  "description": "...",
  "status": "Draft",
  "formTitle": "Khảo sát sinh viên",
  "variableCount": 3,
  "hasGeneratedForm": true,
  "variables": [...]
}
```

`hasGeneratedForm` is true when an owned `ResearchForm` already exists with `GenerationSource = "Generated"` and `GeneratedFromModelId = modelId`. Frontend generate actions must use `action: "update"` when this value is true, and `action: "create"` only when it is false.

---

#### PUT /api/v1/nckh/models/{modelId}
Update model name/description.

---

#### POST /api/v1/nckh/models/{modelId}/activate
Activate a `Draft` model.

Rules:

- only `Draft` and `Active` are implemented lifecycle statuses
- activation succeeds only when no other `Active` model exists for the same imported form
- creating a `Draft` model is allowed even if another model for the same form already exists

---

#### DELETE /api/v1/nckh/models/{modelId}
Delete model. Phase 2 delete affects only the owned cascade path: `ResearchModel -> ResearchVariable -> ObservedQuestionMapping`.

Future frontend confirmation UX remains out of Phase 2 scope.

---

### 3. Variables

#### POST /api/v1/nckh/models/{modelId}/variables
Add variable.

Request:
```json
{
  "name": "Kỹ năng tự học",
  "code": "TH",
  "variableType": "Independent",
  "scaleType": "Likert",
  "scalePoint": 5,
  "minValue": 1,
  "maxValue": 5
}
```

Response 201:
```json
{
  "id": "guid",
  "name": "Kỹ năng tự học",
  "code": "TH",
  "variableType": "Independent",
  "scaleType": "Likert",
  "scalePoint": 5
}
```

Errors: 400 (duplicate code, invalid scale payload), 404 (model not found)

---

#### GET /api/v1/nckh/models/{modelId}/variables
List variables.

---

#### PUT /api/v1/nckh/variables/{variableId}
Update variable. Data-impact warnings remain deferred until later approved data phases exist.

Request:
```json
{
  "name": "Kỹ năng tự học (updated)",
  "code": "TH",
  "variableType": "Independent",
  "scaleType": "Likert",
  "scalePoint": 7,
  "minValue": null,
  "maxValue": null,
  "sortOrder": 1
}
```

Response 200:
```json
{
  "id": "guid",
  "name": "Kỹ năng tự học (updated)",
  "code": "TH"
}
```

---

#### DELETE /api/v1/nckh/variables/{variableId}
Cascade delete mappings, model relations that reference the variable, and canvas positions for the deleted variable or deleted relations.

---

### 4. Observed Question Mappings

Mappings are handled through separate endpoint(s), not nested variable payloads.

Implemented Phase 2 route surface:

- `POST /api/v1/nckh/variables/{variableId}/mappings`
- `GET /api/v1/nckh/variables/{variableId}/mappings`
- `GET /api/v1/nckh/models/{modelId}/mappings`
- `PUT /api/v1/nckh/mappings/{mappingId}`
- `DELETE /api/v1/nckh/mappings/{mappingId}`

Validation:

- mapped question must belong to the same imported form as the variable's model
- duplicate `(VariableId, FormQuestionId)` is rejected
- duplicate `(VariableId, ObservedCode)` is rejected

---

## Implemented Phase 3 Endpoints

Phase 3 relation and canvas-position endpoints are implemented with repo evidence and current closeout validation. See `NCKH_PHASE_3_CLOSEOUT.md`.

---

### 5. Relations

#### POST /api/v1/nckh/models/{modelId}/relations
Add relation while the model is `Draft`.

Request:
```json
{
  "fromVariableId": "guid-th",
  "toVariableId": "guid-kq",
  "direction": "Positive",
  "sortOrder": 1
}
```
Response 201:
```json
{
  "id": "guid",
  "modelId": "guid-model",
  "fromVariableId": "guid-th",
  "fromVariableName": "Self-study skill",
  "fromVariableCode": "TH",
  "toVariableId": "guid-kq",
  "toVariableName": "Academic result",
  "toVariableCode": "KQ",
  "direction": "Positive",
  "hypothesisCode": "H1",
  "hypothesisText": "Self-study skill has a positive influence on Academic result",
  "sortOrder": 1,
  "createdAt": "2026-06-04T00:00:00Z",
  "updatedAt": "2026-06-04T00:00:00Z"
}
```

Errors: 400 (validation, invalid direction, self-relation), 404 (not found in current user scope), 409 (duplicate directed relation)

---

#### GET /api/v1/nckh/models/{modelId}/relations
List relations.

---

#### GET /api/v1/nckh/relations/{relationId}
Get one relation.

---

#### PUT /api/v1/nckh/relations/{relationId}
Update relation while the model is `Draft`.

---

#### DELETE /api/v1/nckh/relations/{relationId}
Delete relation while the model is `Draft`; associated relation node position is deleted by database cascade.

---

### 6. Canvas Positions

#### PUT /api/v1/nckh/models/{modelId}/positions
Save node positions while the model is `Draft`.

Request:
```json
{
  "positions": [
    { "nodeType": "Variable", "variableId": "guid-th", "positionX": 150.0, "positionY": 200.0 },
    { "nodeType": "Relation", "relationId": "guid-rel", "positionX": 275.0, "positionY": 200.0 }
  ]
}
```

---

#### GET /api/v1/nckh/models/{modelId}/positions
Load node positions.

---

## Implemented Phase 4 Endpoint

Phase 4 form-generation endpoint is implemented with repo evidence and local runtime validation. See `NCKH_PHASE_4_CLOSEOUT.md`.

Live Google Forms create/update smoke is blocked until a real Google OAuth account with `https://www.googleapis.com/auth/forms.body` is available.

### 7. Form Generation

#### POST /api/v1/nckh/models/{modelId}/generate-form
Generate or update Google Form from model.

Request:
```json
{
  "action": "create"
}
```
hoặc:
```json
{
  "action": "update"
}
```

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

Errors: 400 (invalid action, no variables with mappings, unsupported question type), 401 (Google not linked or token unavailable), 403 (missing Forms write scope or target form not writable), 404 (model/form not found), 409 (duplicate generated form or unsafe conflict), 502 (Google Forms API failure)

---

## Implemented Phase 5 Endpoints

Phase 5 data collection and normalization endpoints are implemented with repo evidence and local runtime validation. See `NCKH_PHASE_5_CLOSEOUT.md`.

Preferred Google scope for Phase 5 MVP: `https://www.googleapis.com/auth/forms.responses.readonly`.

Google Sheets collection remains an alternate path only if explicitly approved later.

Live Google Forms response-read smoke remains blocked until a real Google OAuth account with response-read consent and submitted form responses is available.

### 8. Data Collection

#### POST /api/v1/nckh/models/{modelId}/collect
Manual pull responses.

Request:
```json
{}
```

Response 200:
```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Success",
  "errorMessage": null
}
```

Allowed status values: `Success`, `Partial`, `Failed`.

Errors: 400 (validation or model not ready), 401 (Google not linked or token unavailable), 403 (missing response-read scope or target form not readable), 404 (model/form not found), 409 (unsafe stale mapping conflict), 502 (Google response API failure)

---

#### GET /api/v1/nckh/models/{modelId}/responses
List raw responses.

Query: page, pageSize

Response 200: paged list. Default list responses must not expose full `RawDataJson`.

---

### 9. Data Normalization

#### POST /api/v1/nckh/models/{modelId}/normalize
Normalize collected data.

Response 200:
```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,
  "staleDatasetsMarked": 0
}
```

Rules:

- Normalize mapped questions only.
- Observed columns use `ObservedQuestionMapping.ObservedCode`.
- Variable mean columns use `{VariableCode}_mean`.
- Likert means are simple arithmetic means over non-null numeric observed values.
- Missing, blank, or unparseable values are stored as JSON null.

---

#### GET /api/v1/nckh/models/{modelId}/dataset
Get normalized dataset.

Query: page, pageSize

Response 200:
```json
{
  "columns": ["RespondentId", "TH1", "TH2", "TH_mean"],
  "hasStaleData": false,
  "items": [
    {
      "respondentId": "respondent-id-or-null",
      "values": {
        "TH1": 5,
        "TH2": 4,
        "TH_mean": 4.5
      },
      "isStale": false,
      "normalizedAt": "2026-06-05T10:10:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

---

## Implemented Phase 6 Endpoint

Phase 6 export endpoint is implemented with repo evidence and local runtime validation. See `NCKH_PHASE_6_CLOSEOUT.md`.

Phase 6 is backend-only and does not add export jobs, export history, frontend UI, statistical analysis, or new database tables. No EF Core migration was added.

### 10. Export

#### GET /api/v1/nckh/models/{modelId}/export?format=csv
Download dataset.csv.

Response: `text/csv; charset=utf-8` stream.

Rules:

- export normalized dataset rows only
- header order follows dataset columns
- missing values export as empty cells
- full `RawDataJson` is not exported

---

#### GET /api/v1/nckh/models/{modelId}/export?format=codebook
Download codebook.xlsx.

Response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` stream.

Rules:

- include variables, mappings, and notes sheets
- no raw responses or statistical outputs

---

#### GET /api/v1/nckh/models/{modelId}/export?format=spss
Download syntax.sps.

Response: `text/plain; charset=utf-8` stream.

Rules:

- generate import syntax for the CSV file
- include labels where safely derivable
- do not invent value labels without option metadata
- do not include statistical commands or execute SPSS

Expected errors: 400 (unsupported format), 401 (unauthenticated), 404 (model not found), 409 (no normalized data or stale normalized data)

---

## Proposed Future Endpoints

No additional future NCKH endpoints are approved by this guide.

## Pagination Standard

Tất cả list endpoints dùng:
```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

pageSize clamped: 1..100.

## Error Response Format

```json
{
  "type": "https://errors.formauto.dev/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Variable code 'TH' already exists in this model.",
  "instance": "/api/v1/nckh/models/guid/variables"
}
```

## Current browser authorization distinction

For `/api/v1/nckh/`, only a 401 ProblemDetails with `title = "Unauthorized"` and one of the existing exact messages below becomes `NckhGoogleAuthorizationError`, preserving the core session and requesting Google relink. Other 401 responses use ordinary JWT refresh/expiry recovery; 5xx/network failures show retry without claiming Google is unlinked. No backend endpoint/status/code was added.

- `Google account not linked.`
- `Google account not linked. Please link your Google account.`
- `Google account not linked or token expired. Please re-link your Google account.`

## Model-delete confirmation follow-up

The user-approved 2026-10-08 follow-up closes the previously recorded UI gap. The model-specific popup uses existing owned GETs for variables/mappings/relations/responses/dataset `totalItems` and positions `items.length`; counts represent the time of checking, not an atomic deletion snapshot. It requires exact-name entry, blocks incomplete/error states, rechecks the current name/generated-form state, and prevents repeated requests/dismissal during deletion. Typing the name is a frontend safeguard; the existing DELETE request has no new payload.

DELETE keeps its route and 204/401/404 behavior. A model referenced by a generated `ResearchForm` now returns the existing 409 Conflict shape with detail `Model has a generated form. Deletion is not allowed.` instead of falling through to a database FK error. The existing FK restriction is preserved; generated forms are not detached/deleted. Canvas positions and relations are removed with the model in one SaveChanges transaction; existing cascades remove variables, mappings, responses, normalized datasets and collection logs. Original imported forms/questions remain. See [NCKH_MODEL_DELETE_FOLLOWUP.md](NCKH_MODEL_DELETE_FOLLOWUP.md) for files, cases and validation limits.
