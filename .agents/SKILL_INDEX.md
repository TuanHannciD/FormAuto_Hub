# FormAuto Hub Skill Index

Use this file to choose the smallest sufficient skill combination.

| Task type | Primary skill | Add when needed |
|---|---|---|
| Ambiguous requirement | `formauto-requirement-analyst` | `formauto-module-router`, `formauto-phase-gate` |
| Small clear task | `formauto-ba-pm-planner-lite` | `formauto-contract-guard`, `formauto-reviewer` |
| Multi-step delivery | `formauto-delivery-planner` | `formauto-implementation-worker`, `formauto-reviewer` |
| Unknown workflow/data lifecycle | `formauto-system-requirement-interviewer` | `formauto-db-architecture-planner` |
| Database strategy | `formauto-db-architecture-planner` | `formauto-db-risk-reviewer` |
| API/DTO/status/entity contract | `formauto-contract-guard` | `formauto-module-router` |
| Module/layer ownership | `formauto-module-router` | `formauto-phase-gate` |
| Phase fit | `formauto-phase-gate` | `formauto-requirement-analyst` |
| Runtime bug/log symptom | `formauto-bug-triage` | `formauto-http-behavior-tester` |
| Endpoint behavior check | `formauto-http-behavior-tester` | `formauto-contract-guard` |
| Documentation edit | `formauto-controlled-doc-editor` | matching `docs/ai` and `docs/vi` files |
| Stitch UI design generation | `formauto-stitch-ui-iterative-designer` | `formauto-phase-gate`, `formauto-reviewer` |
| Scoped implementation | `formauto-implementation-worker` | `formauto-reviewer` |
| Review | `formauto-reviewer` | `formauto-contract-guard`, `formauto-phase-gate` |

## Default Pairings

- Requirement -> module/phase/contract -> delivery -> worker -> reviewer.
- Database recommendation -> risk review -> controlled doc editor after approval.
- Bug symptom -> triage -> HTTP behavior tester when a live route check is useful -> worker -> reviewer.
- Stitch UI screen -> iterative Stitch designer -> save design artifact -> reviewer when implementation risk exists.
