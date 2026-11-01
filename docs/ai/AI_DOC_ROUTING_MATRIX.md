# Documentation routing

Start README → AGENTS → [authority](agent/AUTHORITY_MAP.md) → existing task/handoff. Select the smallest sufficient set below; [skill matrix](../../SKILL_USAGE_MATRIX.md) selects methods, not this file.

## By task

| Task | Read |
| --- | --- |
| Plan, execute, docs, handoff/resume or permission | [execution](agent/EXECUTION_RULES.md); approved task and affected owner docs |
| Test, review, browser or Done | [quality](agent/QUALITY_GATES.md), [domain tests](TESTING_STRATEGY.md) |
| Skill/tool selection, install or capability claim | [tooling](agent/TOOLING.md), [skill matrix](../../SKILL_USAGE_MATRIX.md) |
| Phase or new requirement | [phase rules](PHASE_EXECUTION_RULES.md), [roadmap](PROJECT_PHASE_ROADMAP.md), relevant approval/closeout; [task brief](../../templates/TASK_BRIEF.md) |
| Backend or source navigation | [stack](TECH_STACK_DECISIONS.md), [boundaries](ARCHITECTURE_BOUNDARIES.md), [source rules](SOURCE_STRUCTURE_AND_NAMING_RULES.md), [modules](MODULE_MAP.md) |
| Frontend/shared UI | [frontend guide](FRONTEND_STYLE_GUIDE.md), source rules, modules, affected shared components and consumers |
| Auth UI | [auth UI](AUTH_UI_DESIGN_GUIDE.md), frontend guide, [API](API_CONTRACT_GUIDE.md) |
| Generated UI/Stitch | frontend guide, [artifacts](UI_DESIGN_ARTIFACTS.md), relevant `docs/design/stitch/` folder |
| API/auth/credit/top-up/payment | API, modules, [entities](DOMAIN_ENTITIES_OVERVIEW.md), approved scope and relevant domain tests; payment also [Phase 8](PHASE_8_KICKOFF_PLAN.md) |
| Database/migration | entities, stack, boundaries, affected migration/test and contract |
| Form automation/Google | modules, boundaries, API, [events](EVENT_AND_WEBHOOK_CONTRACTS.md); preserve the core/NCKH distinction |
| AI | phase rules, [Phase 6 scope](PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md), [closeout](PHASE_6_CLOSEOUT.md), API and actual integration |
| NCKH | [ledger](nckh/NCKH_PROGRESS_LEDGER.md) → [transition](nckh/NCKH_PHASE_TRANSITION_GUIDE.md) → NCKH module/architecture/contract and only relevant phase/follow-up |
| Local/server/deploy | [environment](ENVIRONMENT_SETUP.md), [deployment](DEPLOYMENT_GUIDE.md), actual config; server specialist for read-only production diagnosis |
| UI/credit follow-up | [UI_CREDIT_FOLLOWUP_SYNC](UI_CREDIT_FOLLOWUP_SYNC.md), frontend guide, API; NCKH contracts when affected |
| SEO/GEO follow-up | [implementation record](SEO_GEO_IMPLEMENTATION_PLAN.md), [validation runbook](SEO_GEO_VALIDATION_RUNBOOK.md), frontend guide and relevant tests; preserve accepted UI |

## Reading and sync

For docs over 200 lines, scan headings before selecting relevant sections. Do not reread unchanged content already loaded; expand when correctness requires it. Rules/contracts precede architecture and implementation. A TOC does not replace reading complete affected source/dependencies/tests.

Every `docs/ai/` Markdown file has a same-relative-path `docs/vi/` counterpart; update both with equal commitments. Historical phase kickoff/reports are context, not current permission. New contract/schema/safety/phase decisions follow execution rules; never infer approval from an old pack.

SEO/GEO evidence remains dated: local/public release checks on 2026-10-09 were Verified, GSC sitemap processing was Blocked, search/AI outcomes were Not run. The recovery plan is a separate proposal; read it when relevant. This routing change neither re-runs those checks nor authorizes release or new global phase work.
