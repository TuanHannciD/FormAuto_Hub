# SEO_GEO_VALIDATION_RUNBOOK

## Scope and status

- Date: 2026-10-09. Companion: [SEO_GEO_IMPLEMENTATION_PLAN.md](SEO_GEO_IMPLEMENTATION_PLAN.md).
- This is an execution checklist with the observed baseline and local test coverage. It is not a post-release outcome report.
- Verified: authorized URL-prefix property access, six stored URL inspections, empty submitted-sitemaps list and displayed 28-day Web Performance totals. Live tests, detailed Page indexing report, Performance exports and preceding-period comparison are Not run.
- Use Verified, Not run and Blocked for evidence; never substitute assumptions for observed values.
- Do not store cookies, credentials, owner account identifiers, tokens or unrelated private URLs in committed evidence.

## P0: Search Console baseline

1. Select the existing property covering `https://formautohub.servertun.pp.ua/`; record property type and public origin, not account details. Do not create a new property or change ownership.
2. Inspect each of the six URLs listed in the plan with URL Inspection. Record stored index status separately from Live Test. Live Test success does not prove inclusion in Google's index.
3. Record last crawl, fetch status, crawl/index permission, user-declared and Google-selected canonical, discovery/sitemap associations and exact exclusion reason where available. Leave unavailable values Unknown.
4. Review Page indexing and Sitemaps reports; record submitted URL, processing status, discovered count and errors. A successful sitemap submission is not an indexed count.
5. Export Performance for the last 28 complete days and preceding 28 days with consistent Web search/country/device filters. Include query/page impressions, clicks, CTR and average position; missing/low-volume data stays unavailable.
6. Classify each exclusion from the actual evidence: discovery, fetch/render, noindex, canonical/duplicate, crawled-not-indexed or another displayed reason. A reason is not permission to rewrite public content.

### Observed per-URL baseline — 2026-10-09

| URL path | Stored indexed? | Last crawl as displayed | Live fetch | Crawl/index allowed | Declared / selected canonical | Exact reason | Next action | Evidence date/status |
|---|---|---|---|---|---|---|---|---|
| `/` | Yes | 2026-08-29 05:45:35 | Not run | Yes / Yes | Homepage / inspected URL | Indexed | Recheck after release | 2026-10-09 Verified |
| `/google-forms/sample-data` | No | N/A | Not run | N/A | N/A | URL unknown to Google | Submit sitemap/inspect after release | 2026-10-09 Verified |
| `/google-forms/student-report` | No | N/A | Not run | N/A | N/A | URL unknown to Google | Submit sitemap/inspect after release | 2026-10-09 Verified |
| `/google-forms/survey-demo` | No | N/A | Not run | N/A | N/A | URL unknown to Google | Submit sitemap/inspect after release | 2026-10-09 Verified |
| `/google-forms/sheets-report` | No | N/A | Not run | N/A | N/A | URL unknown to Google | Submit sitemap/inspect after release | 2026-10-09 Verified |
| `/anti-abuse` | No | N/A | Not run | N/A | N/A | URL unknown to Google | Submit sitemap/inspect after release | 2026-10-09 Verified |

The crawl timestamp is preserved as displayed; its timezone was not verified and must not be relabelled UTC. All six report no referring sitemap; submitted-sitemaps table has zero rows. Performance UI selected 28 days displays 2026-09-09 through 2026-10-06: zero clicks/impressions and no query rows. This is a displayed UI period, not an exported current/prior-period comparison. Unknown-URL status is not a diagnosed content-quality exclusion. Full sanitized fields are in the linked baseline JSON.

If account access is unavailable, mark GSC checks Blocked and request a narrow six-URL inspection/Performance export from the property owner. Continue independent technical implementation; never claim to know Google's exclusion reason.

## P1/P2: Meaningful implementation checks

- Snapshot Git status and accepted desktop/mobile appearance before editing. Preserve unrelated work.
- Public pages: exactly one effective canonical, correct configured origin, no accidental noindex or X-Robots-Tag conflict, title/description/H1 and visible content retained.
- Utility/private paths: noindex available in real initial HTML, including representative nested routes. Do not assume a parent layout wins over all child metadata. Unauthenticated requests expose no private data; authenticated session/role behavior unchanged.
- Sitemap: valid XML, six unique approved canonical URLs, no private/utility routes; unknown lastmod omitted and factual dates stable across unchanged rebuilds.
- llms.txt: real text/plain response, same configured origin/public URLs, no duplicate static/route conflict and no private content. Test alternate local origin and production-configured output.
- JSON-LD: parse the rendered script(s), verify stable identity references, serialization safety and facts matching visible content. No invented review/operator/pricing claims. Validate supported features only; absence of FAQ rich-result detection is not a failure.
- No-JS public readability: check cumulative opacity/visibility of H1 and main body, not merely presence in HTML. If repairing motion, verify JS-enabled viewport behavior and reduced-motion accessibility.
- Add focused runtime tests for these behavioral invariants; avoid tests that merely mirror helper implementation or freeze full JSON snapshots.

## P3: Local runtime gate

From `apps/web`, run `npm.cmd run build`. Record actual outcome; the approved implementation build passed, as recorded in the plan and validation JSON.

Restart an owned Next production-preview process on an available port using `npm.cmd run start -- -p <owned-port>` after the build. Existing Playwright config starts development server on 3000; use a dedicated config or explicit harness for the production-preview gate, do not mistake dev smoke for production smoke.

Check with real HTTP requests:

- Six public routes, robots.txt, sitemap.xml and llms.txt.
- `/login`, `/register`, `/auth/callback`, payment return/cancel, representative dashboard/admin routes and nested routes; no unsafe payment/submission/mutation request.
- One unknown path returns actual 404.
- Declared canonical and robots metadata in initial HTML and response headers.

Browser checks: six public pages hydrate, required JS/CSS chunks load, no new page/console errors, key text readable with JS disabled. Compare before/after desktop 1440 and mobile 390 plus 320px overflow; no UI/CTA/nav regression. Exercise existing login/navigation without submitting forms or changing balances.

Inspect owned server output after smoke. If global ScrollReveal is touched, include representative existing consumers outside public SEO pages. Stop only processes owned by this validation run.

Save sanitized records and optional screenshots under `artifacts/reports/seo-geo/<date>/`; do not create fabricated before screenshots or overwrite the earlier HTML report. Label any reconstructed image explicitly.

## P4: Public release and Google follow-up

Deployment/commit/push are separate actions; preparation documents do not execute them. Follow the existing DEPLOYMENT_GUIDE, record release identity and verify affected process restart.

After authorized deployment:

1. Repeat public HTTP/header/canonical/JSON-LD/browser/chunk checks on actual origin and inspect relevant release logs.
2. Confirm existing GSC sitemap is correct; submit/resubmit only when needed. Inspect Live Test for changed public URLs.
3. Request indexing for appropriate changed public URLs if needed and available; do not use the Google Indexing API for ordinary app pages or repeatedly submit requests as a ranking tactic.
4. Record request acknowledgement separately from actual subsequent indexed status.
5. Check crawler logs only through bounded read-only diagnostics. User-agent text alone is not verified crawler identity; validate using vendor-published methods/IP data before attribution.

## P5: Keyword and AI observation

Baseline Google queries (observed earlier, no app on page one except domain lookup):

| Query | Intended audience / use |
|---|---|
| `FormAuto Hub` and exact quoted variant | Brand disambiguation |
| `tạo dữ liệu mẫu Google Forms` | Sample/test data |
| `kiểm thử Google Forms` | Technical testing; observed ambiguity with quiz creation |
| `điền Google Form tự động` | Product category; competitive benchmark |
| `dữ liệu mẫu Google Forms cho sinh viên` | Student demo workflow |
| `khảo sát nghiên cứu khoa học sinh viên` | Broad audience comparison |
| `công cụ quản lý khảo sát Google Forms nghiên cứu khoa học` | Research workflow intent |

Track proposed more precise intents separately: `tạo dữ liệu mẫu Google Forms để kiểm thử`, `dữ liệu demo Google Forms cho sinh viên`, `kiểm tra Google Forms trước khi phát hành khảo sát`. These have no measured volume or ranking baseline yet.

At public deployment D and D+7/14/28, use consistent language/country/device, personalization settings and query wording. Log result URL, observed position only if actually counted, AI overview presence and cited sources. A page-one miss is not position 11 or proof of non-indexing.

Test Google AI results and, where accessible, ChatGPT with search and Perplexity using prompts such as:

- Công cụ nào giúp tạo dữ liệu mẫu Google Forms để kiểm thử trước khi gửi khảo sát?
- Sinh viên có thể kiểm tra dữ liệu demo Google Forms và Google Sheets bằng công cụ nào?
- FormAuto Hub là gì và có yêu cầu xem trước trước khi gửi phản hồi không?
- Công cụ nào hỗ trợ quản lý mô hình, biến và ánh xạ câu hỏi cho khảo sát nghiên cứu?

Use 3-5 independent runs per prompt/platform/date when access allows. Record platform/search mode, timestamp, sample size, source URL and exact brand description. Distinguish retrieved, cited, mentioned and recommended. One visible AI answer is a sample, not a platform-wide citation rate. Never query a private production account or pay for a tool automatically.

## Acceptance and outcome comparison

| Layer | Acceptance / comparison | Evidence authority |
|---|---|---|
| Technical | All relevant route/metadata/readability/UI gates pass | Local and public HTTP/browser/log evidence |
| Google indexing | Six inspected URLs have known statuses; remaining exclusions explicitly explained | Stored URL Inspection and Page indexing |
| Search traffic | Compare impressions/clicks/CTR/position by same query/page/filter period | GSC Performance; no uplift forecast |
| Brand identity | Observe whether brand correction/misattribution persists | Dated search and AI output samples |
| AI discovery | Access permitted vs actual verified fetch | robots/HTTP vs validated logs |
| AI citations | Cited runs / valid runs, source URLs and wording | Platform samples with n and dates |

No promised 6/6 indexing, top rank, traffic increase or citation threshold. Technical completion may precede or occur without search/AI outcome improvement. Escalate thin-content/intent issues for a separate visible-content proposal if technical corrections do not address observed exclusions.

Closeout must report summary, files changed, scope alignment, performed/not-performed validation, risks/Deferred items and next step. Mark external unknowns honestly; code build passing cannot close public runtime or search-outcome gates.

## Reproduce the approved local SEO suite

Actual automated coverage: 6 public HTTP/browser/metadata/schema checks + 6 no-JS readability checks + 12 unauthenticated initial-HTML noindex checks + 1 sitemap/llms consistency check + 1 robots/404 check = 26. Visual comparisons are separate evidence. The suite catches page errors and failed static-chunk HTTP responses; it does not assert every console message or independently confirm all hydration events. Authenticated account/admin/payment workflows, reduced-motion checks, formal external rich-result validation and verified AI crawler traffic are Not run; source inspection alone is not runtime proof of these behaviors.

Pre-commit review reran the unchanged production-origin build on a freshly started owned server: 26/26 passed (11.4s), no new server output errors. Output: [pre-commit-tests.txt](../../artifacts/reports/seo-geo/2026-10-09/pre-commit-tests.txt). This documentation-only review did not rebuild or change production code; it rechecked the existing validated build.

From `apps/web`, build with the intended public origin (process override, no .env edit), then start an owned production server:

```powershell
$env:NEXT_PUBLIC_SITE_URL='https://formautohub.servertun.pp.ua'
npm.cmd run build
node node_modules/next/dist/bin/next start -p 3034
```

In a second terminal from `apps/web`:

```powershell
$env:SEO_TEST_BASE_URL='http://localhost:3034'
$env:SEO_EXPECTED_ORIGIN='https://formautohub.servertun.pp.ua'
npx.cmd playwright test --config playwright.seo.config.ts
```

The expected origin must match the build configuration; the test server URL may differ. Check port ownership before starting/stopping and restart after rebuilding. On 2026-10-09 an initial run hit a stale pre-change process and the wrong expected origin; that run failed and is not acceptance evidence. After replacing only the owned process, 26/26 passed for the local-origin build and 26/26 for the public-origin build. No public deployment was performed. D+7/14/28 begins at verified public release, not local build date.

Sanitized baseline: [gsc-baseline.json](../../artifacts/reports/seo-geo/2026-10-09/gsc-baseline.json). Visual evidence: [visual-comparison.json](../../artifacts/reports/seo-geo/2026-10-09/visual-comparison.json), paired screenshots in the same folder. The existing standalone HTML report remains historical and is not a post-release measurement. The default dev Playwright configuration excludes this dedicated production suite to avoid mixing origins or silently testing a stale dev server.

## Primary references

- [URL Inspection](https://support.google.com/webmasters/answer/9012289).
- [Google search operator limits](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site).
- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Request recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features).
- [OpenAI crawler roles](https://developers.openai.com/api/docs/bots).
