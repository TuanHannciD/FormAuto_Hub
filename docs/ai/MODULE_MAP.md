# MODULE_MAP

## Purpose

Define canonical module ownership for FormAuto Hub.

## Module Ownership

| Module | Owns | Must not own |
|---|---|---|
| Auth | sign-in, password verification, authorization boundaries | final JWT claim structure until approved |
| Users | user profile identity and basic user data | credit accounting |
| UserCreditAccounts | current balance and totals | ledger history as primary record |
| CreditManagement | credit deduction, credit addition, balance invariants | Google Forms calls |
| Packages | credit package read model, approved admin package create/update/active-state follow-up | payment gateway behavior |
| TopupOrders | user-created top-up orders | admin approval decisions |
| AdminTopupOrders | admin approve/reject workflow | package management UI unless approved |
| CreditTransactions | immutable credit ledger entries | mutable balance state as source of truth |
| UsageLogs | tool action audit trail | submission payload storage as source of truth |
| Dashboard | summary cards, recent top-up orders, recent tool usage, account navigation data | business workflows |
| Profile | profile read/update and password change | admin user management |
| FormProjects | analyzed form project metadata | response submission execution |
| FormQuestions | detected question metadata | answer generation rules |
| AnswerRules | configured answer-generation rules | submission job execution |
| ResponseGeneration | preview response generation and MVP answer modes | auto-submit without confirmation |
| GeneratedResponses | stored generated preview payloads | credit ledger behavior |
| Submissions | controlled send workflow, submission jobs, submission logs | captcha bypass, proxy rotation, unauthorized submission |
| SubmissionLogs | per-response submission result | credit refund policy unless approved |
| AuditLogs | admin/security-sensitive audit records | normal usage log replacement |
| Integrations.GoogleForms | Google Forms analysis/submission integration boundary | account/credit business logic |
| Integrations.Payment | Deferred payment provider boundary | MVP manual approval implementation |
| Integrations.AI | Deferred AI mapping/suggestion boundary | MVP answer generation unless approved |

## Cross-Module Rules

- Credit deduction must go through `CreditManagement`.
- Every credit change must create a `CreditTransactions` row.
- Every tool action must create a `UsageLogs` row.
- Every submission attempt must create a `SubmissionLogs` row.
- Form submission must require preview and user confirmation.
- Google Forms integration code must stay out of credit/account modules.
- Deferred integration modules may exist as planning boundaries, not production-complete claims.

## MVP Answer Modes

Supported MVP answer-generation modes:

- random equally
- random by percentage
- random by quantity
- sample text lines for text answers
- sequential date ranges for date questions
- sequential time ranges for time questions
