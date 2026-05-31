# PROJECT_EXECUTION_RULES

## Purpose

Define non-negotiable execution discipline for FormAuto Hub.

## Current State

- Current global phase state: Phase 9 closeout completed; next phase not selected.
- Active approved follow-up slice: none. Phase 6 AI mapping/generation scoped implementation is completed.
- Phase 1 backend foundation exists under `src/FormAutoHub.Api`.
- Initial test project exists under `tests/FormAutoHub.Tests`.
- Backend stack is confirmed: ASP.NET Core Web API .NET 9, SQL Server, EF Core.
- Frontend framework is Next.js web dashboard.

## Non-Negotiable Rules

- Do not invent business rules, API contracts, fields, statuses, events, lifecycle states, or architecture decisions.
- Mark missing details as `Assumption:`.
- Mark unapproved future work as `Deferred:`.
- Keep changes inside the active global phase or an explicitly approved follow-up slice.
- Use the smallest correct change.
- Preserve abuse-prevention language.
- Preserve validation honesty.
- Keep `docs/ai` and `docs/vi` semantically synced.
- Do not implement code while doing documentation-only work.
- Do not add business workflows during Phase 1 foundation work unless explicitly approved.

## Safety Rules

FormAuto Hub must not support spam, captcha bypass, proxy rotation, fake accounts, unauthorized form submission, or bypassing Google restrictions.

Every submission flow must require:

- authorized user context
- preview before submission
- user confirmation before sending
- MVP preview generation limit of 1 to 100 generated responses per action
- controlled submission batch size of 10 responses, processed sequentially
- usage logging
- credit transaction discipline when credits are deducted

## Contract Rules

- Proposed APIs are not final contracts.
- Proposed entity fields are not immutable database contracts.
- Status lifecycle names are proposed only until reviewed.
- API changes require contract review before implementation.
- Database changes require entity and migration review before implementation.

## Documentation Rules

- Read existing `.md` files before documentation changes.
- Update paired `docs/ai` and `docs/vi` files together.
- Do not allow one language layer to contain stronger commitments than the other.
- If one side is not updated, report out-of-sync status.
## File Organization & Reading Strategy

### Doc File Length

- Keep `.md` files in `docs/ai/` and `docs/vi/` under **400 lines**.
- When a file reaches the threshold, choose one of:
  - **Split**: if the file covers >= 2 clearly independent topics. Create sub-files named `<PARENT>__<SUBTOPIC>.md` and turn the original into a routing index (TOC + links only, no detailed content).
  - **TOC mode**: if content is tightly coupled and splitting would scatter related rules across too many files. Keep one file but add a detailed TOC at the top listing every section with its starting line number and a one-line purpose description.
- Existing files over the threshold are not required to be retrofitted immediately; apply the rule forward-only for new files and files under active editing.

### Code File Map

- No hard line limit for code files. Split only when architecturally justified (extracting a clear concern, creating a dedicated helper/service with real reuse).
- When a C# file exceeds **500 lines** and is not split, a **file map** comment block is required at the top of the file, listing every method/property group with its starting line and a one-line purpose.
- See `SOURCE_STRUCTURE_AND_NAMING_RULES.md` for the map format and example.

### Reading Strategy

To minimize unnecessary token usage when reading documentation:

1. Read `AI_DOC_ROUTING_MATRIX.md` first to identify the minimal set of files needed for the task.
2. For files > 200 lines: scan section headers or TOC first; load full content only for sections relevant to the task.
3. Do not re-read a file already loaded in the same session.
4. Priority order: rules/contracts -> architecture overviews -> implementation details.
5. When a file has a TOC with line ranges, use the TOC to jump to the needed section instead of loading the entire file.
