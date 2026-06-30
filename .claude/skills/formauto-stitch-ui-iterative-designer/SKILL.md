---
name: formauto-stitch-ui-iterative-designer
description: Generate FormAuto Hub UI screens with Stitch, review the generated screenshot against project frontend rules, iterate with Stitch edits until the UI is acceptable or a blocker is explicit, and save the final screenshot/HTML/design notes under docs/design. Use when the user asks to create more pages in Stitch, improve a Stitch-generated UI, self-review and fix UI quality, or archive Stitch outputs for later frontend implementation.
---

# Purpose

Create high-quality Stitch UI references for FormAuto Hub without turning design artifacts into production contracts.

# Required Inputs

- Target page or flow.
- Intended actor: public visitor, authenticated user, or admin.
- Phase/scope boundary. If unclear, read roadmap/style docs and state `Assumption:`.
- Stitch project id and design system id when available. If not available, list or inspect Stitch projects/design systems first.

# Workflow

1. Read `README.md`, `AGENTS.md`, `docs/ai/AI_DOC_ROUTING_MATRIX.md`, and `docs/ai/FRONTEND_STYLE_GUIDE.md`.
2. Identify whether the page is:
   - landing/public marketing
   - authenticated dashboard
   - admin/approval
   - form workflow
   - credit/account management
3. Build a precise Stitch prompt with:
   - Vietnamese copy when the product UI is for this repo
   - approved visual direction: shadcn/ui, Tailwind, lucide-style icons, compact B2B dashboard UI
   - concrete sections, table columns, form fields, states, and actions
   - forbidden/deferred items explicitly excluded
4. Generate the first screen with Stitch.
5. Download the screenshot and HTML export from Stitch output.
6. Review the screenshot visually before accepting it.
7. If issues are found, call Stitch edit or variant generation with a concrete fix prompt. Do not regenerate blindly.
8. Repeat review and fix until the screen passes, or stop with an explicit blocker after repeated concrete failures.
9. Save final artifacts under `docs/design/stitch/<page-slug>/`.
10. Add `README.md`, `screen-map.md`, and optionally `notes.md` for implementation guidance.

# Review Checklist

Reject or revise the screen when any item fails:

- Text is unreadable, clipped, overlapped, or too small.
- Layout feels like a marketing hero when the page is an app dashboard.
- Tables/forms/cards are too sparse for an operations product.
- Page uses heavy gradients, decorative blobs, card-inside-card layouts, or dark theme unless explicitly requested.
- UI invents deferred production features such as payment gateway, Google OAuth, official Google Forms API, AI auto-generation, auto-submit, package management, admin user management, or manual credit adjustment.
- Safety copy weakens the MVP constraints: preview before submission and 1-5 generated responses per action.
- Vietnamese copy is unnatural, missing diacritics, or mixes English labels without reason.
- Statuses, fields, or workflow states look like API/database contracts that were not approved.
- Screenshot does not match the requested page or actor.

# Iteration Rules

- Use targeted edits: describe the exact visual/content defect and the desired correction.
- Preserve parts that already work.
- Prefer at most 3 repair cycles per screen. Continue beyond that only if each cycle is clearly improving and the user asked for deeper iteration.
- Do not call a failed timeout again immediately. Inspect the project/screen first, because Stitch may still have created an output.
- When the screen cannot be fixed reliably, save the best artifact only if it is clearly marked as rejected or draft.

# Artifact Rules

Use this folder shape:

```text
docs/design/stitch/<page-slug>/
├── README.md
├── screen-map.md
├── notes.md
├── screenshots/
│   └── <page-slug>-vi.png
└── exports/
    └── <page-slug>-vi.html
```

`README.md` must include:

- Stitch project id.
- Stitch screen id.
- Screen title.
- Language.
- Design system name/id when known.
- A warning that the artifact is design reference only.

`screen-map.md` must include:

- Purpose.
- Main sections.
- Implementation notes.
- Phase alignment.
- Deferred items to avoid.

# Stitch Tool Guidance

- Use `list_design_systems` before generation when the design system id is unknown.
- Use `generate_screen_from_text` for a new page.
- Use `edit_screens` for targeted corrections to an existing screen.
- Use `generate_variants` only when exploring alternatives, not for ordinary repair.
- If a generation timeout occurs, do not retry immediately. Poll or inspect project/screens first.
- Save download URLs with `Invoke-WebRequest` into the artifact folder.

# Final Response Requirements

Report:

- Summary.
- Stitch screen id.
- Files changed or created.
- Scope alignment.
- Validation performed.
- Validation not performed.
- Risks/Deferred items.
- Next recommended page or step.
