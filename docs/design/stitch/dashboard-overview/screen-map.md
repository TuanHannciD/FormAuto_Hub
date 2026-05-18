# Dashboard Overview Screen Map

## Purpose

Authenticated overview page for Phase 2 account and credit management.

The page gives users a quick operational view of credit balance, top-up request status, recent usage logs, and safe next workflow actions.

## Main Areas

- App shell: left sidebar and top app bar.
- Safety strip: reminds users that preview and confirmation are required before submission.
- KPI row: current credits, total loaded credits, total used credits, pending top-up requests.
- Next actions: add Google Form URL, configure answer rules, preview responses.
- Recent top-up orders: request code, credit package, amount, status, created date.
- Recent usage logs: time, action, form, credits used, result.
- MVP safety rules: no auto-submit without confirmation, 1-5 response limit, credit usage logging, no spam/proxy/captcha bypass support.

## Implementation Notes

- Use this screen as a layout and copy reference for the future Next.js dashboard.
- Keep the shadcn/ui-style dashboard pattern: sidebar, cards, tables, badges, compact controls.
- Use Vietnamese copy with proper diacritics.
- Do not treat sample numbers, names, or table rows as seed data or contract truth.
- Do not add payment gateway checkout UI from this screen. Payment gateway integration is deferred.
- Do not present Google OAuth, official Google Forms API, or AI answer generation as production-complete.

## Phase Alignment

This design fits Phase 2 because it focuses on account and credit management visibility.

Form project, answer rule, response preview, and submission actions are shown only as navigation or future workflow entry points. Implementation must check the active roadmap before building those flows.
