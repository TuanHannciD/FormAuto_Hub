# E — NCKH error remediation frozen GREEN-ready snapshot

2026-10-30; implementer /root/nckh_ui gpt-6.1-sol/high; no children. Shared checkout D:/TinHoc/FormAuto_Hub. Root owns coordination, runtime owner owns runners/browser/processes/SQL. No commit/push/merge/deploy/install/cleanup/provider/live submission.

## Summary and scope alignment

Four approved production files, two new isolated fah-err-nckh test files. ERR-017 adds model/request/unmount ownership, invalidation before refresh, explicit failed-slice messages and read-only retry. Current complete snapshot required for data-dependent mutation and export; old confirmation closure cannot start an action on another model. Successful slices remain readable when unrelated slices fail, with mutation controls disabled. Switching model resets model-scoped draft/results. Workspace/list reads also reject superseded results.

ERR-018 mapper uses the existing NckhGoogleAuthorizationError discriminator or ApiError status/method/path. It does not classify arbitrary invalid/conflict/401/403 substrings or expose raw error data. Import400 asks the user to check the form link/access, relation409 asks them to check relations, export409 asks them to check dataset preconditions; none asserts an unconfirmed exact backend cause. JWT remains owned by the shared auth client. No server/DTO/status/lifecycle change.

ERR-021 list failures hide stale/empty rows and import actions until a successful GET verifies current state. Dataset null means unavailable/loading, while successful empty data keeps the empty state. ERR-019 replaces the owned technical phase/contract/endpoint/payload/backend/conflict copy with Vietnamese guidance and a local-configuration message; no provider connectivity claim.

## Files changed

- apps/web/app/dashboard/nckh/page.tsx
- apps/web/app/dashboard/nckh/forms/[formId]/page.tsx
- apps/web/app/dashboard/nckh/forms/[formId]/_helpers.ts
- apps/web/app/dashboard/nckh/forms/[formId]/_components/dataset-preview.tsx
- apps/web/tests/fah-err-nckh-errors.test.cjs
- apps/web/tests/fah-err-nckh-errors.spec.ts

Before/after byte snapshots and SHA256 manifests accompany production.diff; test files are new and full snapshots are included.

## Validation performed

- Runtime owner reported valid pre-fix RED7: all 7 expected assertion failures, zero TypeErrors, zero source drift, exit1. Evidence ../runtime/nckh-ui-red7/{test.log,verification.json,source-hashes-before.json,runner-result.json}. Writer did not run tests.
- Verified static git diff --check scoped to owned production/test paths, exit0.
- Verified scoped Impeccable mechanical detector once, exit0, empty findings [].
- Self-review checked full owned diff and frozen shared ApiError/Google discriminator consumers. Self-review is not independent review.

## Validation not performed / limitations

GREEN, lint/build/auth regressions, browser tests and real runtime/API/SQL smoke: Not run by writer; sole runtime owner executes. Node harness exercises real AST-extracted callbacks/helpers/ApiError/component with external fetch/JSX boundaries; it does not establish browser or API/SQL behavior. 7 pre-fix regressions plus 2 supplemental guards = 9 Node cases. Four browser cases use fully mocked APIs and synthetic User; no real provider or DB assertions. The browser A/B case supplements the deterministic Node completion-order test.

## Risks / Deferred items

All six reads must be current and successful before data-dependent model actions are enabled; unrelated successful slices remain readable. This is a conservative local UI validity gate, not a new business lifecycle. Exact server detail is intentionally unavailable from shared ApiError, so status/path guidance stays contextual without inferring a cause such as stale data or duplicate relation. Independent review and runtime gates remain outstanding. Existing unrelated dirty/ignored DB-sync work and evidence preserved.

## Next recommended step

Runtime owner: cwd apps/web, node --test tests/fah-err-nckh-errors.test.cjs; then scoped lint/build/auth and owned restarted Next target browser tests tests/fah-err-nckh-errors.spec.ts plus existing nckh.spec.ts/nckh-delete-model.spec.ts. Check chunks/hydration/network/logs and use only controlled fixtures. Record source hashes and outcomes; send any errors back before fresh snapshot/re-review. No finding marked Done, integrated or released here.
