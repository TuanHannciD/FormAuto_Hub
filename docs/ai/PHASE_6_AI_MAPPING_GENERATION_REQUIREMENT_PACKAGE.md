# PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE

## Purpose

Define the approved requirement package for the proposed Phase 6 AI mapping/generation slice before API, database, frontend, or provider implementation begins.

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

Not approved by this document alone:

- final API routes
- final DTO names and fields
- final database schema or migrations
- final provider/model choice
- production AI provider calls
- implementation work without a separate implementation approval

## Phase Fit

Current project state remains: Phase 9 closeout completed; next phase not selected.

This package is for a proposed Phase 6 production integration candidate. It does not make Phase 6 active by itself.

Implementation requires explicit approval after contract and database review.

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
- provider and model must match
- API key must be encrypted before storage
- API key must never be returned raw to the frontend
- UI may show only a masked key preview
- admin can set default model
- admin can run a configuration check
- provider can be enabled only when required configuration is valid
- generation uses the enabled server-side provider setting, not provider/model values sent from the normal user frontend

Provider/model mismatch example:

```text
Provider: Google AI
API key: Google AI key
Model: gpt-*
```

This must fail validation because the key and model do not belong to the same provider family.

OpenAI-compatible gateways may be supported only as an explicit provider type with a configured base URL and compatible model list.

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
- provider selector
- encrypted API key input
- masked key preview after save
- default model selection
- optional base URL for OpenAI-compatible provider type
- check configuration action
- status badge for unchecked, valid, invalid, or disabled state

## Proposed API Areas

These are proposed areas only and require contract review before implementation:

- admin AI provider settings read/update/check
- project AI prompt profile read/update
- per-question AI prompt read/update
- AI prompt auto-fill
- AI preview generation
- AI generation run read/list for audit

Exact routes, DTOs, error responses, pagination, and authorization rules are not final in this package.

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
- provider/model validation
- masked secret response
- configuration check
- admin UI

### Pass 4 - AI backend boundary

Output:

- `Integrations.AI` abstraction
- provider adapter boundary
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
- frontend real API binding before DTO routes are stable
- browser closeout before backend runtime smoke passes

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
- provider/model validation rules are unclear
- raw provider payload access or retention is unclear
- credit multiplier behavior is unclear
- prompt guard scope is weakened
- output validation would allow choice-style answers outside stored options
- preview-before-submit or confirmation would be weakened

