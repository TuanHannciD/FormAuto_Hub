# PHASE_3_KICKOFF_PLAN

## Purpose

Define the Phase 3 Form automation MVP execution plan before production implementation begins.

This file is the Phase 3 planning baseline after Phase 2 closeout.

## Phase 3 Goal

Build the backend/API foundation for controlled Google Form automation MVP:

1. Analyze a Google Form URL.
2. Detect supported questions and entry IDs when available.
3. Store form project and question metadata.
4. Configure answer rules.
5. Generate preview responses.
6. Require user review and confirmation before submission.
7. Submit only confirmed preview responses.
8. Write usage and submission logs.

## Confirmed Scope

Phase 3 includes:

- Google Form URL analysis for simple public forms.
- Question detection for supported MVP question types.
- Entry ID detection when available.
- Answer rules.
- Response preview generation.
- Controlled submission from generated previews.
- Usage logging.
- Submission logging.
- MVP generated response count limit of 1 to 100 per action, with controlled submission in sequential batches of 10.

Supported MVP question types:

- short text
- paragraph text
- multiple choice
- checkbox
- dropdown
- linear scale
- rating
- multiple choice grid
- checkbox grid
- date
- time

Deferred:

- file upload, because Google requires sign-in for file upload forms

Supported MVP answer-generation modes:

- random equally
- random by percentage
- random by quantity
- sample text lines for text answers
- sequential date ranges for date questions
- sequential time ranges for time questions

## Out Of Scope

Deferred:

- Google OAuth
- official Google Forms API integration
- AI answer generation
- AI mapping
- payment gateway behavior
- production background job framework
- webhook behavior
- refund behavior after failed submission
- captcha bypass
- proxy rotation
- fake account behavior
- unauthorized form submission

## Credit Rule

Approved Phase 3 credit rule:

- Credit is deducted only when preview generation succeeds.
- Cost is 1 credit per successfully generated preview response.
- Form analysis does not deduct credit.
- Submission does not deduct additional credit.
- Failed preview generation does not deduct credit.
- Partial preview generation deducts credit only for successfully generated preview responses.
- Every credit deduction must go through `CreditManagement`.
- Every credit deduction must write a `CreditTransactions` ledger entry.
- Every tool action must write `UsageLogs`.
- Failed tool actions must write `UsageLogs` with `CreditsUsed = 0`.

## Default Flow

```text
User submits Google Form URL
-> analyze form URL
-> validate supported public/simple form
-> create or update FormProject
-> store FormQuestions
-> user configures AnswerRules
-> generate 1 to 100 preview responses
-> deduct credits for successful generated previews
-> write UsageLogs and CreditTransactions
-> store GeneratedResponses
-> user reviews preview
-> user confirms submission
-> submit confirmed preview responses
-> create SubmissionJob
-> write SubmissionLogs
-> return submission summary
```

## Module Ownership

| Module | Owns in Phase 3 | Must not own |
|---|---|---|
| FormProjects | analyzed form project metadata | submission execution |
| FormQuestions | detected question metadata | answer rule behavior |
| AnswerRules | answer-generation configuration | submission execution |
| ResponseGeneration | preview response generation and MVP answer modes | auto-submit behavior |
| GeneratedResponses | stored preview payloads | credit ledger behavior |
| Submissions | controlled send workflow and submission jobs | bypass, proxy, fake-account, unauthorized submission behavior |
| SubmissionLogs | per-response submission result | refund policy |
| UsageLogs | tool action audit trail | submission payload storage |
| CreditManagement | preview-generation credit deduction | Google Forms calls |
| CreditTransactions | immutable credit ledger entries | mutable balance state |
| Integrations.GoogleForms | public form analysis and controlled form submission boundary | account or credit business logic |

## Proposed API Surface

The following API areas remain contract-reviewed work before implementation:

- `POST /api/forms/analyze`
- `GET /api/forms/{projectId}/questions`
- `POST /api/projects/{projectId}/answer-rules`
- `PUT /api/projects/{projectId}/answer-rules/{ruleId}`
- `POST /api/projects/{projectId}/responses/generate`
- `GET /api/projects/{projectId}/responses`
- `POST /api/projects/{projectId}/submissions/send`
- `GET /api/projects/{projectId}/submissions/jobs/{jobId}`
- `POST /api/projects/{projectId}/submissions/jobs/{jobId}/cancel`

Assumption: `ProblemDetails` remains the candidate error shape until the final API error contract is approved.

## Status Values Requiring Approval

Do not implement Phase 3 status values until approved.

Approval needed for:

- `FormProject.Status`
- `GeneratedResponse.Status`
- `SubmissionJob.Status`
- `SubmissionLog.Status`

Safe proposed minimum:

- `FormProject.Status`: `Analyzed`, `Unsupported`, `Failed`
- `GeneratedResponse.Status`: `Previewed`, `Submitted`, `Failed`
- `SubmissionJob.Status`: `Pending`, `Running`, `Completed`, `Failed`, `Cancelled`
- `SubmissionLog.Status`: `Success`, `Failed`

## Implementation Passes

### Pass 3.0 - Phase Gate And Closeout

Goal:

- Confirm Phase 2 closeout.
- Update paired docs only after approval.
- Keep Deferred items Deferred.

Output:

- Phase 2 closeout docs if not already present.
- Roadmap current phase update only after explicit approval.

### Pass 3.1 - Contract And DB Review

Goal:

- Review API contracts, DTOs, entities, status values, and transaction boundaries.
- Confirm credit deduction timing and ledger behavior.

Output:

- Approved Phase 3 contract package.
- Approved DB/entity/migration direction.
- Worker-ready implementation prompts.

### Pass 3.2 - Form Analyze

Goal:

- Implement safe public form URL analysis.
- Store form project and detected questions.

Validation:

- Valid public form succeeds.
- Invalid URL fails safely.
- Unsupported form shape fails safely.
- No credit deduction occurs during analysis.
- Usage log is written.

### Pass 3.3 - Answer Rules

Goal:

- Implement answer-rule create/update behavior for supported question types and modes.

Validation:

- Unsupported mode is rejected.
- Unsupported question type is rejected or marked unsupported.
- Rule config validation matches mode and question type.

### Pass 3.4 - Preview Generation

Goal:

- Generate and store 1 to 100 preview responses.
- Deduct credit only for successfully generated preview responses.

Validation:

- Count below 1 or above 5 is rejected.
- Successful generation writes `GeneratedResponses`, `UsageLogs`, and `CreditTransactions`.
- Failed generation writes `UsageLogs` with `CreditsUsed = 0`.
- No auto-submit occurs.

### Pass 3.5 - Controlled Submission

Goal:

- Submit only confirmed generated preview responses.
- Write submission job and per-response submission logs.

Validation:

- Submission without preview is rejected.
- Submission without confirmation is rejected.
- Successful and failed response sends write `SubmissionLogs`.
- No additional credit deduction occurs during submission.
- No retry, refund, proxy, captcha, or fake-account behavior is added.

### Pass 3.6 - Validation And Review

Goal:

- Run build, tests, migration validation when applicable, and focused review.

Validation:

- Backend build.
- Test project build.
- Unit tests for answer-generation modes.
- Integration tests for persistence, ledger, usage logs, and submission logs.
- Anti-abuse tests for count limits and no-submit-without-preview/confirmation.

## Stop Conditions

Stop before implementation if the task would:

- approve a Deferred item without explicit user approval
- finalize status values without approval
- add undocumented endpoints
- create frontend work inside Phase 3 without approval
- add Google OAuth or official Google Forms API behavior
- add AI answer generation or AI mapping
- add payment, webhook, retry, refund, proxy, captcha, or fake-account behavior
- weaken preview-before-submit or confirmation requirements

## Next Recommended Step

Run Pass 3.1 first:

- contract guard for API/DTO/status values
- DB architecture planning for entities and migrations
- DB risk review before implementation
- delivery planner to generate worker-ready prompts
