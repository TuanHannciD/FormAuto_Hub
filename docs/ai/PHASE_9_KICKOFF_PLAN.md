# PHASE_9_KICKOFF_PLAN

## Purpose

Define the kickoff scope for Phase 9: full-stack real-user debugging, deep smoke testing, and defect reporting across API and UI.

## Phase Goal

Run FormAuto Hub as a real user would use it, with real runtime services and approved real test data, to find backend, frontend, integration, data-consistency, and UX defects before selecting the next feature phase.

Phase 9 is a validation and debug phase. It does not approve new product features, new API contracts, new database fields, or new production integrations.

## Confirmed Scope

- Restart and run the real API and web app processes before smoke testing.
- Use a real database target approved for this phase.
- Apply required EF Core migrations before database-backed smoke checks.
- Use Playwright to test real browser UI behavior, hydration, navigation, forms, guards, and visual/layout issues.
- Test backend API behavior with real HTTP requests and correct authenticated user/admin sessions.
- Exercise the core user journey from registration/login through dashboard, form automation, preview, controlled submission, logs, credit ledger, and top-up.
- Exercise admin journeys for overview, payments, revenue, PayOS settings, and credit package management.
- Use the approved Google Form test URL for live form-analysis and workflow smoke:
  `https://docs.google.com/forms/d/e/1FAIpQLSeNXy2Qycx9Dz2Rym8-Aqx4poqc_4fGLCPPFyTEKkJxa2VBtg/viewform?usp=header`
- Create a real PayOS top-up checkout for the approved 2,000 VND package.
- Stop after creating the PayOS payment link and report the payment link to the user.
- Resume final payment verification only after the user confirms that the real payment has been completed.
- Produce a report separating OK items, defects, warnings, blocked checks, and checks not run.

## Real Data Rule

Phase 9 must not replace the real-user workflow with random fake data.

Allowed setup data:

- named test user accounts created through the real registration or approved admin/setup path
- named admin account provided by the user or created through an approved setup path
- approved credit packages, including the 2,000 VND package used for PayOS smoke
- the approved live Google Form test URL
- real PayOS settings already configured by the project owner
- controlled test inputs needed to exercise validation and edge cases

Not allowed:

- bypassing normal app flows by inventing database-only states without documenting them
- claiming a workflow passed from mocked data when real runtime smoke was required
- using unrelated public forms as substitutes without user approval
- granting credit manually to hide a payment or ledger defect

## Actors

- Normal user: registers or logs in, uses dashboard, creates previews, submits controlled responses, and starts PayOS top-up.
- Admin user: reviews reports, payments, revenue, PayOS settings, and credit packages.
- PayOS: external payment provider used for real checkout and post-payment confirmation.
- Google Forms: external public form surface used for live form analysis and controlled submission smoke.

## One-Run Flow

1. Environment preparation
   - install or verify Playwright
   - build backend and frontend
   - apply migrations to the approved test database
   - start or restart API and web app processes
   - record API URL, web URL, database target, and environment notes

2. Real user setup
   - register or log in as a normal user
   - verify JWT/session behavior
   - verify starting credit or current credit state
   - log in as admin for admin-only checks

3. API smoke
   - verify auth endpoints
   - verify dashboard summary
   - verify packages and top-up routes
   - verify profile routes
   - verify form automation routes
   - verify logs and ledger routes
   - verify admin routes with admin and non-admin sessions

4. Playwright UI smoke
   - verify login/register pages
   - verify dashboard routes render, hydrate, and load chunks
   - verify user navigation, forms, validation, and error states
   - verify form automation UI from analysis through preview and confirmation
   - verify admin pages and role guards
   - capture screenshots for defects and layout warnings

5. Live Google Form workflow
   - analyze the approved Google Form URL
   - verify detected questions and supported/unsupported types
   - configure answer rules
   - generate preview
   - verify credit deduction only after successful preview generation
   - verify preview UI and persisted generated responses
   - verify controlled submission with explicit confirmation and safe response count

6. Data consistency checks
   - verify `CreditTransactions` matches balance changes
   - verify `UsageLogs` are written with honest status
   - verify `SubmissionLogs` are written for submission attempts
   - verify top-up order and payment record states remain consistent

7. Admin checks
   - verify admin overview metrics
   - verify revenue report
   - verify payment list
   - verify PayOS settings masking and setup guidance
   - verify package create/update/active-state behavior
   - verify normal users cannot access admin UI or admin APIs

8. PayOS payment checkpoint
   - create a PayOS checkout link for the approved 2,000 VND package
   - stop the run
   - report the payment link to the user
   - wait for user confirmation that real payment is complete

9. Post-payment completion
   - verify webhook/payment confirmation after user payment
   - verify automatic credit grant
   - verify idempotency if a repeated verified event is observed or safely replayable
   - verify admin payment and revenue screens update
   - finalize the Phase 9 report

## Deep Bug-Hunting Matrix

### Auth and session

- register with an existing email
- login with the wrong password until lockout should apply
- refresh expired access token
- logout and attempt to reuse the old session
- normal user attempts admin routes
- admin session expires or refreshes during admin workflow

### Credit and top-up

- insufficient credit blocks preview generation
- failed preview does not deduct credit
- successful preview deducts the correct credit amount
- page reload after top-up order creation
- cancelled or failed payment does not grant credit
- repeated PayOS webhook does not grant duplicate credit
- inactive packages are hidden from normal users
- 2,000 VND package creates the expected PayOS payment link

### Google Form analysis

- approved Google Form URL succeeds or reports a concrete external blocker
- invalid URL fails safely
- non-public form fails safely
- unsupported question types are identified without unsafe behavior
- missing entry IDs are reported honestly
- required fields are handled safely
- mixed question types are analyzed
- repeated analysis of the same form does not corrupt project data

### Answer rules and preview

- response count at 1, 10, and 100
- response count at 0 and 101 rejects
- random percentage totals are invalid when they do not match rules
- random quantity totals are invalid when they do not match response count
- checkbox min/max validation rejects impossible values
- empty, long, and multi-line text samples are handled safely
- reversed date/time ranges reject
- invalid time step rejects
- repeated preview after editing rules updates the intended state
- reload after preview still preserves safe submission behavior

### Submission

- submit before preview rejects
- submit without confirmation rejects
- already-submitted responses cannot be submitted again
- cancel behavior is tested where supported
- partial success or failure is reported honestly
- batch size 10 and total limit 100 are preserved
- no captcha bypass, proxy rotation, fake-account, or unauthorized submission behavior exists

### UI and Playwright

- desktop viewport
- tablet viewport
- mobile viewport
- hydration and static chunks load
- loading, empty, and error states render
- validation messages are visible and understandable
- double-click does not duplicate dangerous actions
- browser back and refresh do not corrupt state
- modal, accordion, and table overflow are checked
- Vietnamese copy does not break layout
- admin/user navigation guards work in UI

### Admin and reporting

- admin overview reflects top-up/payment/credit data
- payment list reflects PayOS states
- revenue report uses verified payment data
- raw PayOS secrets are never shown
- package create/update validation works
- normal user admin API calls are rejected

### Data consistency

- credit balance matches `CreditTransactions`
- usage actions create `UsageLogs`
- submissions create `SubmissionLogs`
- top-up order status matches payment record status
- retry or duplicate events do not create duplicate ledger entries

## Report Format

The Phase 9 report must use these severity labels:

- `P0 Blocker`: app is unusable, payment/credit is wrong, data loss, security bypass, or severe auth/admin exposure
- `P1 High`: core user/admin/payment/form workflow fails
- `P2 Medium`: workflow is impaired but has a workaround
- `P3 Low`: polish, copy, layout, or non-blocking issue
- `OK`: checked and passed
- `Not run`: not executed, with reason
- `Blocked`: could not execute because of credentials, database, external platform, tunnel, payment, or environment

Each finding must include:

- area
- severity
- user-visible impact
- reproduction steps
- expected result
- actual result
- evidence, such as screenshot, HTTP status, response excerpt, console error, or log excerpt
- recommended next action

## Stop Conditions

Stop and report before continuing when:

- a real PayOS payment link is created and user payment is required
- the database target is unclear or unsafe
- admin credentials are unavailable
- PayOS settings are missing or raw secrets would need to be exposed
- the Google Form external surface blocks testing in a way that changes expected behavior
- a P0 issue is found that could corrupt credit, payment, auth, or submission data

## Deferred

- New product features.
- New API contracts.
- New database fields or migrations unless a separate fix task approves them.
- Payment providers other than PayOS.
- Subscription billing.
- Automated refunds.
- Official Google Forms API.
- Google Forms watches or background sync.
- AI mapping/generation.
- Production background job framework.
- Automated bug fixes during the Phase 9 test run unless separately approved.

## Validation Expectations

- Backend build.
- Backend tests.
- Frontend build.
- Frontend lint.
- Playwright browser smoke.
- Real HTTP API smoke.
- Database migration state check.
- Server log and browser console inspection.
- Payment checkpoint and post-payment verification after user confirmation.
