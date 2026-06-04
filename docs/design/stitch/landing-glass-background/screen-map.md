# Screen Map

## Purpose

Reference design for the long landing-page background used by FormAuto Hub public pages.

## Main Sections

- Light cyan-white base background.
- Long-scroll mesh gradients: cyan and teal near the hero, violet and pink through the middle, faint amber near the bottom.
- Abstract CSS-style details: subtle grid, contour-like lines, diagonal glass ribbons, and soft light streaks.
- Readability check content: small hero, three frosted cards, a long middle section, and final CTA.

## Implementation Notes

- Implement as CSS, not as an image, video, or bitmap texture.
- Keep the strongest abstract treatment scoped to landing `main.app-aura-bg` so operational dashboard surfaces remain calmer.
- Use low-opacity layers; the background should add depth without competing with text or cards.
- Frosted cards should remain readable over the background with translucent white surfaces, light borders, and restrained shadows.

## Phase Alignment

- Public landing-page visual polish only.
- No route, backend, API, payment, auth, credit, Google Forms, or AI behavior is implied by this artifact.

## Deferred Items To Avoid

- Do not introduce new production features through the landing visuals.
- Do not use image/video backgrounds.
- Do not add animation unless explicitly approved later.
- Do not make the background dark, heavy, or distracting.

