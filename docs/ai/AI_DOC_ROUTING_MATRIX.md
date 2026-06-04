# AI_DOC_ROUTING_MATRIX

## Purpose

Route AI agents to the smallest sufficient documentation set before planning, coding, reviewing, or editing docs.

Always read `README.md` and `AGENTS.md` first.

## Routing Matrix

| Task type | Read first | Then read |
|---|---|---|
| Any task | `AGENTS.md` | this file |
| New requirement | `PROMPT_TEMPLATE_FOR_FUTURE_TASKS.md` | `PROJECT_EXECUTION_RULES.md`, `TASK_EXECUTION_FLOW.md` |
| Phase/scope question | `PROJECT_PHASE_ROADMAP.md` | `PHASE_EXECUTION_RULES.md`, `PHASE_0_CLOSEOUT.md`, `PHASE_1_CLOSEOUT.md`, `PHASE_2_CLOSEOUT.md`, `PHASE_7_CLOSEOUT.md`, `PHASE_8_KICKOFF_PLAN.md`, `PHASE_8_CLOSEOUT.md`, `PHASE_9_KICKOFF_PLAN.md`, `PHASE_9_CLOSEOUT.md` |
| Phase 3 kickoff | `PHASE_3_KICKOFF_PLAN.md` | `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md`, `TESTING_STRATEGY.md` |
| Phase 8 kickoff | `PHASE_8_KICKOFF_PLAN.md` | `PROJECT_PHASE_ROADMAP.md`, `PHASE_EXECUTION_RULES.md`, `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md`, `TESTING_STRATEGY.md` |
| Phase 9 kickoff, execution, or closeout | `PHASE_9_KICKOFF_PLAN.md` | `PHASE_9_CLOSEOUT.md`, `TESTING_STRATEGY.md`, `DEFINITION_OF_DONE.md`, `SELF_REVIEW_CHECKLIST.md`, `PROJECT_PHASE_ROADMAP.md`, `PHASE_EXECUTION_RULES.md` |
| Backend implementation | `TECH_STACK_DECISIONS.md` | `ARCHITECTURE_BOUNDARIES.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Frontend implementation | `TECH_STACK_DECISIONS.md` | `FRONTEND_STYLE_GUIDE.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Frontend UI from generated design | `FRONTEND_STYLE_GUIDE.md` | `UI_DESIGN_ARTIFACTS.md`, target `docs/design/stitch/<page>/` folder |
| Auth UI design or implementation | `AUTH_UI_DESIGN_GUIDE.md` | `FRONTEND_STYLE_GUIDE.md`, `UI_DESIGN_ARTIFACTS.md`, `API_CONTRACT_GUIDE.md` |
| Authentication/JWT backend | `API_CONTRACT_GUIDE.md` | `DOMAIN_ENTITIES_OVERVIEW.md`, `PROJECT_PHASE_ROADMAP.md`, `TESTING_STRATEGY.md` |
| API contract design | `API_CONTRACT_GUIDE.md` | `MODULE_MAP.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Database/entity work | `DOMAIN_ENTITIES_OVERVIEW.md` | `TECH_STACK_DECISIONS.md`, `TESTING_STRATEGY.md` |
| Credit or top-up work | `MODULE_MAP.md` | `DOMAIN_ENTITIES_OVERVIEW.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Form automation work | `MODULE_MAP.md` | `ARCHITECTURE_BOUNDARIES.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Google Forms integration | `ARCHITECTURE_BOUNDARIES.md` | `EVENT_AND_WEBHOOK_CONTRACTS.md`, `TECH_STACK_DECISIONS.md` |
| AI feature request | `PHASE_EXECUTION_RULES.md` | `PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md`, `TECH_STACK_DECISIONS.md`, `ARCHITECTURE_BOUNDARIES.md` |
| Payment request | `PHASE_EXECUTION_RULES.md` | `PHASE_8_KICKOFF_PLAN.md`, `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Testing/validation | `PHASE_9_KICKOFF_PLAN.md` | `TESTING_STRATEGY.md`, `DEFINITION_OF_DONE.md`, `SELF_REVIEW_CHECKLIST.md` |
| Documentation edit | `PROJECT_EXECUTION_RULES.md` | matching `docs/ai` and `docs/vi` files |
| Review | `SELF_REVIEW_CHECKLIST.md` | `DEFINITION_OF_DONE.md`, task-specific docs |


| NCKH task | `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`, `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md` | `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`, `docs/ai/nckh/NCKH_PHASE_1_CLOSEOUT.md`, `docs/ai/nckh/NCKH_PHASE_2_CLOSEOUT.md`, `docs/ai/nckh/NCKH_PHASE_2_KICKOFF_PLAN.md`, `docs/ai/nckh/NCKH_REQUIREMENT_PACKAGE.md`, `docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md`, `docs/ai/nckh/NCKH_MODULE_MAP.md`, `docs/ai/nckh/NCKH_ARCHITECTURE_BOUNDARIES.md`, `docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md` |



Every file in `docs/ai/` must have a same-name counterpart in `docs/vi/`.

If a task changes one side, update the other side in the same task.

## Hard Stop Conditions

Stop and ask for approval when:

- the task would approve a Deferred item
- the task creates final API contracts from proposed API areas
- the task finalizes proposed database fields or statuses
- the task weakens abuse-prevention rules
- the task commits to a frontend framework
- the task invents Google OAuth, payment gateway, AI, refund, or background job behavior

## Files Over 400 Lines

Some docs files exceed the 400-line threshold. Before reading them in full, scan section headers to confirm the task needs the content (see `PROJECT_EXECUTION_RULES.md#file-organization--reading-strategy` for reading strategy).

| File | Approx. Lines |
|---|---|
| `PHASE_6_AI_MAPPING_GENERATION_REQUIREMENT_PACKAGE.md` | ~500 |
| docs/ai/nckh/NCKH_API_CONTRACT_GUIDE.md | ~150 |
| docs/ai/nckh/NCKH_DOMAIN_ENTITIES_OVERVIEW.md | ~200 |
| `API_CONTRACT_GUIDE.md` | ~450 |

Line counts are approximate and may drift over time. When opening a file not listed here but appearing large, apply the same TOC-first approach.

## Reading Strategy

Before loading any docs file, apply these rules to avoid unnecessary token usage (full rules in `PROJECT_EXECUTION_RULES.md#file-organization--reading-strategy`):

1. This file is the starting point — identify the minimal file set for the task before reading anything else.
2. For files > 200 lines: scan headers/TOC first, load full content only for relevant sections.
3. Do not re-read a file already loaded in the same session.
4. Priority: rules/contracts → architecture overviews → implementation details.
5. Use TOC line ranges to jump to sections instead of loading entire large files.
