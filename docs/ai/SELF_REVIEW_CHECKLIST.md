# SELF_REVIEW_CHECKLIST

## Purpose

Require agents to review scope, contract safety, architecture, validation, and docs sync.

## Checklist

### Scope

- Did the task stay inside the approved phase?
- Were Deferred items kept Deferred?
- Were assumptions labeled?

### Safety

- Did the change avoid spam, bypass, proxy, fake-account, and unauthorized submission behavior?
- Does submission still require preview and confirmation?
- Is the 1 to 100 preview limit and sequential submission batch size of 10 preserved?

### Architecture

- Are controllers thin?
- Are services responsible for business logic?
- Is EF Core persistence isolated correctly?
- Are integration calls kept in integration services?

### Contracts

- Were API contracts reviewed?
- Were DTOs explicit?
- Were entity fields treated as proposed unless approved?
- Were status names and transitions not invented?

### Credit Discipline

- Do credit changes write `CreditTransactions`?
- Do tool actions write `UsageLogs`?
- Do submissions write `SubmissionLogs`?

### Validation

- Was build/test/runtime validation actually run?
- Are skipped validations marked `Not run` or `Blocked`?

### Docs

- Were `docs/ai` and `docs/vi` updated together?
- Are commitments semantically synced?
