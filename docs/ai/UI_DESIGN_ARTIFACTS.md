# UI_DESIGN_ARTIFACTS

## Purpose

Track generated UI design references for FormAuto Hub.

This file helps future frontend tasks find the approved Stitch artifacts before implementing or reviewing UI.

Design artifacts are not production source code, API contracts, database contracts, lifecycle rules, or roadmap approval.

## Current Stitch Project

- Stitch project: `14663165630678165146`
- Design system: `Precision Operational System`
- Design system asset: `assets/809a13b0223c4381a9ea7ede2848bb3e`
- Language baseline: Vietnamese for app UI.
- Visual baseline: shadcn/ui-style SaaS operations dashboard, Tailwind-friendly layout, lucide-style icons, compact B2B workflow UI.

## Approved Reference Screens

| Area | Stitch screen | Local artifact folder | Status |
|---|---|---|---|
| Logo system | `0a7924f70c20477b947be9d2aec41132` | `docs/design/stitch/logo/` | Reference accepted |
| Landing page | `d3e788788e384090945b7542ab7aecf8` | `docs/design/stitch/landing-page/` | Reference accepted |
| Dashboard overview | `e3b29c6ac6ea41a5979c98d174ac5c21` | `docs/design/stitch/dashboard-overview/` | Reference accepted |
| Top-up request | `a15b597f9b6745199ac4b09a60f4083d` | `docs/design/stitch/top-up-request/` | Reference accepted |
| Usage logs | `d336e4a9bd354d70b6961881aa106051` | `docs/design/stitch/usage-logs/` | Reference accepted after refinement |
| Form automation workflow | `888a52f035074b7992aa86b87a0f8084` | `docs/design/stitch/form-automation-workflow/` | Reference accepted |
| Credit transactions ledger | `8f55ef6bf6ba4941b6cc616c04c5104c` | `docs/design/stitch/credit-transactions/` | Reference accepted |
| Profile/account settings | `6ecbf4df5fd945d78d94df8f7d23a153` | `docs/design/stitch/profile-settings/` | Reference accepted |
| Top-up order detail | `e0811bb411004578ac20dc13f990e7ac` | `docs/design/stitch/top-up-order-detail/` | Reference accepted |
| Login | `5235dbc4313a48098e4743be671a26a3` | `docs/design/stitch/login/` | Reference accepted after refinement |
| Register | `29b9ee6f2389428aa1490f91aa9de4bf` | `docs/design/stitch/register/` | Reference accepted after refinement |
| Auth callback | `e014f45ea68145cb9cfb5ab1821bc175` | `docs/design/stitch/auth-callback/` | Reference accepted after refinement |
| Profile security | `5e5335a5b7c94b4094d850ec0c03636e` | `docs/design/stitch/profile-security/` | Reference accepted |
| Admin shell and guard | `89e61445e68a4641892aa0e69390b13a` | `docs/design/stitch/admin-shell/` | Phase 8 reference accepted after style alignment |
| Admin dashboard | `20fba37f2d074d719e9993dd877ef3db` | `docs/design/stitch/admin-dashboard/` | Phase 8 reference accepted after style alignment |
| Admin top-up/payment management | `fa8dd85bfff8427b87da20bbf81ffc5f` | `docs/design/stitch/admin-topup-payment-management/` | Phase 8 reference accepted after final style alignment |
| Revenue report | `c6a382d9b211470aa88af8eea3a5beca` | `docs/design/stitch/revenue-report/` | Phase 8 reference accepted after style alignment |
| PayOS settings | `db5f29fe3de7425db428edc29931e139` | `docs/design/stitch/payos-settings/` | Phase 8 reference accepted after style alignment |
| User PayOS top-up flow | `830150eb380a44ba8c49ddb3f8337f73` | `docs/design/stitch/user-topup-payos-flow/` | Phase 8 reference accepted after final style alignment |
| Payment result / return | `12cc4ac68fae458999031cd0c184563b` | `docs/design/stitch/payment-result-return/` | Phase 8 reference accepted after final style alignment |

## Artifact Folder Standard

Each screen folder should contain:

- `README.md`
- `screen-map.md`
- `notes.md` when review or iteration notes exist
- `screenshots/<page-slug>-vi.png`
- `exports/<page-slug>-vi.html`

Use screenshots as the primary visual reference.

Use HTML exports only for layout inspection. Do not copy generated HTML directly into production without adapting it to the approved Next.js, shadcn/ui, and Tailwind stack.

## Implementation Rules

Before implementing a frontend page from a Stitch design:

1. Read `docs/ai/FRONTEND_STYLE_GUIDE.md`.
2. Read this file.
3. Read the target screen folder `README.md`, `screen-map.md`, and `notes.md` if present.
4. Check current API/DTO/domain docs before binding UI fields to backend data.
5. Treat sample rows, sample IDs, sample dates, labels, statuses, and numbers as placeholder UI data unless backend contracts already confirm them.
6. Preserve the active phase scope and safety rules.

## Deferred Items To Keep Out

Do not implement from UI artifacts unless separately approved:

- payment providers other than PayOS
- frontend-only credit updates
- production Google OAuth implementation
- official Google Forms API production flow
- AI answer generation as production-complete
- AI auto-submit
- package management UI
- admin user management UI
- manual credit adjustment UI

## Current UI Coverage

Current generated coverage supports:

- brand logo system reference
- public landing reference
- authenticated dashboard overview
- manual top-up request
- usage log history and safety/audit review
- form automation workflow
- credit transactions ledger
- profile/account settings
- top-up order detail
- login and lockout/auth-error states
- register
- auth callback
- profile security
- Phase 8 admin shell and guard state
- Phase 8 admin dashboard
- Phase 8 admin top-up/payment management
- Phase 8 revenue reporting
- Phase 8 PayOS settings
- Phase 8 user PayOS top-up flow
- Phase 8 payment result / return page

Remaining useful references:

- admin top-up approval/rejection only if a separate manual approval scope is approved

Manual admin approval/rejection remains a separate scope decision because Phase 8 PayOS top-up must grant credit only after verified payment handling and ledger write.
