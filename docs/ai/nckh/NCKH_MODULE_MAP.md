# NCKH_MODULE_MAP

## Purpose

Định nghĩa module ownership cho NCKH Survey Platform.

## Module Ownership

| Module | Owns | Must not own |
|---|---|---|
| Auth | sign-in, JWT, Google OAuth link (extend existing FormAuto Hub Auth) | NCKH business logic |
| Users | user profile identity | NCKH model ownership rules |
| ResearchForms | Google Form import, form metadata, form question storage | form creation/update via Google API |
| ResearchFormQuestions | detected question metadata from Google Forms API | answer generation, normalization |
| ResearchModels | NCKH model CRUD, lifecycle (Draft → Active → Archived) | Google Forms API calls |
| ResearchVariables | variable CRUD, type/scale definition | mapping logic (belongs to ObservedQuestionMappings) |
| ObservedQuestionMappings | question-to-variable mapping, observed codes | variable lifecycle rules |
| ModelRelations | relation CRUD, hypothesis auto-generation | canvas rendering (frontend responsibility) |
| NodePositions | canvas node coordinate storage | relation logic |
| SurveyResponses | raw response data from Google Sheets/Forms API | normalization (belongs to DataNormalization) |
| DataCollection | manual pull responses, deduplication, collection logging | form generation, export |
| DataNormalization | map raw data → normalized codes, compute Likert mean | statistical analysis (SPSS responsibility) |
| Export | CSV, Excel codebook, SPSS syntax generation | charting, analysis report |
| Integrations.Google.Forms | Google Forms API: read structure, create/update form | account/credit logic, normalization |
| Integrations.Google.Sheets | Google Sheets API: read response data | form structure, normalization |
| Integrations.Google.Auth | Google OAuth token exchange, refresh, encrypted storage | business workflows |

## Cross-Module Rules

- Google Forms integration must not be mixed into model/variable/export services.
- Data normalization must go through DataNormalization.
- Data collection must write DataCollectionLogs.
- Hypothesis text must be auto-generated from variable names + direction (no AI call).
- Variable deletion must cascade delete ObservedQuestionMappings and NodePositions.
- Model archival must not delete data (responses/datasets preserved).
- OAuth tokens must be encrypted at rest.
- Google API rate limits must be handled with exponential backoff retry.

## NCKH vs FormAuto Hub Module Boundary

| Concern | FormAuto Hub | NCKH Module |
|---|---|---|
| Google Forms use | HTML scraping (no official API) | Official Google Forms API |
| Purpose | Auto-fill & submit forms | Survey methodology & analysis prep |
| Entities | FormProjects, AnswerRules, GeneratedResponses | ResearchModels, ResearchVariables, ObservedQuestionMappings |
| Output | Submitted responses | Dataset CSV/Excel/SPSS |
| Credit | Yes (credit deduction per preview) | No (credit model Deferred) |
| Google OAuth | Deferred | Required (Phase 1) |

NCKH module reuses: Auth, Users, UserExternalLogins from FormAuto Hub.
NCKH module does not reuse: FormProjects, FormQuestions, AnswerRules, GeneratedResponses, SubmissionJobs.
