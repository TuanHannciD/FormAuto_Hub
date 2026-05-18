# Form Automation Workflow Screen Map

## Purpose

Authenticated workflow page for `/dashboard/forms`.

The page shows the controlled path from Google Form URL analysis through detected questions, answer rules, response preview, confirmation, and submission result.

## Main Areas

- App shell: left sidebar and top app bar.
- Page header: workflow title, add form action, history action, preview-required badge.
- Workflow stepper:
  - add URL
  - analyze form
  - review questions
  - configure rules
  - preview responses
  - confirm submit
- Form analysis panel:
  - form name
  - URL field
  - analysis status
  - detected question count
  - supported question types
- Detected questions table.
- Answer rules editor:
  - selected question
  - answer mode segmented control
  - distribution rows
  - validation callout
- Preview panel:
  - response count limited to 1-5
  - preview rows
  - preview action
  - guarded submit message
- Confirmation/result panel:
  - safety checklist
  - controlled confirmation action
  - latest submission result summary
- Safety/audit strip.

## Implementation Notes

- Use this screen as the primary UI reference for the Phase 5 form automation workflow.
- Preserve preview-before-submit as a hard UI constraint.
- Keep generated response count limited to 1-5.
- Treat sample form names, questions, entry IDs, log IDs, and values as placeholder UI data only.
- Check current API/DTO contracts before binding UI data.

## Phase Alignment

This reference maps to the completed Phase 5 frontend dashboard/tool UI and completed Phase 3 form automation MVP behavior.

Google OAuth, official Google Forms API production flow, AI answer generation, and AI auto-submit remain Deferred unless explicitly approved.
