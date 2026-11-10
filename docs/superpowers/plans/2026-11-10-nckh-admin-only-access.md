# NCKH Admin-Only Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing NCKH module visible and usable only by Admin users in both UI and API.

**Architecture:** Enforce authorization at every NCKH controller with the existing JWT `Admin` role, while adding client-side guards that hide navigation and redirect direct non-Admin NCKH routes. No route or contract redesign is introduced.

**Tech Stack:** ASP.NET Core .NET 9, JWT role authorization, Next.js dashboard, existing app session storage, existing test suites.

**Spec:** `docs/superpowers/specs/2026-11-10-nckh-admin-only-design.md`

## Global Constraints

- Use only the existing role value `Admin`; do not invent permissions or roles.
- API semantics are `401` for unauthenticated and `403` for authenticated non-Admin callers.
- Preserve all NCKH routes, DTOs, entities, data, and Admin behavior.
- Do not change unrelated dashboard or auth behavior.
- Subagents must use the Sol model family, at most `gpt-6.1-sol`, with reasoning no higher than `high`.

## Review Focus

- A controller missed by the role attribute would leave an API bypass; enumerate every NCKH controller and test representative endpoints.
- Client-only hiding must not be treated as security; verify a non-Admin API call returns `403`.
- Direct navigation to nested and callback NCKH routes must redirect for User sessions.
- Missing or malformed session state must not expose NCKH UI.
- Admin navigation and an existing NCKH page must remain usable.

### Task 1: Enforce Admin-only NCKH access

**Files:**
- Modify: all controllers under `src/FormAutoHub.Api/Controllers/Nckh/` to require the existing `Admin` role.
- Modify: `apps/web/components/dashboard-shell.tsx` and the NCKH route pages/components as needed for role-aware visibility and redirects.
- Test: existing API/UI NCKH test locations, adding focused regression tests without changing unrelated fixtures.

**Interfaces:**
- Consumes: existing JWT `role` claim, `session.role`, existing NCKH routes and API client.
- Produces: server-side `Admin` authorization for all NCKH actions; non-Admin UI redirect to `/dashboard`; unchanged Admin rendering.

- [ ] **Step 1: Add or update failing regression tests** for unauthenticated `401`, authenticated User `403`, Admin success on representative NCKH API endpoints, hidden navigation, direct route redirect, callback redirect, and Admin page access.
- [ ] **Step 2: Run the focused tests** and confirm they fail for the current `[Authorize]`/UI behavior.
- [ ] **Step 3: Apply the existing `Admin` role authorization to every NCKH controller** without changing action routes or contracts.
- [ ] **Step 4: Add the smallest shared UI guard** so only Admin sessions render NCKH navigation/pages; redirect missing/non-Admin sessions from dashboard NCKH routes and callback to `/dashboard`.
- [ ] **Step 5: Run focused backend and frontend tests**, then run the relevant build/type checks.
- [ ] **Step 6: Report changed files, test commands, and any runtime checks not possible; commit the implementation.**

### Task 2: Independent review

**Files:** Review Task 1 diff and tests; modify only if a review finding requires a fix through the implementer.

- [ ] **Step 1:** Verify every NCKH controller is covered and role semantics are preserved.
- [ ] **Step 2:** Verify UI guards cannot be bypassed by direct URLs and do not alter Admin behavior.
- [ ] **Step 3:** Verify tests meaningfully cover `401`, `403`, Admin success, navigation hiding, nested route redirect, and callback redirect.
- [ ] **Step 4:** Return a verdict with Critical/Important/Minor findings and exact file references.

## Verification

Run the focused .NET tests, focused Next.js tests, frontend type/build checks, and applicable local runtime smoke with Admin/User sessions if the environment is available. Report each check as `Verified`, `Failed`, `Not run`, or `Blocked`.
