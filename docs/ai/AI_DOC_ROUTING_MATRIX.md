# AI_DOC_ROUTING_MATRIX

## Purpose

Route AI agents to the smallest sufficient documentation set before planning, coding, reviewing, or editing docs.

Always read `README.md` and `AGENTS.md` first.

## Routing Matrix

| Task type | Read first | Then read |
|---|---|---|
| Any task | `AGENTS.md` | this file |
| New requirement | `PROMPT_TEMPLATE_FOR_FUTURE_TASKS.md` | `PROJECT_EXECUTION_RULES.md`, `TASK_EXECUTION_FLOW.md` |
| Phase/scope question | `PROJECT_PHASE_ROADMAP.md` | `PHASE_EXECUTION_RULES.md`, `PHASE_0_CLOSEOUT.md`, `PHASE_1_CLOSEOUT.md`, `PHASE_2_CLOSEOUT.md` |
| Phase 3 kickoff | `PHASE_3_KICKOFF_PLAN.md` | `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md`, `TESTING_STRATEGY.md` |
| Backend implementation | `TECH_STACK_DECISIONS.md` | `ARCHITECTURE_BOUNDARIES.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Frontend implementation | `TECH_STACK_DECISIONS.md` | `FRONTEND_STYLE_GUIDE.md`, `SOURCE_STRUCTURE_AND_NAMING_RULES.md`, `MODULE_MAP.md` |
| Frontend UI from generated design | `FRONTEND_STYLE_GUIDE.md` | `UI_DESIGN_ARTIFACTS.md`, target `docs/design/stitch/<page>/` folder |
| API contract design | `API_CONTRACT_GUIDE.md` | `MODULE_MAP.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Database/entity work | `DOMAIN_ENTITIES_OVERVIEW.md` | `TECH_STACK_DECISIONS.md`, `TESTING_STRATEGY.md` |
| Credit or top-up work | `MODULE_MAP.md` | `DOMAIN_ENTITIES_OVERVIEW.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Form automation work | `MODULE_MAP.md` | `ARCHITECTURE_BOUNDARIES.md`, `API_CONTRACT_GUIDE.md`, `TESTING_STRATEGY.md` |
| Google Forms integration | `ARCHITECTURE_BOUNDARIES.md` | `EVENT_AND_WEBHOOK_CONTRACTS.md`, `TECH_STACK_DECISIONS.md` |
| AI feature request | `PHASE_EXECUTION_RULES.md` | `TECH_STACK_DECISIONS.md`, `ARCHITECTURE_BOUNDARIES.md` |
| Payment request | `PHASE_EXECUTION_RULES.md` | `API_CONTRACT_GUIDE.md`, `DOMAIN_ENTITIES_OVERVIEW.md` |
| Testing/validation | `TESTING_STRATEGY.md` | `DEFINITION_OF_DONE.md`, `SELF_REVIEW_CHECKLIST.md` |
| Documentation edit | `PROJECT_EXECUTION_RULES.md` | matching `docs/ai` and `docs/vi` files |
| Review | `SELF_REVIEW_CHECKLIST.md` | `DEFINITION_OF_DONE.md`, task-specific docs |

## Required Sync Pairing

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
