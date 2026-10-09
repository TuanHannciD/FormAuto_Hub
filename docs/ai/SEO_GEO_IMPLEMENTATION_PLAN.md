# SEO_GEO_IMPLEMENTATION_PLAN

## Status and authority

- Date: 2026-10-09.
- User approved the three priorities, then implementation, then bilingual documentation sync and a selective local commit. Push/deployment are not authorized by that commit request.
- Status: subsequent user approval authorized implementation. P0 GSC baseline, P1/P2 code and P3 local validation are Verified; public release P4 and outcome observation P5 are Not run.
- This is a scoped post-closeout follow-up, not a new global phase. Existing Phase 9 closeouts remain historical authority.
- Preserve the current accepted UI, routes, CTA destinations and business workflows. Existing dropdown changes and report artifacts are separate work and must be preserved.
- Companion execution/evidence guide: [SEO_GEO_VALIDATION_RUNBOOK.md](SEO_GEO_VALIDATION_RUNBOOK.md).

## Problem and evidence baseline

Observations below were made earlier in this conversation on 2026-10-09; they are snapshots, not continuous monitoring.

| Evidence | Status | Meaning / limitation |
|---|---|---|
| Google `site:formautohub.servertun.pp.ua`, including personalization off | Verified | Homepage appears; at least the homepage is indexed and served |
| Google `site:formautohub.servertun.pp.ua/google-forms/` | Verified | No result in this sample; does not establish that every child URL is unindexed |
| Six target intent queries on Google page one | Verified | App not observed; not a measured position or keyword-volume estimate |
| Unquoted brand query | Verified | Google rewrites to Form Auto Hub; visible AI answer discusses other products |
| Six public pages, sitemap and llms.txt | Verified | HTTP 200; page robots index/follow; self canonical; meaningful text in response HTML |
| robots.txt | Verified | Initial timeout, retry 200; search crawlers allowed; training policy separate |
| Requests using Googlebot, OAI-SearchBot and PerplexityBot names | Verified | 200 from test client's IP; not verified real crawler traffic |
| JS-disabled sample-data H1 cumulative opacity | Verified in earlier audit | 0 despite text present in HTML; public readability issue, not proven cause of non-indexing |
| Search Console property access | Verified | Inspected the existing authorized URL-prefix property; no ownership change |
| Per-URL Google-selected canonical, exclusion reason, last crawl | Verified where available | Six stored inspections captured; five unknown URLs have no crawl/canonical data |
| Web Performance selected 28 days | Verified UI totals | 0 impressions/clicks, displayed 2026-09-09 through 2026-10-06; no query rows; exports and preceding-period comparison Not run |
| ChatGPT/Perplexity citation rate and post-release Google outcomes | Not run | No post-release/citation measurement |

Pre-change source findings: root metadata broadly allowed indexing; sitemap used `new Date()` for every URL; llms.txt hardcoded origin; homepage and SEO template contained separate SoftwareApplication definitions with an unqualified zero-price Offer. The implementation below addresses these issues; they are not established ranking penalties.

## Scope boundaries

Included: server metadata, route indexing policy, canonical/origin consistency, truthful structured data, discovery-file consistency, public no-JS readability repair if reproduced, evidence collection and validation.

No backend/API/DTO/database/auth-session/payment/credit workflow changes. Preserve authorization, preview and confirmation, maximum 100 responses per action and sequential batches of 10; no spam, CAPTCHA bypass, proxy rotation, fake accounts or unauthorized submission.

Deferred: redesign, new menu/footer items, new NCKH marketing route, blog, new visible sections/copy, changed CTA destination, bulk pages, backlinks/outreach, paid tools, domain migration, broader AI features. Existing related links are audited and retained; hidden bot-only links/content are forbidden.

Assumption: `https://formautohub.servertun.pp.ua` remains the production origin; user has not requested a domain move. Local preview origin is configuration-dependent and must not be deployed as canonical.

## Page and keyword structure

No route rename or new public hierarchy is needed for this first slice.

| Route | Role / primary intent | Index policy |
|---|---|---|
| `/` | Official FormAuto Hub identity and product overview | index, follow |
| `/google-forms/sample-data` | Sample response data for authorized testing | index, follow |
| `/google-forms/student-report` | Student demo/sample workflow, not fabricated research | index, follow |
| `/google-forms/survey-demo` | Demonstrating a survey workflow with labelled demo data | index, follow |
| `/google-forms/sheets-report` | Checking Forms output in Sheets; not an unapproved Sheets API integration | index, follow |
| `/anti-abuse` | Permitted use and product safety | index, follow |
| Login/register, auth callback, payment return/cancel | Utility routes | noindex, follow; excluded from sitemap |
| `/dashboard/**`, `/admin/**` | Authenticated operations | noindex, follow; excluded from sitemap; existing auth guards unchanged |
| Unknown path | Missing page | real HTTP 404; no soft-404 marketing fallback |

Candidate intents, not verified monthly search demand: sample Google Forms data for testing, Google Forms demo data for students, checking Google Forms before survey release. Keep broad research-survey queries as comparison/monitoring, not the first content target.

## Implemented structure and retained files

```text
apps/web/lib/site.ts                  existing environment-aware origin
apps/web/lib/seo-pages.ts             existing per-page copy and metadata
apps/web/lib/seo.ts                   shared identity/JSON-LD/noindex helpers
apps/web/lib/public-page-inventory.ts six-route discovery inventory
apps/web/app/layout.tsx               retained root metadata; no verification token added
apps/web/app/page.tsx                 homepage metadata and JSON-LD only
apps/web/components/seo-keyword-page.tsx existing visible template; JSON-LD/readability only
apps/web/app/sitemap.ts               inventory -> public sitemap
apps/web/app/robots.ts                retain search/training policy
apps/web/app/llms.txt/route.ts         environment-aware text route, generated at build time
apps/web/public/llms.txt              deleted after replacement route validation
apps/web/app/*/layout.tsx             noindex: auth/login/register/payment/dashboard/admin
apps/web/tests/seo.spec.ts            26 focused HTTP/browser checks
apps/web/playwright.seo.config.ts     explicit production-preview test configuration
apps/web/playwright.config.ts         excludes dedicated SEO suite from default dev suite
```

Prefer small shared helpers over a new SEO framework/dependency. Reuse existing page config; do not duplicate a second content registry. Inventory contains only route/discovery information and optional factual modification date.

### Identity and structured data

- Use one exact brand name: FormAuto Hub. Use stable absolute `@id` references for WebSite and SoftwareApplication; WebPage references the same website/application on relevant pages.
- Descriptions must agree with existing visible capabilities and safety language. No statistics/SPSS/SmartPLS feature claims, invented legal entity, address, awards, reviews, social profiles or `sameAs` URLs.
- Add a minimal WebSite identity on the homepage. Organization markup is conditional on verifiable operator information; do not invent it to satisfy a checklist.
- Reconcile the zero-price Offer against visible 5-credit trial and paid packages. Preferred first slice: omit ambiguous Offer where exact scope cannot be represented truthfully; accurate semantic schema is the acceptance target, not an application rich-result promise.
- Existing FAQ markup is optional semantic data for matching visible FAQs; do not promise Google FAQ rich results or expand FAQs in this slice.
- Escape `<` when serializing JSON-LD; emit data server-side without hydration-dependent injection.

### Discovery and indexing controls

- Preserve public index/follow and self canonicals; apply noindex explicitly to utility/private branches using server metadata, not client-only effects.
- Keep noindex pages crawlable so crawlers can read the directive; do not treat robots exclusion as an auth/security mechanism.
- Sitemap contains exactly six approved public URLs, no utility/private/query URLs. Replace build/request time lastmod with a factual significant-edit date; omit lastmod when unknown rather than guess.
- llms.txt uses the same origin and inventory as sitemap; it is an optional discovery aid, not a ranking/indexing guarantee. Never expose private app state.
- Keep allowed search crawlers and blocked training crawlers distinct; no crawler-policy expansion without an actual need and source verification.
- GSC is already user-verified: do not add a verification tag by default. Only use an actual property-issued token if verification maintenance demonstrably requires it; no placeholder token.
- If no-JS invisibility is reproduced, make existing public content readable without JS, keep hydrated layout/style and motion where feasible, and scope changes to the public template. Shared ScrollReveal/global CSS change requires auditing all consumers and a regression check.

## Ordered delivery passes

| Pass | Owner role | Deliverable | Dependency / gate |
|---|---|---|---|
| P0 Evidence | SEO analyst + property owner | Six-URL GSC baseline and current public snapshot | Property selection/access; no invented exclusions |
| P1 Technical | Frontend worker | Origin, inventory, noindex, sitemap/llms and public readability corrections | Can proceed without GSC; diagnose GSC-specific causes only after P0 |
| P2 Identity | Frontend worker + reviewer | Consistent metadata and truthful shared JSON-LD | Existing visible product facts; no visible redesign |
| P3 Local verification | Tester/reviewer | Build, restart, real HTTP/browser smoke and UI comparison | P1/P2 implemented; evidence required |
| P4 Release verification | Release operator + property owner | Approved public release smoke, GSC inspection/sitemap submission | Deployment is a separate action, not performed by planning |
| P5 Outcome observation | SEO analyst | D+7/14/28 index, query and citation comparison | D means verified public deployment date; no guaranteed deadline |

P1/P2 were subsequently implemented after user approval; see the dated result below. Separate code delivery from public indexing outcomes. Mark unavailable external checks Blocked and continue independent local work.

## Worker-ready handoff

Read README, routing matrix, this plan, the runbook, FRONTEND_STYLE_GUIDE, TESTING_STRATEGY and relevant source first. Recheck Git status and preserve the existing searchable-dropdown diff and artifacts.

Implement P1/P2 only inside the proposed web SEO zones, with smallest server-metadata additions for utility/private routes. Do not rewrite page copy or JSX layout, CTA/nav, business logic, packages or deployment configuration. Record actual changed files and justified deviations; an absent proposed file is not permission to restructure the app.

Stop and report if a change needs new public content, new routes beyond discovery/server wrappers, unsupported schema facts, auth contract changes, unrelated dirty-file overwrite, or origin migration. If a global motion/CSS change is necessary, present its consumer impact before widening scope.

## Completion and expected effect

Technical acceptance: public pages readable/indexable, utility/private routes noindex, correct canonical host, factual sitemap, aligned discovery files, parseable truthful JSON-LD, stable accepted UI, no new runtime errors.

Expected effects are better discovery consistency and clearer brand/product identity. Google chooses crawl/index/rank and AI chooses citations; no promised top position, traffic lift, indexing deadline or AI recommendation.

Review separately: local implementation verified; public release verified; Google per-URL index verified; AI citation measured. Never collapse these four into one Completed label.

Rollback: selectively revert only this slice's metadata/helper/route changes and redeploy through the existing release process after authorization. No database rollback. Search results may lag a rollback; preserve dated evidence.

## Sources checked on 2026-10-09

- [Google site operator limitations](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site).
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features).
- [OpenAI crawler roles](https://developers.openai.com/api/docs/bots).

Skills guide the workflow; primary documentation and actual source/runtime evidence control claims. Relevant roles: formauto-delivery-planner, formauto-controlled-doc-editor, seo-audit, ai-seo, site-architecture and schema.

## Implementation result — 2026-10-09

- Verified: server `noindex, follow` metadata for login/register/auth/payment/dashboard/admin. No authorization or workflow change; noindex is not access control.
- Verified: sitemap and generated text/plain llms.txt share the existing configured origin and six-public-URL inventory. Removed fabricated build-time lastmod; unknown dates are omitted. Environment files and domain remain unchanged.
- Verified: shared WebSite/SoftwareApplication IDs and public-page references; ambiguous zero-price Offer removed; existing product facts retained; JSON-LD serialized safely. This does not claim software rich-result eligibility without required fields.
- Verified: reproduced sample H1 cumulative opacity 0 without JavaScript; scoped noscript fallback makes it 1. All six public pages pass no-JS content checks; real hydration also passes.
- Verified: production build, lint/types and color check (100 source files). Restarted owned port-3034 production server, ran 26 passing HTTP/browser checks with local configured origin, then 26 passing checks on a production-origin build; no new server errors after smoke.
- Verified: six settled screenshots for home/sample at 1440/390/320px. Text, links and H1 geometry match across all six; five PNGs byte-identical. Home320 differs at 14,087 pixels, y=130..254, maximum 2/255 per channel; visual review shows no layout/content change. Screenshot capture alone disables motion and settles scroll-reveal; separate tests exercise actual hydration.

GSC stored URL Inspection, on the correct user-selected URL-prefix property: homepage indexed; all five other approved public URLs are unknown to Google and not indexed. Homepage last crawl displays 2026-08-29 05:45:35, smartphone Googlebot, successful fetch, crawl/index allowed and matching canonical. All six have no referring sitemap; five unknown URLs have no recorded crawl/canonical. Submitted-sitemaps table contains zero rows.

Web Performance selected 28 days, displayed 2026-09-09 through 2026-10-06: 0 clicks, 0 impressions, no query rows. Displayed position 0 is no measurement, not a rank. These pre-release observations cannot measure this local patch's effect. Sanitized evidence and screenshots: `artifacts/reports/seo-geo/2026-10-09/`; suite/config: `apps/web/tests/seo.spec.ts`, `apps/web/playwright.seo.config.ts`.

Review: P1/P2 scope retained; no visible copy/CTA/navigation, backend/API/database or crawler-policy changes. Existing dropdown diff and standalone HTML report preserved.

Not run: push/deploy, post-release public smoke, GSC live test/recrawl/sitemap submission, detailed Page indexing report, Performance exports/preceding-28-day comparison, authenticated private workflows, reduced-motion browser check, verified AI crawler logs/citations and D+7/14/28 outcomes. P0 covers stored URL inspections, submitted-sitemap list and displayed Performance totals; it does not complete every investigative/export step in the runbook. Next: separately authorize deployment, verify public output, submit validated sitemap and inspect/request the five public pages. Google indexing and AI citations are external outcomes, not guaranteed by local technical success.

Documentation/commit review: synchronized the current GSC state, implementation inventory, actual coverage and remaining gates in both languages. The user authorized a selective local commit of SEO code, tests, paired docs and dated sanitized evidence. The earlier dropdown UI diff and standalone HTML report remain separate, unmodified work. The validation JSON records the earlier pre-commit snapshot; obtain this revision's commit identity from Git history.
