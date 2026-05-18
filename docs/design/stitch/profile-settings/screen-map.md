# Profile Settings Screen Map

## Purpose

Authenticated profile/account settings page for `/dashboard/profile`.

The page helps users manage personal profile data, password/security settings, notifications, and UI preferences.

## Main Areas

- App shell: left sidebar and top app bar.
- Safety strip: account settings do not bypass safety limits.
- Page header: title, save/cancel actions, account type badge.
- Profile summary:
  - avatar initials
  - name
  - email
  - role
  - credit balance
  - last active
  - account status
- Settings tabs:
  - personal information
  - security
  - notifications
  - interface preferences
- Personal information form.
- Password/security card.
- Session list.
- Notification preferences.
- Interface preferences.

## Implementation Notes

- Use this screen as the primary UI reference for profile/account settings.
- Treat sample names, emails, phone numbers, organization names, sessions, and settings as placeholder UI data only.
- Do not expose admin user management from this screen.
- Do not implement Google OAuth based only on the muted Deferred callout.

## Phase Alignment

This reference maps to the Phase 5 profile page and Phase 2 account management behavior.

Google OAuth, admin user management, billing, and payment gateway settings remain Deferred unless explicitly approved.
