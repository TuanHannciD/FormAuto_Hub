# Homepage cleanup evidence — 2026-11-03

- `before/`: baseline full-page and hero captures at 320/390/768/1024/1440.
- `after/`: final captures from the homepage cleanup regression.
- `verified/`: final post-build runtime captures from the same source.
- `before-after-report.html`: offline comparison with mobile/desktop selector and geometry table.
- `before-geometry.json`, `after-geometry.json`: document width/height, hero height, pricing position and CTA position.
- `baseline-red.log`: intentional RED for the old FAQ copy; not a current failure.
- `regression.log`: 5/5 homepage cleanup and compact checks.
- `runtime-final.log`: 6/6 homepage/shared-elevation checks after build.
- `public-regression.log`: 3/3 existing public CTA/overflow/menu checks.
- `build.log`, `lint.log`, `auth.log`, `detector.json`, `independent-review.md`: supporting gates.

Geometry is local Playwright with synthetic API-aborted public pages and simulated viewports; it is not live integration, physical-device, browser-zoom or screen-reader evidence. Homepage source is committed and merged locally after user approval; no push/deploy was performed.

Merged local: commit cf5fdfc4daadf102f0dc19a3703edf8b3491b53f; merged-build.log exit0, merged-auth.log9/9, merged-browser.log5/5; merged/ frames.
