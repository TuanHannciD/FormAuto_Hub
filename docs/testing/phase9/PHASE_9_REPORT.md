# Phase 9 Report - Full-stack real-user debug and smoke validation

## Scope

Phase 9 was executed as a validation/debug pass across backend API, frontend UI, real Google Form workflow, credit ledger, submission flow, and PayOS top-up.

This report does not approve bug fixes or new feature work.

## Environment

- API URL: `http://localhost:5235`
- Web URL: `http://localhost:3000`
- Database: SQL Server `FormAutoHub` on `localhost`
- Google Form test URL: `https://docs.google.com/forms/d/e/1FAIpQLSeNXy2Qycx9Dz2Rym8-Aqx4poqc_4fGLCPPFyTEKkJxa2VBtg/viewform?usp=header`
- PayOS package: `Smoke Starter`, 100 credits, 2,000 VND
- Test user: `phase9.user.20260521032537@example.com`

## Build And Static Validation

| Area | Status | Evidence |
|---|---|---|
| Backend build | OK | `dotnet build FormAutoHub.sln -c Release` passed |
| Backend tests | OK | `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build` passed: 40/40 |
| Frontend lint | OK | `npm run lint` passed |
| Frontend build | OK | `npm run build` passed |
| EF migrations | OK | migration list succeeded; no pending model changes |

## Runtime API Smoke

| Area | Status | Evidence |
|---|---|---|
| API restart | OK | API restarted and listened on `5235` |
| OpenAPI | OK | `GET /openapi/v1.json` returned HTTP 200 |
| Register/login | OK | real user registered and logged in |
| Starting credit | OK | new user received 5 credits and `InitialGrant` ledger entry |
| Dashboard summary | OK | balance/deposited/used values returned correctly |
| Profile | OK | `GET /api/profile` returned current user |
| Active packages | OK | active package `Smoke Starter` returned with price 2,000 VND |
| Usage logs | OK | analysis, preview, rejected submit, and successful submit logs written |
| Credit transactions | OK | preview deduction and PayOS top-up ledger entries written |
| Normal user admin API guard | OK | normal user received HTTP 403 on admin revenue API |

## Real Google Form Workflow

| Area | Status | Evidence |
|---|---|---|
| Analyze approved Google Form | OK | status `Analyzed`, 15 questions detected |
| Question detection | OK | checkbox, dropdown, paragraph, linear scale, rating, grid, multiple choice, date, time, short text detected |
| Answer rules | OK | 15 answer rules created for detected questions |
| Generate preview | OK | 3 preview responses generated |
| Credit deduction | OK | balance changed from 5 to 2; `CreditUsed` ledger amount -3 |
| Failed preview count 0 | OK | rejected with HTTP 400 |
| Failed preview count 101 | OK | rejected with HTTP 400 |
| Insufficient credit preview | OK | rejected with HTTP 400 |
| Submit without confirmation | OK | rejected with HTTP 400 and failed usage log |
| Confirmed submission | OK | 1 preview submitted successfully to the approved Google Form |
| Submission logs | OK | submission job completed with 1 success, 0 failed |

## Frontend Playwright Smoke

Evidence files are stored in this folder as screenshots and `playwright-smoke-report.json`.

Admin evidence files are stored in the same folder as screenshots and `playwright-admin-smoke-report.json`.

| Area | Status | Evidence |
|---|---|---|
| Web restart | OK | web dev server restarted and listened on `3000` |
| Initial stale static chunks | P2 Medium | before restart, Next dev served stale chunk URLs as 404 and login did not hydrate/navigate |
| Desktop dashboard route | OK | screenshot `dashboard-desktop.png` |
| Desktop forms route | OK | screenshot `dashboard_forms-desktop.png` |
| Desktop top-up route | OK | screenshot `dashboard_top-up-desktop.png` |
| Desktop profile route | OK | screenshot `dashboard_profile-desktop.png` |
| Desktop usage logs route | OK | screenshot `dashboard_usage-logs-desktop.png` |
| Desktop credit transactions route | OK | screenshot `dashboard_credit-transactions-desktop.png` |
| Desktop admin guard | OK | screenshot `admin-guard-desktop.png` |
| Mobile dashboard route | OK | screenshot `dashboard-mobile.png` |
| Mobile forms route | OK | screenshot `dashboard_forms-mobile.png` |
| Mobile top-up route | OK | screenshot `dashboard_top-up-mobile.png` |
| Mobile profile route | OK | screenshot `dashboard_profile-mobile.png` |
| Mobile usage logs route | OK | screenshot `dashboard_usage-logs-mobile.png` |
| Mobile credit transactions route | OK | screenshot `dashboard_credit-transactions-mobile.png` |
| Mobile admin guard | OK | screenshot `admin-guard-mobile.png` |
| Browser console after restart | OK | no console errors in final Playwright run |
| Desktop admin pages | OK | screenshots `admin-desktop.png`, `admin_payments-desktop.png`, `admin_revenue-desktop.png`, `admin_packages-desktop.png`, `admin_payos-settings-desktop.png` |
| Mobile admin pages | OK | screenshots `admin-mobile.png`, `admin_payments-mobile.png`, `admin_revenue-mobile.png`, `admin_packages-mobile.png`, `admin_payos-settings-mobile.png` |

## PayOS Payment Verification

| Area | Status | Evidence |
|---|---|---|
| PayOS settings | OK | enabled, has client id, API key, checksum key, return URL, cancel URL |
| Payment link creation | OK | top-up order `ea7773b5-0157-4e7b-936d-9986400c2bc0`; payment link id `20ad0b4e830d461d8690de159bbac7d9` |
| User real payment | OK | user confirmed payment completed |
| Webhook received | OK | `PaymentRecord.ProviderStatus = Paid`; `CompletedAt` and `LastWebhookAt` set |
| Top-up order state | OK | `TopupOrders.Status = Approved`; `PaidAt` and `ApprovedAt` set |
| Credit grant | OK | user balance became 102; total deposited became 105; total used remained 3 |
| Ledger discipline | OK | exactly 1 `TopupApproved` ledger row for this top-up order, amount +100 |
| Webhook idempotency | OK | replaying the stored PayOS webhook returned `applied=false`, `Webhook đã được xử lý trước đó.`; ledger row count stayed 1 |

## Admin Verification

| Area | Status | Evidence |
|---|---|---|
| Normal user admin UI guard | OK | Playwright desktop/mobile shows no-admin guard |
| Normal user admin API guard | OK | HTTP 403 |
| Admin real-session API | OK | `admin@formauto.local` login passed with role `Admin`; revenue, payments, PayOS settings, and packages APIs returned data |
| Admin real-session UI | OK | Playwright desktop/mobile smoke passed for `/admin`, `/admin/payments`, `/admin/revenue`, `/admin/packages`, and `/admin/payos-settings` |
| Admin PayOS settings masking | OK | API returned `hasApiKey=true`, `hasChecksumKey=true`, masked previews only; raw secrets were not returned |
| Admin reporting data consistency | OK by DB | approved top-up/payment/ledger rows are present and internally consistent |

## Findings

### P2 Medium - Next dev server stale static chunks after prior running process

- Area: frontend runtime/hydration
- Impact: browser login could not navigate because required Next chunks returned 404.
- Reproduction: use the already-running web dev server after earlier build/runtime changes; open `/login` with Playwright.
- Expected: `_next/static/chunks/main-app.js` and `app-pages-internals.js` load successfully.
- Actual: those chunks returned 404 before web restart.
- Evidence: first Playwright run recorded 404 requests for `/_next/static/chunks/main-app.js` and `/_next/static/chunks/app-pages-internals.js`.
- Current state: passed after restarting the web dev server.
- Recommended next action: treat web restart as mandatory before browser smoke; consider cleaning stale `.next` output when chunk 404 appears.

### P3 Low - Test automation locator ambiguity

- Area: Playwright test implementation
- Impact: `getByRole('button', { name: 'Đăng nhập' })` matched both `Đăng nhập` and `Đăng nhập với Google`.
- Reproduction: use non-exact Playwright locator on login page.
- Expected: test selects the email/password submit button.
- Actual: strict mode violation.
- Current state: test corrected to `exact: true`.
- Recommended next action: keep exact accessible-name locators for auth buttons.

## Blocked / Not Run

- A full 100-response browser submission was not run to avoid unnecessary real submissions during this checkpoint pass.
- Admin PayOS settings save/check mutation was not run because changing live payment settings was outside the Phase 9 verification need after the settings were already verified as enabled and complete.

## Closeout

Phase 9 found no P0 or P1 blocker in the tested user/payment/form/admin workflow.

The main operational risk found was stale Next dev chunks before web restart. After restart, Playwright UI smoke passed on desktop and mobile.

The PayOS real payment path completed successfully: payment link creation, user payment, webhook verification, order approval, credit grant, ledger write, and idempotency replay all passed.

Admin API and UI verification later completed successfully after the admin credential was provided.
