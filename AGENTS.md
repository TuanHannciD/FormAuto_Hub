# FormAuto Hub — Agent instructions

Repository rules are subordinate to system/developer/runtime instructions and user authorization. Start with `README.md`, this file, [authority](docs/ai/agent/AUTHORITY_MAP.md), existing task/handoff, then [routing](docs/ai/AI_DOC_ROUTING_MATRIX.md). Read only task-relevant docs and source before changing them. Use Vietnamese for user-facing reports.

## One workflow and its owners

- [Execution rules](docs/ai/agent/EXECUTION_RULES.md): scope, permissions, task/handoff/resume and resource ownership.
- [Quality gates](docs/ai/agent/QUALITY_GATES.md): validation, browser testing, review and Done.
- [Tooling](docs/ai/agent/TOOLING.md): package provenance, runtime discovery and project overrides.
- [Skill matrix](SKILL_USAGE_MATRIX.md): Superpowers methods, Impeccable UI, UI UX Pro Max research and seven domain specialists. Do not use retired generic FormAuto workflow skills.
- [Source rules](docs/ai/SOURCE_STRUCTURE_AND_NAMING_RULES.md): find current symbols; read complete affected units and dependency/consumer/test paths. Maps are navigation, not implementation evidence.

## Scope and documentation

- Preserve existing dirty/untracked/ignored work and evidence. Never reset/clean/overwrite unrelated work.
- Do not invent business rules, contracts, fields, statuses, events, lifecycle, architecture or phase commitments. Mark missing details `Assumption:` and unapproved future work `Deferred:`.
- Stay within approved scope/phase/follow-up; use the smallest correct change. Do not redesign or activate Deferred work implicitly.
- Documentation is proposal-first unless edits are already approved. Read existing relevant Markdown; update `docs/ai/` and same-path `docs/vi/` together, preserving UTF-8 and Vietnamese diacritics. Report conflicts before altering disputed behavior.
- Skills never grant dispatch, installation, Git/remote/deployment or cleanup permission. Reuse authorization already given; ask only for a genuinely missing decision/right.

## Product and architecture invariants

- No spam, captcha bypass, proxy rotation, fake accounts, unauthorized submission, bypassing Google restrictions or AI auto-submit without preview and user confirmation.
- Require authorized user context, preview and confirmation. Generate 1–100 previews per action; submit controlled sequential batches of 10, with applicable usage/submission logs.
- Credit changes go through the dedicated credit service and write `CreditTransactions`; tool actions write `UsageLogs`; submission actions write `SubmissionLogs`.
- Controllers handle HTTP; services own business workflow/validation; DTOs own API contracts; entities represent persisted state; EF Core owns persistence; integrations own external calls. Services do not return framework HTTP results, entities do not call APIs, controllers stay thin.
- Keep Google Forms and AI provider calls out of account/credit services. Preserve SQL Server/EF Core migrations, .NET 9 API and Next.js dashboard; no implied stack redesign.
- Core Google login is identity-only; official Forms integration remains Deferred for core. NCKH is a separately approved track; use its ledger/contracts. Approved PayOS and scoped Phase 6 AI behavior do not approve other providers or broader rollout.

## Honest completion

Use `Verified`, `Failed`, `Not run`, `Blocked` as appropriate. Missing required checks do not become pass by being disclosed. Runnable API/browser/auth/DB/payment/webhook/tunnel changes need applicable runtime smoke after restarting owned affected processes, correct role/session, browser hydration/chunks, applied schema and relevant logs. Build/test alone is insufficient.

Review according to quality gates; self-review is not independent review. Report Summary, Files changed, Scope alignment, Validation performed, Validation not performed, Risks/Deferred items and Next recommended step. Do not claim integration or release from local completion.
