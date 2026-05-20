# TESTING_STRATEGY

## Purpose

Define validation expectations by change type.

## Validation Categories

### Build Validation

Run build validation for implementation changes once code exists.

Expected future baseline:

- backend build
- test project build
- migration compile/design-time validation

### Unit Tests

Use unit tests for:

- service business rules
- answer generation modes
- credit deduction calculations
- top-up approval/rejection logic
- validation helpers

### Integration Tests

Use integration tests for:

- controller endpoints
- EF Core persistence
- transaction behavior
- credit ledger writes
- usage log writes
- admin top-up approval workflow

### Runtime Smoke Tests

Runnable code changes require runtime smoke when behavior is exposed through a running process.

Use runtime smoke for:

- API route changes
- browser route or dashboard changes
- auth/session/role guard changes
- database-backed behavior after migrations
- payment link, callback, or webhook behavior
- public/tunnel URL behavior

Runtime smoke must verify:

- the affected server process was restarted after code changes
- the target route returns the expected HTTP status and response markers
- authenticated routes are checked with the correct user role/session
- browser routes hydrate and load required JavaScript/CSS chunks
- server logs do not show new exceptions for the smoke path

Build/test without runtime smoke is insufficient for closeout when runtime smoke is applicable.

### Migration Validation

Database changes must validate:

- migration generation
- migration application on clean database
- migration application on existing test database when applicable
- runtime database has the required tables/columns before smoke tests that depend on them
- rollback or recovery notes when rollback is hard

### Credit Ledger Tests

Verify:

- approved top-up increases balance
- credit transaction is written
- tool usage deducts credits
- balance after transaction is correct
- failed submission refund behavior remains Deferred unless approved

### Usage Log Tests

Verify:

- form analysis logs usage when required
- response generation logs usage
- submission action logs usage
- failed actions log status honestly

### Submission Validation Tests

Verify:

- preview is required before submission
- confirmation is required before sending
- preview response count is limited to 1 to 100 per action
- submission jobs are limited to 100 confirmed previews and sequential batches of 10
- pause/cancel behavior stops at a batch boundary
- supported answer modes generate valid preview payloads
- unsupported question types fail safely
- submission logs are written

### Anti-Abuse Tests

Verify the system rejects or does not implement:

- captcha bypass
- proxy rotation
- fake accounts
- unauthorized form submission
- spam-scale batch sizes
- AI auto-submit

### Documentation Sync Review

Every docs change must verify:

- matching `docs/ai` and `docs/vi` file exists
- hard rules are present in both
- Deferred items are not promoted in either layer
- no stale conflicting project names or stacks remain

## Validation Report Format

Use:

- Verified
- Not run
- Blocked
