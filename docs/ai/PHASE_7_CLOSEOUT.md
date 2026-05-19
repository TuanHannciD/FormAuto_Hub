# PHASE_7_CLOSEOUT

## Purpose

Close Phase 7 authentication and account access implementation.

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
