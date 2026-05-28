# PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE

## Purpose

Define the approved requirement package and current implementation boundary for the Phase 6 AI mapping/generation slice.

This document records the user-approved product direction and the contract areas that must still go through focused review.

## Current Approval State

Approved for planning and contract packaging:

- three form automation generation modes
- AI provider settings as a required setup area
- AI prompt persistence for AI modes
- direct AI-generated preview responses for AI modes
- credit multipliers for AI preview generation
- full AI audit with raw provider request/response storage
- anti-abuse prompt and output guards
- delivery pass sequencing and safe parallel work groups

Approved with conditions for scoped implementation planning:

- Phase 6 AI mapping/generation may move from candidate package to implementation planning and scoped implementation.
- This approval does not unlock the full production AI generation workflow at once.
- `Worker J - AI Generate API` was unblocked after provider settings, prompt profile, prompt guard, output validator, credit contract, and audit contract were implemented and reviewed.
- The backend AI preview generation endpoint is implemented for the approved scoped slice.
- Runtime AI provider execution remains fail-safe by default: the deterministic adapter is allowed only when explicitly enabled through local/test configuration, and the OpenAI-compatible live adapter is allowed only when explicitly enabled through runtime configuration.
- OpenAI-compatible live provider calls using admin-saved provider/model/Base URL/API key are approved for this scoped slice.
- The five AI persistence concepts are approved as separate tables, subject to final DB proposal before migration:
  - `AiProviderSettings`
  - `AiPromptProfiles`
  - `AiQuestionPrompts`
  - `AiGenerationRuns`
  - `AiGenerationRunItems`
- AI prompts must not be stored in `AnswerRules.ConfigJson`.
- `AiPromptProfiles` should be unique by `ProjectId + Mode`.
- `AiQuestionPrompts` should be unique by `ProfileId + QuestionId`.
- `AiGenerationRunItems.GeneratedResponseId` may be nullable for invalid or rejected output evidence.
- `AiGenerationRun` statuses are approved as `Pending`, `Running`, `Succeeded`, `Partial`, and `Failed`.
- The approved run transition is `Pending -> Running -> Succeeded | Partial | Failed`.
- Terminal run statuses must not be changed later; retry must create a new run.
- Provider and model identifiers are admin-controlled string values stored server-side; backend validation requires non-empty values and they must not become arbitrary normal-frontend authority.
- Custom Base URL support and OpenAI-compatible gateway calls are approved only for the scoped server-side admin settings and adapter path.
- Option 2 default AI prompt/profile persistence by project is approved.
- Option 3 global prompt and per-question prompt persistence by project are approved.
- Prompt auto-fill is free.
- Initial prompt length limits are approved as guardrails: short context field 200 characters, global prompt 2,000 characters, per-question prompt 1,000 characters, and total prompt payload per run 20,000 characters.
- Credit multipliers are approved as Option 1 `x1`, Option 2 `x2`, and Option 3 `x3`.
- Complete AI audit is required from the first implementation.
- Raw provider request/response access is admin/debug only for now and must not be visible to normal users.
- Frontend AI mode preparation may start only without unstable real API binding.

Still requiring focused proposal or review before broader production rollout:

- live provider/model catalog validation beyond required local configuration checks
- provider-specific SDK adapters outside the OpenAI-compatible HTTP contract
- AI generation run list/detail API for normal-user or admin audit review
- exact pagination, filtering, and authorization details for AI audit read APIs
- raw payload retention and redaction policy
- raw OpenAI-compatible gateway behavior beyond the approved chat completions adapter
- additional frontend/API binding outside the approved scoped slice
- production browser closeout after live provider adapter approval

## Phase Fit

Current global project phase remains: Phase 9 closeout completed; next phase not selected.

Active approved follow-up slice: Phase 6 AI mapping/generation scoped implementation.

This package is for a Phase 6 production integration candidate. The approved checklist allowed scoped implementation planning, selected prerequisite implementation work, and the backend AI preview generation endpoint after prerequisite review.

This does not unlock full production AI provider integration, frontend/API scope outside the approved scoped binding, broad raw-audit exposure, or AI auto-submit.

## Current Scoped Slice Progress

| Area | Current state |
|---|---|
| AI provider settings backend | Implemented for the scoped slice |
| Admin AI provider config UI | Implemented for the scoped slice |
| AI prompt profile persistence | Implemented for the scoped slice |
| AI generate preview API | Implemented for the scoped slice |
| Normal-user AI mode UI/API binding | Implemented for the scoped slice |
| Runtime deterministic AI adapter | Allowed only when explicitly enabled by local/test configuration |
| Live OpenAI-compatible provider calls | Implemented for the scoped slice behind explicit runtime configuration |
| Broad AI audit read UI/API and raw payload exposure | Deferred |
| Custom base URL and live OpenAI-compatible gateway calls | Implemented for the scoped slice |

## Product Goal

Add AI-assisted form answer generation while preserving the existing safe workflow:

```text
analyze form
-> configure or generate answer behavior
-> generate preview responses
-> deduct credits only for successfully stored previews
-> user reviews preview
-> user confirms submission
-> controlled submission
```

AI must never auto-submit.

## Generation Modes

### Option 1 - Default rule-based mode

This is the existing behavior.

Behavior:

- user clicks the default form analysis action
- frontend shows question details and rule editors
- user configures answer rules
- existing response generation creates `GeneratedResponses`
- credit cost is `generatedCount x 1`

Constraints:

- do not regress existing answer-rule modes
- do not change existing preview-before-submit behavior
- do not change the existing 1 to 100 preview limit

### Option 2 - Full AI mode

Behavior:

- user clicks a new AI analysis/generation action at the same hierarchy as the existing form analysis action
- backend still uses stored question metadata and options for AI processing
- frontend does not show detailed option lists in the question blocks
- frontend shows collapsed AI-marked question/answer blocks
- frontend uses a clear AI badge and restrained hover emphasis without breaking the dashboard visual style
- a default AI prompt/profile is stored for the project
- AI generates `GeneratedResponses` directly
- generated previews are read-only; user cannot edit `GeneratedResponses`
- credit cost is `generatedCount x 2`

AI is allowed to generate free-form text for text-style questions only.

### Option 3 - Custom AI mode

Behavior:

- user clicks a new custom AI action
- UI is more prominent than Option 2 but still follows the operational dashboard style
- the top of the workflow has AI direction fields such as target age, work role, context, tone, answer length, and answer intent
- user can choose global custom mode or per-question custom mode
- custom prompts are persisted so the user can return to the project later and continue editing
- AI can auto-fill prompt fields for the user
- auto-fill prompt is free
- AI generates `GeneratedResponses` directly
- generated previews are read-only; user cannot edit `GeneratedResponses`
- credit cost is `generatedCount x 3`

## Prompt Persistence

Option 2 stores a default AI prompt/profile for the project.

Option 3 stores custom prompts for the project.

Proposed persistence concepts requiring database review:

- `AiPromptProfiles`
- `AiQuestionPrompts`

`AnswerRules.ConfigJson` must not be used to store AI prompt profiles. Answer rules represent deterministic preview-generation configuration; AI prompts represent instructions for AI generation.

## AI Provider Settings

AI setup requires admin-controlled provider settings before production generation can work.

Proposed persistence concept requiring database review:

- `AiProviderSettings`

Expected behavior:

- admin selects provider first
- provider and model are admin-entered server-side values and must both be non-empty
- API key must be encrypted before storage
- API key must never be returned raw to the frontend
- UI may show only a masked key preview
- admin can set default model
- admin can run a configuration check
- provider can be enabled only when required configuration is valid
- generation uses the enabled server-side provider setting, not provider/model values sent from the normal user frontend

Invalid provider/model configuration example:

```text
Provider:
API key: configured
Model: gpt-4o-mini
```

This must fail validation because provider is missing. A model-family mismatch is not checked in this scoped slice because provider/model values are intentionally admin-configurable strings.

OpenAI-compatible gateway names may be entered as flexible provider identifiers in the settings UI. Custom Base URL usage and live calls are approved only through the scoped OpenAI-compatible chat completions adapter.

Approved scoped Base URL and live adapter behavior:

- admin may enter an optional Base URL/API endpoint
- if entered, Base URL must be an absolute `http` or `https` URL
- OpenAI-compatible runtime calls use the saved Base URL and call `{baseUrl}/chat/completions`, unless the saved URL already ends with `/chat/completions`
- runtime calls use server-side encrypted API key material and must not expose raw API keys
- runtime calls are enabled only when `AI:ProviderAdapter` is explicitly set to `OpenAICompatible`
- live model catalog validation remains Deferred

## Credit Rules

Credit is deducted only for successfully stored preview responses.

Formula:

```text
creditsUsed = generatedCount x multiplier
```

Multipliers:

- Option 1: `1`
- Option 2: `2`
- Option 3: `3`

No credit deduction occurs for:

- form analysis
- prompt auto-fill
- failed AI provider calls
- AI output rejected before any preview is stored
- invalid prompt blocked by prompt guard

Partial generation:

- if available credits are lower than requested credit cost, generate only the number of preview responses that can be paid for
- deduct only for stored preview responses
- return requested count, generated count, credits used, balance after, and missing credits

Example:

```text
Mode: Option 3
Requested previews: 10
Multiplier: 3
Available credits: 18
Generated previews: 6
Credits used: 18
Missing credits: 12
```

## AI Audit

AI audit must be implemented as a complete production audit surface from the start.

Proposed persistence concepts requiring database review:

- `AiGenerationRuns`
- `AiGenerationRunItems`

Required run status values:

- `Pending`
- `Running`
- `Succeeded`
- `Partial`
- `Failed`

Required audit direction:

- store raw provider request/response
- store provider and model
- store prompt profile snapshot
- store question/options snapshot used for generation
- store requested count, generated count, multiplier, and credits used
- store output validation result
- store generated response ids
- store error details when generation fails

Security requirements:

- raw provider payload storage requires access control
- raw provider payload must not be exposed to normal users
- admin/debug access must be considered separately during API review
- retention and redaction policy must be reviewed before production exposure

## AI Output Validation Rules

Backend must not trust AI output directly.

Required validation:

1. AI output must be structured JSON.
2. Each item must reference a valid `questionId` from the current project.
3. Output must not include questions outside the project.
4. Multiple choice, dropdown, linear scale, and rating answers must contain exactly one value from the stored options.
5. Checkbox answers must contain only values from the stored options and must stay within safe selection limits.
6. Grid question output must map only to valid rows and options; unsupported grid shapes must fail safely.
7. Short text and paragraph text may use free-form text, subject to length and content safety limits.
8. Date and time values must match accepted formats.
9. AI output must not include captcha bypass, proxy, fake-account, spam, unauthorized submission, or Google restriction bypass content.
10. Invalid items must not be stored as `GeneratedResponses`.

If all output is invalid:

- run status is `Failed`
- generated count is `0`
- credits used is `0`

If part of the output is valid:

- run status is `Partial`
- store and charge only valid preview responses

## Prompt Guard Rules

User prompt and auto-fill input must be rejected when they request or imply:

- spam
- survey manipulation at abusive scale
- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- bypassing Google restrictions
- AI auto-submit without preview and confirmation
- forcing answers outside allowed options for choice-style questions
- impersonation of real people
- collection or fabrication of sensitive personal data without authorization

Valid prompt example:

```text
Create natural short answers for Vietnamese students aged 18 to 24, using a friendly tone.
```

Invalid prompt example:

```text
Create many fake responses and bypass Google restrictions so the form looks popular.
```

## Prompt Length Limits

Initial proposed limits requiring contract review:

- audience or context short field: 200 characters each
- global prompt: 2,000 characters
- per-question prompt: 1,000 characters
- total prompt payload for one generation run: 20,000 characters
- generated text value must stay within backend answer value length limits

## UI Requirements

The UI must stay aligned with the existing Next.js dashboard, shadcn/ui, Tailwind CSS, and lucide-react baseline.

Option 2 UI:

- AI button at the same hierarchy as the existing form analysis action
- collapsed question blocks
- AI badge
- subtle hover effect
- highlighted preview generation block
- highlighted credit notice for `x2`
- no detailed option list display

Option 3 UI:

- custom AI button at the same hierarchy as the analysis actions
- stronger visual emphasis than Option 2
- AI direction panel at the top
- global custom and per-question custom mode controls
- per-question prompt fields
- prompt auto-fill button
- highlighted preview generation block
- highlighted credit notice for `x3`

Provider settings UI:

- admin-only AI settings page or section
- provider input
- API endpoint / Base URL input
- encrypted API key input
- masked key preview after save
- default model input
- optional Base URL for OpenAI-compatible provider type
- check configuration action
- status badge for unchecked, valid, invalid, or disabled state

## Proposed API Areas

Current implemented/approved areas:

- admin AI provider settings read/update/check
- project AI prompt profile read/update
- per-question AI prompt read/update
- AI prompt auto-fill
- AI preview generation: `POST /api/projects/{projectId}/ai-responses/generate`
- live OpenAI-compatible provider adapter behind explicit runtime configuration

Still Deferred or requiring separate review:

- AI generation run read/list for audit
- raw provider payload read API
- live provider model catalog validation
- provider-specific SDK adapters outside the OpenAI-compatible HTTP contract
- final pagination and filtering for audit reads

## Proposed Module Ownership

| Module | Owns | Must not own |
|---|---|---|
| Integrations.AI | provider calls, provider adapters, provider response parsing | credit deduction, submission |
| AiProviderSettings | admin AI provider configuration | normal-user prompt behavior |
| AiPromptProfiles | stored project-level AI instructions | generated preview persistence |
| AiQuestionPrompts | stored per-question AI instructions | answer submission |
| ResponseGeneration | storing generated previews and credit-aware generation orchestration | provider-specific API calls |
| CreditManagement | AI generation credit deduction | AI prompt construction |
| GeneratedResponses | stored preview payloads | editable AI draft content |
| UsageLogs | user-visible action history | raw AI provider audit replacement |
| AiGenerationRuns | raw provider audit and generation run state | credit ledger source of truth |

## Delivery Pass Plan

### Pass 1 - Requirement and contract docs

Output:

- this package and Vietnamese counterpart
- routing matrix update
- no production code

### Pass 2 - API and DB contract review

Output:

- reviewed DTO and entity proposal
- reviewed status values
- reviewed migration direction
- reviewed raw payload retention/access direction

### Pass 3 - AI provider settings

Output:

- admin provider settings API
- encrypted API key storage
- provider/model required-field validation
- Base URL validation as an optional absolute `http` or `https` URL
- masked secret response
- configuration check
- admin UI

### Pass 4 - AI backend boundary

Output:

- `Integrations.AI` abstraction
- provider adapter boundary
- OpenAI-compatible live adapter behind explicit runtime configuration
- prompt guard
- output validator
- no direct frontend authority over provider/model

### Pass 5 - Prompt profile backend

Output:

- default Option 2 profile persistence
- Option 3 global prompt persistence
- Option 3 per-question prompt persistence
- free prompt auto-fill endpoint

### Pass 6 - AI generate API

Output:

- Option 2 and Option 3 AI preview generation
- direct `GeneratedResponses` creation
- credit multiplier handling
- partial generation handling
- complete AI audit run/item writes

Current status:

- implemented for backend `POST /api/projects/{projectId}/ai-responses/generate`
- stores read-only AI `GeneratedResponses`
- writes `CreditTransactions`, `UsageLogs`, `AiGenerationRuns`, and `AiGenerationRunItems`
- charges only successfully stored valid previews
- uses a deterministic provider adapter only when explicitly enabled for local/test validation
- uses the OpenAI-compatible live adapter only when explicitly enabled by runtime configuration
- defaults to a disabled provider adapter when no approved runtime adapter is configured

### Pass 7 - Frontend UI

Output:

- three generation mode entry points
- Option 2 collapsed AI UI
- Option 3 custom prompt UI
- read-only AI generated preview display
- mode-specific credit notices
- provider settings UI if not completed in Pass 3

### Pass 8 - Validation and review

Output:

- backend build/tests
- frontend lint/build
- EF Core migration validation
- authenticated API smoke
- browser smoke
- audit/security review
- docs sync review

## Safe Parallel Work Groups

After Pass 1 and Pass 2 are complete, these groups can run in parallel:

### Combo A - Provider settings

- worker A1: DB/API provider settings
- worker A2: admin provider settings UI

Must not touch:

- AI generation transaction
- prompt profile persistence beyond shared contracts
- `GeneratedResponses`

### Combo B - AI safety core

- worker B1: prompt guard
- worker B2: output validator
- worker B3: provider abstraction interface

Must not touch:

- credit deduction
- database migration finalization without DB review
- frontend mode UI

### Combo C - Prompt profile

- worker C1: prompt profile DB/API
- worker C2: Option 3 prompt UI with mocked or contract-stable API
- worker C3: auto-fill prompt endpoint boundary

Must not touch:

- provider settings validation
- final AI generation transaction
- submission workflow

### Combo D - Frontend visual mode preparation

- worker D1: Option 2 collapsed AI UI state
- worker D2: Option 3 custom UI state
- worker D3: AI badge, hover effect, and credit notice styling

Must not bind to unstable APIs.

## Work That Must Stay Sequential

These tasks should not run before their dependencies:

- AI generation API before provider settings and output validator contracts are stable
- credit multiplier transaction before credit contract review
- AI audit raw payload storage before access/retention review
- additional frontend/API binding before DTO routes are stable
- production browser closeout before backend runtime smoke passes and live provider adapter is approved

## Validation Expectations

Unit tests:

- prompt guard accepts safe prompts and rejects unsafe prompts
- output validator rejects values outside options
- output validator rejects invalid schema
- multiplier calculation returns correct generated count and credits used

Integration tests:

- AI generation writes `GeneratedResponses`
- AI generation writes `CreditTransactions`
- AI generation writes `UsageLogs`
- AI generation writes `AiGenerationRuns` and run items
- failed generation charges zero credits
- partial generation charges only stored previews

Runtime smoke:

- admin saves and checks AI provider settings
- normal user cannot access provider secrets
- Option 2 generates read-only previews
- Option 3 persists prompts and generates read-only previews
- submission still requires preview and confirmation

Browser smoke:

- Option 1 still works
- Option 2 UI renders and hydrates
- Option 3 UI renders and hydrates
- AI badges, credit notices, and collapsed blocks do not overlap or break mobile layout

## Stop Conditions

Stop before implementation if:

- API routes or DTOs are not reviewed
- database fields are not reviewed
- provider/model required-field validation rules are unclear
- raw provider payload access or retention is unclear
- credit multiplier behavior is unclear
- prompt guard scope is weakened
- output validation would allow choice-style answers outside stored options
- preview-before-submit or confirmation would be weakened
