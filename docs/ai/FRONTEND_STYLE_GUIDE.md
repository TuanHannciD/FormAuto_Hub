# FRONTEND_STYLE_GUIDE

## Purpose

Define the approved frontend UI baseline and visual direction for future FormAuto Hub dashboard work.

This file controls UI style only. It does not approve new frontend implementation work by itself.

## Approved UI Baseline

- Frontend framework: Next.js web dashboard.
- UI baseline: shadcn/ui with Tailwind CSS.
- Icon baseline: lucide-react.
- Component direction: use shadcn/ui components and patterns for MVP dashboard/admin UI.

## Product UI Direction

FormAuto Hub should feel like an operational dashboard, not a marketing site.

UI copy must use clear Vietnamese by default. Use English only when it is an unavoidable product, provider, protocol, code, or technical identifier such as PayOS, API, webhook, JWT, URL, or field names.

Use:

- compact but readable layouts
- clear navigation
- tables for history and list-heavy data
- cards for metrics and repeated summaries
- forms for account, profile, top-up, and rule configuration
- dialogs or sheets for focused actions
- badges for statuses and roles
- toasts for short feedback

Avoid:

- landing-page hero sections inside the app
- large marketing gradients
- decorative illustrations that do not support the workflow
- over-designed animations
- card-inside-card layouts
- hidden business actions behind unclear icons

## Layout Rules

- Use a dashboard shell for authenticated app areas.
- Prefer sidebar plus top content header for management pages.
- Keep page content scannable and action-oriented.
- Keep repeated data in tables or compact lists.
- Keep forms grouped by task, not by database table.
- Preserve preview-before-submit flows for form automation UI.
- Do not create frontend pages outside approved phase or task scope.

## Component Rules

Use shadcn/ui-style components for:

- buttons
- inputs
- selects
- checkboxes
- switches
- tabs
- cards
- tables and data tables
- dialogs
- sheets
- dropdown menus
- badges
- alerts
- skeletons
- toasts
- pagination
- breadcrumbs
- sidebar navigation

Do not create custom UI primitives when an approved shadcn/ui component is sufficient.

## Visual Style

- Prefer neutral backgrounds with restrained accent color.
- Use semantic colors for success, warning, destructive, info, and muted states.
- Use consistent spacing from Tailwind CSS scales.
- Use moderate border radius consistent with shadcn/ui defaults.
- Keep typography clear and restrained.
- Do not use hero-scale typography inside dashboard panels.
- Maintain accessible contrast for text, controls, and status badges.

## Data And State UI

Every page with data should define:

- loading state
- empty state
- error state
- success or saved state when applicable
- permission or unavailable state when applicable

For tables and history pages, include:

- clear column names
- status badges
- date/time display
- pagination or explicit limit behavior before production use

## Phase 2 Dashboard Style

Phase 2 account and credit UI should prioritize:

- overview metric cards
- top-up package selection
- top-up order creation and order history
- admin top-up approval/rejection screens only when approved
- usage log and credit transaction tables
- profile and password forms

Payment gateway UI remains Deferred.

Package management UI, admin user management UI, and manual credit adjustment UI remain Deferred unless explicitly approved.

## Generated UI References

Before implementing a page that already has a Stitch-generated design, read:

- `docs/ai/UI_DESIGN_ARTIFACTS.md`
- the matching `docs/design/stitch/<page-slug>/README.md`
- the matching `docs/design/stitch/<page-slug>/screen-map.md`
- the matching `docs/design/stitch/<page-slug>/notes.md` when present

Generated UI artifacts are design references only. They do not approve new frontend implementation scope and do not define API, DTO, database, status, event, or lifecycle contracts.

Use the screenshot as the primary visual reference. Use the HTML export only for layout inspection.

## Frontend Implementation Gate

Before creating frontend files, confirm:

- the task explicitly approves frontend implementation
- the affected page or component is in phase or explicitly approved
- API contracts are approved or clearly marked as temporary
- the UI does not weaken anti-abuse rules
- the UI preserves preview and confirmation requirements where relevant
- the UI copy is Vietnamese-first and avoids unnecessary English labels

## Documentation Sync Rule

Any frontend UI baseline change must update both:

- `docs/ai/FRONTEND_STYLE_GUIDE.md`
- `docs/vi/FRONTEND_STYLE_GUIDE.md`
