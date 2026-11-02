# FAH-HOME-001 — Homepage scroll performance and compact layout

## Scope and authorization

- 2026-11-02: user reported public homepage scroll jank on PC/mobile at https://formautohub.servertun.pp.ua/ and approved the proposed rendering fix and compact refinement twice with “Approved”.
- Base: `e380abf08c031fe2e4e7d305f9933370fe830398`; initially clean tracked workspace, branch `main`. Implementation integrated locally on `main` as `019493a8c3238e5ab25daaca995921a3051a8989`. Existing ignored resources preserved.
- Approved zones: homepage, narrowly scoped global CSS, relevant regression tests/config and paired task evidence. No API, DB, payment, auth, submission behavior, release or remote changes.
- Root owns writes, build, runtime and browser. Independent read-only reviewer: `homepage_review`, `gpt-6.1-sol`, reasoning `medium`, live catalog checked. No child dispatch by reviewer. No Astra used.

## Implemented

- Keep Server Component, metadata, JSON-LD, prices and existing route/anchor links.
- Homepage-only `.landing-page` override: one non-fixed gradient, no generated full-document pseudo-element overlays. Other aura consumers retain existing CSS.
- Remove blur from large sections; retain sticky header blur. Smaller desktop float movement, no mobile float; reduced-motion check passes.
- Merge separate benefit/control sections into existing service/CTA copy. Workflow now precedes services and pricing. Reduce illustration, heading, spacing and card minima; simplify credit conversion row. FAQ retains all five entries.
- Files: `apps/web/app/page.tsx`, `apps/web/app/globals.css`, `apps/web/playwright.homepage.config.ts`, `apps/web/tests/homepage-compact.spec.ts`, paired task records and `artifacts/reports/homepage-compact/` evidence.

## Validation — 2026-11-02

Commands below run from `apps/web` unless stated otherwise.

- Verified: baseline regression fails for page height: 1280px desktop 5,466px; 390px mobile 8,670px; 320px mobile 9,177px. First mobile run also used an incorrect locator targeting the sr-only span; corrected to its native summary, then confirmed 390px fails only the expected height requirement (`red-confirm/`).
- Verified: `npm run build` exit 0, static homepage 166 B, First Load JS 106 kB. `npm run lint` exit 0. Existing ref-cleanup warnings in account-profile/security panels, outdated Browserslist data and Next lint deprecation remain out of scope.
- Verified: fresh owned production server `node node_modules/next/dist/bin/next start -p 3035`, exec session `32794`; no web listener on 3035 before startup. The npm wrapper initially swallowed `-p` and exited without starting; direct Next CLI succeeded.
- Verified: `npx playwright test -c playwright.homepage.config.ts --output=../../artifacts/reports/homepage-compact/green-final`: 3/3. Covers 1280/390/320, CTA viewport/44px target, retained pricing/sections, FAQ interaction, mobile menu, no horizontal overflow, no page errors/failed chunks, repaint guards and mobile/reduced-motion animation.
- Failed configuration attempt: initial SEO suite expected production canonical origin while the existing ignored local build configuration specifies `http://localhost:3020`: 8 failed, 18 passed (`seo/`). No SEO source was changed to accommodate this.
- Verified corrected local-origin suite: `$env:SEO_TEST_BASE_URL='http://localhost:3035'; $env:SEO_EXPECTED_ORIGIN='http://localhost:3020'; npx playwright test -c playwright.seo.config.ts --output=../../artifacts/reports/homepage-compact/seo-local-origin`: 26/26, including metadata, JSON-LD, no-JS readability, hydration/chunks, discovery and utility/private noindex HTML. This is local configuration validation, not production SEO release validation.
- Verified: T3 browser desktop/mobile hero and lower-page screenshots inspected; content readable, prices and navigation retained. `node .agents/skills/impeccable/scripts/detect.mjs --json apps/web/app/page.tsx apps/web/app/globals.css` from root: `[]`, exit 0. `git diff --check`: no errors after EOF cleanup.
- Verified: independent static code review found no blocking production issues. Suggested rendering/animation regression guards were added and passed. Review does not represent independent visual/runtime review.

## Measured behavior

T3 Chromium, 3-second normalized full-page rAF scroll after fonts ready, no CPU throttling. Viewport emulation is not a physical mobile device.

- Desktop 1280×800: 5,466 → 3,367px, 38.4% shorter. Baseline average frame gap 86.7ms/p95 150ms; local average 16.8ms/p95 16.8ms, zero frames over 34ms in final run.
- Mobile viewport 390×844: 8,670 → 6,014px, 30.6% shorter. Baseline average 31.4ms/p95 50ms; local average 16.7ms/p95 16.7ms, zero frames over 34ms.
- Causal control on the same compact desktop layout: temporarily restoring the original multi-gradient fixed background/overlay painting and section blur regressed average frame gap to 81.1ms/p95 166.7ms; removing the temporary override restored 16.8ms/p95 16.8ms. Override removed after measurement. This controls for the shorter scroll distance of the compact layout.
- Raw measurements: `artifacts/reports/homepage-compact/scroll-measurements.json`. Probe changes are tab-local, never deployed. Earlier investigation's “60 FPS after disabling both backgrounds” shorthand was incomplete: that variant also disabled section/header blur.

## Limits, resources and next step

- Not run: physical PC/mobile device tests, Safari/Firefox, throttled low-end GPU, field Core Web Vitals and full authenticated/API test suites; changes are public presentation only.
- Verified: local implementation commit. Not run: push, deployment or post-deploy smoke; user owns push/deploy. Production remains unchanged. No claim of universal 60 FPS or release readiness.
- Existing generic homepage copy about preview in Option 1 predates this change; no business behavior changed. Any wider copy/contract audit is Deferred.
- Verified cleanup: original owned server PID 39728 and final build server PID 38728 stopped after identity verification; no listener on 3035 and no matching owned server process. No API/DB process started. Preserve human-controlled browser tabs and unrelated/ignored resources.
- Next: user pushes/deploys when ready, builds with production environment, then verifies public chunks/SEO and scroll performance on actual PC/mobile.

## Local closeout

- Status: **Closed locally — implemented, reviewed and integrated; release pending user action.** User requested full clean closeout and local merge, retaining push/deploy ownership.
- Since changes were already on `main`, integration is a direct scoped local commit, not a fabricated branch merge. No pull/push/deploy or unrelated branch/worktree cleanup.
- Fresh closeout: lint exit 0; build exit 0; after restarting the new build, homepage 3/3 and SEO 26/26 passed (`postbuild-homepage/`, `postbuild-seo/`). Existing warnings and physical-device/cross-browser/field-test limitations above remain unchanged.
- Code/test/evidence commit: `019493a8c3238e5ab25daaca995921a3051a8989`; paired closeout documentation is committed separately. No product changes after those tests.
- Curated `validation.json`, measurements and diagnostic probe are tracked. Raw Playwright run subdirectories remain preserved locally and ignored via the task-local `.gitignore`; no failure evidence deleted. No credentials detected in scanned text evidence.
- Final Git working-tree cleanliness is checked after the documentation commit and reported in the conversation. This closes the local task without asserting a production release.
