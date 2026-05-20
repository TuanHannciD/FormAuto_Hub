# DEFINITION_OF_DONE

## Purpose

Define completion criteria for FormAuto Hub tasks.

## Done Criteria

A task is done only when all applicable checks are satisfied or honestly reported.

## Required Checks

### Scope Check

- Task stayed inside approved scope.
- Deferred items stayed Deferred.
- Abuse-prevention rules were not weakened.

### Contract Check

- API changes are documented and reviewed.
- DTO changes are explicit.
- Status/lifecycle changes are approved.
- No undocumented endpoint was created.

### Migration Check

- EF Core entity changes have migration review.
- Migration validation is run when database code exists.
- SQL Server remains the target database.

### Build Check

- Build was run when implementation changed code, or marked `Not run`.

### Test Check

- Relevant unit/integration tests were run, or marked `Not run`.

### Runtime Smoke Check

- Runnable code changes have applicable runtime smoke.
- API changes were checked through real HTTP requests.
- Browser changes were checked through real routes, including hydration/chunk loading when relevant.
- Auth/admin changes were checked with the correct user role/session.
- Database-backed changes were checked against a database with the required migration applied.
- Server logs or terminal output were checked after smoke validation.

Build/test success alone is not enough to mark a runnable code task done when runtime smoke applies.

### Security/Abuse Check

- No captcha bypass, proxy rotation, fake account, spam, or unauthorized submission behavior was added.
- Preview and confirmation requirements remain intact.

### Docs Sync Check

- `docs/ai` and `docs/vi` are updated together.
- Semantic commitments match.

## Completion Template

```md
Summary:

Files changed:

Scope alignment:

Validation performed:

Validation not performed:

Runtime smoke:

Risks/Deferred items:

Next recommended step:
```
