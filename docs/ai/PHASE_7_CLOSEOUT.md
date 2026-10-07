# PHASE_7_CLOSEOUT

## Purpose

Close Phase 7 authentication and account access implementation.

The original closeout validation, Not Run items, and Deferred list below record the Phase 7 baseline at that time. The dated follow-up section records the later session fix; it does not reopen Phase 7, select a new phase, or override approvals recorded for later phases.

## Session-expiry follow-up — 2026-10-07

Implementation: `54502eb` (`fix(auth): prevent expiry redirects and concurrent refresh session loss`). This frontend repair changes no backend API, schema, token lifetime, or refresh-token rotation rule.

### Corrected behavior

- Login redirects to dashboard only when the stored session's refresh expiry is still usable. It clears expired stored data instead of bouncing between login and dashboard.
- Login owns the session-expired toast, uses a stable toast ID, and removes the `reason=session-expired` query after handling it. Shared `showError` suppresses `SessionExpiredError` so parallel page requests do not add the same expiry notification.
- Parallel requests in one page share the in-flight refresh promise. When the browser exposes the Web Locks API, tabs on the same origin also serialize refresh and re-read the current session before sending. Without Web Locks, coordination is limited to the page.
- A late HTTP 401 for an old access token reuses the current rotated session. An old refresh response cannot overwrite or clear a different login saved while it was pending.
- An expired refresh timestamp or HTTP 401 from refresh ends the session. Network errors and non-401 refresh failures, including HTTP 503, propagate as request errors without clearing the stored session.
- Authenticated JSON and blob requests retry after refresh at most once. Dashboard and admin guards stop rendering protected children when no usable session remains; both observe session-change events.

### Follow-up validation

Verified in local validation for this repair:

- `npm run test:auth` in `apps/web`: 5/5 tests passed, covering parallel refresh, late 401 reuse, network/503 preservation, rejected refresh, stale response versus a newer login, and expired stored sessions.
- `tests/auth-session.spec.ts`: 2/2 Playwright tests passed against the restarted local web app on port 3020 using Edge. These use fixture sessions and intercepted API responses to verify one expiry toast without a redirect loop and one refresh for parallel dashboard requests.
- Additional browser smoke with intercepted API responses: expired session, parallel refresh, invalid refresh, HTTP 503, and network failure all passed; no browser runtime errors or failed JS/CSS chunks were observed.
- Real local API smoke using a temporary refresh-session row: refresh HTTP 200, authenticated dashboard HTTP 200, and reuse of the rotated old refresh token HTTP 401. Temporary smoke rows were removed. This did not exercise password/Google login.
- Web lint and production build passed. Runtime web logs inspected after smoke had no error markers.

Blocked: standalone `tsc --noEmit` reported existing nullability errors in `tests/nckh.spec.ts:742-743`, outside the repair. The passing Next.js build is reported separately and does not erase that result.

Not run: production deployment/smoke of this fix, live user session reproduction on production, password/Google login for this follow-up, and a browser regression test with multiple tabs. Web Locks handling exists in code but multi-tab behavior is not claimed as verified.

## Scope Completed

- Email/password registration.
- Registration returns JWT immediately.
- New users receive 5 starting credits.
- Starting credits are recorded in `CreditTransactions` with type `InitialGrant`.
- Email/password login.
- JWT access tokens.
- Refresh token/session storage in `RefreshTokens`.
- Access token expiry: 1 hour.
- Refresh token expiry: 7 days.
- Logout revokes only the current refresh token/session.
- Lockout after 5 failed login attempts for 15 minutes.
- Google identity login/register without Google Forms API scopes.
- Google account linking requires a verified email and password-login-first flow for existing password accounts.
- Profile password change now verifies the current password instead of comparing temporary password hashes.
- Existing app APIs are protected with JWT authorization.
- Next.js frontend auth routes are implemented for login, register, auth callback, and profile security.
- Frontend API calls now use `Authorization: Bearer <accessToken>` instead of the MVP demo user header.
- Dashboard routes now guard unauthenticated users and redirect to login.
- Frontend refresh token handling rotates expired access-token sessions before retrying API calls.
- Frontend logout revokes the current refresh token/session and clears local session state.

## Implemented API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/link-google`
- `PUT /api/profile/change-password`

## Implemented Persistence

- Added `RefreshTokens`.
- Added `UserExternalLogins`.
- Added `Users.FailedLoginCount`.
- Added `Users.LockoutUntil`.
- Made `Users.PasswordHash` nullable for Google-only users.
- Added unique index on `Users.Email`.
- Added unique index on `RefreshTokens.TokenHash`.
- Added unique index on `UserExternalLogins.Provider` + `UserExternalLogins.ProviderUserId`.
- EF Core migration: `Phase7Authentication`.

## Validation

Verified:

- `dotnet build src/FormAutoHub.Api/FormAutoHub.Api.csproj`
- `dotnet build FormAutoHub.sln`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj`
- `npm run lint` in `apps/web`
- `npm run build` in `apps/web`
- `dotnet-ef migrations script --idempotent`
- `dotnet-ef database update` against a temporary LocalDB database
- API smoke against temporary LocalDB: register -> starting credit 5 -> bearer dashboard summary -> change password -> logout current session
- temporary LocalDB database was dropped after validation

## Not Run

- Live Google identity login against a real Google client.
- Browser UI smoke test with Playwright or a real browser.
- Production database migration apply.

## Deferred

- Password recovery email flow.
- Official Google Forms API scopes.
- Google Forms watches.
- Webhooks.
- Background jobs.
- Payment gateway.
- AI mapping/generation.

## Notes

- Google identity verification requires `Auth:GoogleClientId` to be configured.
- `Auth:SigningKey` in appsettings is a development placeholder and must be replaced by environment-specific secret configuration before production.
- Existing temporary header user context remains only as fallback behavior in the context class; HTTP controllers now require JWT authorization.
- Google buttons currently route to the approved unavailable/callback state unless a real Google Identity client flow provides an `id_token`.
