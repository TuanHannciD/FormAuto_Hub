# FAH-AGENT-001 — packaged workflow migration

Date: 2026-10-28. Status: Done for local documentation/package scope; not committed, integrated or released.

## Approved scope and plan

User approved replacing generic FormAuto workflow skills with 15 pinned Superpowers + Impeccable/UI UX Pro Max, keeping seven domain specialists, consolidating paired operating docs into four owners, preserving product code and existing work. No commit/push/deploy, global settings, production mutations or changes to Minh Khuê.

Execution method: approved plan executed inline; no child dispatch. Project overrides apply instead of upstream automatic commits/worktrees/scratch cleanup. Baseline SHA/status/hashes and original docs/skills are preserved locally at `.codex-tmp/agent-migration-20261028/`. This is a current dirty snapshot, not a new committed base.

- [x] Baseline, source/license inventory and hash preflight.
- [x] Import manifest-owned bytes; replace generic routing; retain seven specialists.
- [x] Consolidate authority/execution/quality/tooling in AI/VI; preserve compatibility paths and historical packs.
- [x] Verify packages/mirror, paths/anchors, AI/VI, preservation and scoped planning/verification pilot.
- [x] Self-review final diff and hand off; independent review not required for this docs/package scope.

## Decisions and limits

- `.agents/skills` is authoritative, `.claude/skills` generated. No product stack/schema/contract changes.
- Fixed stale specialist claims: frontend Deferred, Stitch 1–5 preview and blanket Deferred feature list. Current approved safety/contract remains unchanged.
- Existing SEO/GEO dirty files/artifacts are preserved; entrypoint restructuring preserves their dated status and links. SEO implementation/runbook/recovery/artifacts are not edited by this task.
- Packaged skill installation and explicit reading can be verified here; auto-discovery next turn and all vendor workflows are not assumed.
- Checker/sync helper is scoped package maintenance, standard-library only. No application runtime gate is needed because product code/config is unchanged.

## Validation

Verified on 2026-10-28:

- `python scripts/agent-skills.py --sync`, then `--check`: 24 active skills, 280 pinned hash entries, 293 mirrored files, final drift 0.
- Isolated helper fixtures: clean check, drift rejection, authorized repair, unknown-file preservation, tamper rejection, traversal/absolute rejection, missing-package rejection (7 cases).
- Scoped document check: 83/83 AI/VI relative paths, owned Markdown links/anchors and UTF-8 checked. AI/VI operating rules reviewed for equal commitments; path parity alone is not semantic verification.
- Baseline comparison protects product source/config, existing SEO implementation/runbook/recovery/artifacts and unrelated files. Git HEAD is unchanged. Three checkout-filter samples preserve package bytes via `.gitattributes`.
- Manual planning/verification pilot: six routing decisions with real package/path assertions. Explicit reading of using-superpowers, writing-plans and verification-before-completion; not a fresh-agent or auto-discovery pilot.
- Impeccable context CLI resolves `apps/web`, exits 0 and reports missing generic PRODUCT.md. UI UX Pro Max UX search exits 0 with one result. No design files generated; update/staleness network/cache checks disabled.
- Task-owned tracked `git diff --check`: exit 0. Self-review covers scope, gates, safety/contract preservation, mirror/permissions and compatibility. No independent review claimed.

Evidence and full limits: [validation.json](../../../../artifacts/reports/agent-workflow/2026-10-28/validation.json). Baseline HEAD: `8a4f18ee77453857c550ff7be0279c5cc9e415f1`; deliverable is a local dirty snapshot.

Not run: app build/tests/runtime/browser/SQL/provider/production, independent Agent resume, automatic skill discovery and all vendor workflows. Product runtime is not changed. Additional CI/dependency/browser/provider work remains Deferred.

Source-project observation: 11 Minh Khuê documents changed between baseline and final read, outside this task's read-only operations. All 280 imported source hash entries remain unchanged. Do not claim its whole workspace was frozen; see evidence paths. This task executed no write/commit/install in Minh Khuê.

## Next action

Use AGENTS → authority → current task/routing and the single skill matrix on the next task. The new packages can be discovered on a later turn/session; if absent from the runtime catalog, explicitly read the local SKILL.md and report that limit. Keep the local baseline/evidence until the user chooses integration; do not replay historical NCKH packs.
