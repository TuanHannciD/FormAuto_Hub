# Landing Page Design Notes

## Approved Intent

The landing page is intended for SEO, advertising, and explaining FormAuto Hub to users before they enter the app.

The visual direction is clean B2B SaaS with shadcn/ui-inspired dashboard previews, Vietnamese copy, and safety-focused positioning.

## Must Preserve

- Preview before submission.
- User confirmation before any submission action.
- MVP generated response limit of 1 to 5 per action.
- Credit-based usage tracking.
- Usage logs and credit transaction language.
- Manual top-up order approval for MVP.

## Must Not Introduce

- Spam tooling.
- Captcha bypass.
- Proxy rotation.
- Fake accounts.
- Unauthorized form submission.
- Bypassing Google restrictions.
- AI auto-submit.
- Payment gateway as an available MVP feature.
- Google OAuth or official Google Forms API as completed behavior.

## Implementation Notes

- Use the screenshot for visual direction and section hierarchy.
- Use the HTML export only as a layout/reference artifact, not as production code.
- Rebuild production UI using approved frontend stack and repo conventions.
- Before implementing the landing page, verify responsive behavior manually.
- Keep Vietnamese copy readable on mobile; long CTA and badge text may require wrapping or shorter labels.

## Deferred

Deferred: payment gateway integration.

Deferred: Google OAuth and official Google Forms API integration.

Deferred: AI answer generation and AI mapping.

