# NCKH_API_CONTRACT_GUIDE

## Purpose

Đề xuất API contracts cho NCKH Survey Module. Tất cả endpoints là proposed, cần review trước implementation.

## Base Path

Tất cả NCKH API endpoints bắt đầu với `/api/v1/nckh`.

## Auth

Tất cả endpoints yêu cầu JWT Bearer token. Role: Researcher (default user role) hoặc Admin.

## Proposed Endpoints

### 1. Google OAuth & Forms Import

#### POST /api/v1/nckh/auth/google-link
Link Google Account với OAuth Forms + Sheets scopes.

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
  "relationCount": 0,
  "createdAt": "2026-05-30T10:00:00Z"
}
```

Errors: 400 (validation), 409 (form already has a model)

---

#### GET /api/v1/nckh/models
List user models.

Query: status (Draft|Active|Archived, optional)

Response 200: paged list

---

#### GET /api/v1/nckh/models/{modelId}
Get model detail with variables, relations, summary.

Response 200:
```json
{
  "id": "guid",
  "name": "...",
  "description": "...",
  "status": "Active",
  "formTitle": "Khảo sát sinh viên",
  "variableCount": 3,
  "relationCount": 2,
  "responseCount": 45,
  "variables": [...],
  "relations": [...]
}
```

---

#### PUT /api/v1/nckh/models/{modelId}
Update model name/description.

---

#### DELETE /api/v1/nckh/models/{modelId}
Delete model. Không xóa survey data. Cascade: variables, mappings, relations, node positions.

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
  "maxValue": 5,
  "mappings": [
    { "formQuestionId": "guid-q3", "observedCode": "TH1" },
    { "formQuestionId": "guid-q4", "observedCode": "TH2" }
  ]
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
  "scalePoint": 5,
  "mappingCount": 2
}
```

Errors: 400 (duplicate code, invalid mappings), 409 (model archived)

---

#### GET /api/v1/nckh/models/{modelId}/variables
List variables with their mappings.

---

#### PUT /api/v1/nckh/variables/{variableId}
Update variable. Trả về cảnh báo nếu model đã có data.

Request:
```json
{
  "name": "Kỹ năng tự học (updated)",
  "mappings": [...]
}
```

Response 200:
```json
{
  "id": "guid",
  "hasData": true,
  "warning": "Model has collected data. Changing variable definition may affect existing normalized data."
}
```

---

#### DELETE /api/v1/nckh/variables/{variableId}
Cascade delete mappings + node positions.

---

### 4. Relations

#### POST /api/v1/nckh/models/{modelId}/relations
Add relation.

Request:
```json
{
  "fromVariableId": "guid-th",
  "toVariableId": "guid-kq",
  "direction": "Positive"
}
```

Response 201:
```json
{
  "id": "guid",
  "fromVariableName": "Kỹ năng tự học",
  "toVariableName": "Kết quả học tập",
  "hypothesisCode": "H1",
  "hypothesisText": "Kỹ năng tự học có ảnh hưởng tích cực đến Kết quả học tập",
  "direction": "Positive"
}
```

Errors: 400 (self-relation, duplicate)

---

#### GET /api/v1/nckh/models/{modelId}/relations
List relations.

---

#### DELETE /api/v1/nckh/relations/{relationId}
Delete relation + associated node position.

---

### 5. Canvas Positions

#### PUT /api/v1/nckh/models/{modelId}/positions
Save node positions for canvas.

Request:
```json
{
  "positions": [
    { "nodeType": "Variable", "variableId": "guid-th", "positionX": 150.0, "positionY": 200.0 },
    { "nodeType": "Variable", "variableId": "guid-kq", "positionX": 400.0, "positionY": 200.0 },
    { "nodeType": "Relation", "relationId": "guid-rel", "positionX": 275.0, "positionY": 200.0 }
  ]
}
```

---

#### GET /api/v1/nckh/models/{modelId}/positions
Load node positions.

---

### 6. Form Generation

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
  "questionsDeleted": 0
}
```

Errors: 400 (no variables with mappings), 401 (Google not linked)

---

### 7. Data Collection

#### POST /api/v1/nckh/models/{modelId}/collect
Manual pull responses.

Response 200:
```json
{
  "logId": "guid",
  "responsesCollected": 8,
  "responsesSkipped": 2,
  "status": "Partial",
  "errorMessage": null
}
```

---

#### GET /api/v1/nckh/models/{modelId}/responses
List raw responses.

Query: page, pageSize

---

### 8. Data Normalization

#### POST /api/v1/nckh/models/{modelId}/normalize
Normalize collected data.

Response 200:
```json
{
  "respondentsProcessed": 45,
  "variablesComputed": 3,
  "missingDataCount": 2,`n  "staleDatasetsMarked": 0
}
```

---

#### GET /api/v1/nckh/models/{modelId}/dataset
Get normalized dataset.

Query: page, pageSize

Response 200:
```json
{
  "columns": ["RespondentId", "TH1", "TH2", "TH3", "TH_mean", "AGE", "KQ"],`n  "hasStaleData": false,
  "rows": [
    { "RespondentId": "A", "TH1": 5, "TH2": 4, "TH3": 5, "TH_mean": 4.67, "AGE": 20, "KQ": 3.4 }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 45,
  "totalPages": 3
}
```

---

### 9. Export

#### GET /api/v1/nckh/models/{modelId}/export?format=csv
Download dataset.csv.

Response: text/csv stream

---

#### GET /api/v1/nckh/models/{modelId}/export?format=codebook
Download codebook.xlsx.

Response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

---

#### GET /api/v1/nckh/models/{modelId}/export?format=spss
Download syntax.sps.

Response: text/plain stream

---

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
