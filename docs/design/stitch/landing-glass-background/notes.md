# Implementation Notes

## CSS Direction

- Base: `#f7fbff` with fixed mesh gradients using `radial-gradient` layers.
- Pattern layer: very subtle `repeating-linear-gradient` grid and contour-like light lines.
- Depth layer: diagonal glass ribbons using translucent `linear-gradient` layers in pseudo-elements.
- Scope: `main.app-aura-bg::before` and `main.app-aura-bg::after` for public landing pages.

## Review Notes

- First Stitch generation was readable but too flat.
- Second Stitch edit added glass ribbons, long-scroll mesh rhythm, and low-opacity grid/contour details.
- The implemented CSS keeps the effect deliberately subtle because it sits behind real landing content.

