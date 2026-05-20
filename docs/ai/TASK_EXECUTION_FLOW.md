# TASK_EXECUTION_FLOW

## Purpose

Define the default task flow for FormAuto Hub work.

## Default Flow

1. Restate the task.
2. Identify active phase.
3. Read routing docs and task-specific docs.
4. Identify affected modules and ownership.
5. Separate confirmed rules, assumptions, and Deferred items.
6. Check safety and abuse-prevention boundaries.
7. Check API/database contract impact.
8. Propose or implement the smallest safe change.
9. Validate according to change type.
10. Run the runtime validation gate when runnable behavior changed.
11. Review logs and runtime output for new errors.
12. Report what changed, what did not change, what was tested, and what was not tested.

## Runtime Validation Gate

A task that changes runnable code cannot be reported as complete from build/test alone when the changed behavior is exercised through an API route, browser route, authentication flow, database migration, payment flow, external callback/webhook, or public/tunnel URL.

Before closeout, run every applicable check:

- restart the affected backend, frontend, worker, or local server after code changes
- verify changed API endpoints with real HTTP requests and the correct auth role/session
- verify changed browser routes render and hydrate, not just return HTML `200`
- verify Next.js static chunks return `200` when the app is tested through a tunnel or public URL
- verify EF Core migrations are applied when runtime code depends on new tables or columns
- verify payment/webhook flows with safe mocked or sandbox requests when the task changes payment behavior
- read relevant terminal/server logs after the smoke checks

If an applicable runtime check is not run, the task may be described as implemented, but closeout must be marked `Not run`, `Blocked`, or not complete. Do not say the task is done.

## Escalation Rules

Escalate before implementation when:

- requirements are ambiguous
- a database decision is needed
- an API contract must be finalized
- auth or JWT claim behavior is required
- Google OAuth or official Google Forms API behavior is requested
- payment gateway behavior is requested
- AI generation or mapping is requested
- refund behavior after failed submission is requested
- frontend framework choice is requested

## Split Work Flow

For multi-part work, split into:

- requirement analysis
- module routing
- contract review
- database review
- implementation
- validation
- review
- documentation sync

Do not collapse analysis, implementation, and review into one unverified claim.

## Stop Conditions

Stop when the task would:

- weaken safety rules
- enable abuse-oriented behavior
- exceed current phase without approval
- silently finalize a proposed contract
- implement Deferred work
- change only one language documentation layer
