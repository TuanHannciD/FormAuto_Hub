# Screen Map

## Purpose

Reference the admin PayOS configuration page for enabled state, masked settings, configuration checks, and operational safety.

## Main Sections

- Missing-configuration warning.
- PayOS enabled/disabled status.
- Masked configuration fields.
- Configuration check section.
- Safety guidance.
- Recent change history.

## Implementation Notes

- Never display real secrets.
- Keep credentials outside source-controlled configuration.
- Only enable the check button when backend support exists.
- Do not grant credit from unverified PayOS callbacks.

## Phase Alignment

Aligned with Phase 8 slice: PayOS configuration model and environment setup plan.

## Deferred Items To Avoid

- Other payment providers.
- Refund automation.
- Admin user management.
- Manual credit adjustment.
