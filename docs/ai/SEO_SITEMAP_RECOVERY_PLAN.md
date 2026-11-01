# SEO_SITEMAP_RECOVERY_PLAN

## Status and objective

- Date: 2026-10-10 (Asia/Saigon).
- Authority: the user requested a detailed sitemap recovery plan. This pass prepares documentation and read-only public checks; it does not preapprove an unidentified fix, production changes, sitemap resubmission, commit or deployment.
- Objective: Google successfully fetches and processes the existing `https://formautohub.servertun.pp.ua/sitemap.xml`, reading the six public URLs. Keep discovery, crawling and index inclusion separate.
- Existing SEO/GEO follow-up; no new phase. Preserve UI, copy, routes, CTAs, training-crawler policy and all business workflows.
- Related: [SEO/GEO plan](SEO_GEO_IMPLEMENTATION_PLAN.md), [runbook](SEO_GEO_VALIDATION_RUNBOOK.md), [deployment guide](DEPLOYMENT_GUIDE.md).
- Assumption: the production origin remains unchanged. Cloudflare/tunnel administrative access and edge-log location are unverified.

## Evidence and gaps

| Evidence | Status | Limitation |
|---|---|---|
| New sitemap GET on 10 October Vietnam time | Verified | 200, application/xml; XML parser reads the correct urlset namespace and six unique URLs |
| New robots GET | Verified | 200, Googlebot allowed, correct HTTPS Sitemap reference |
| sitemap.ts and inventory source | Verified | Six routes generated from configured origin, no invented lastmod; no demonstrated need to rewrite |
| Public headers and DNS | Verified | Cloudflare present; A/AAAA resolve to edge addresses; origin routing and end-to-end IPv6 not proven |
| Last GSC observation on 9 October | Verified at historical checkpoint | Submission accepted but Couldn't fetch, unknown type, zero discovered URLs |
| Google Live Test on 9 October | Verified at historical checkpoint | Successful sitemap fetch, crawling allowed; not proof the Sitemaps processor read it |
| Five index requests on 9 October | Verified at historical checkpoint | Accepted into the queue; not proof of indexing |
| Today's GSC status, root cause, genuine fetch logs | Not run | Do not conclude the error persists today or default to Cloudflare blame |

DEPLOYMENT_GUIDE describes nginx/reverse proxy on the VPS; current headers prove Cloudflare at the public edge. Neither establishes actual origin topology. Verify routing and ownership before configuration changes; do not assume nginx or /var/log/nginx exists.

## Execution order

### S0 — Refresh GSC and preserve the comparison baseline

Role: tester with authorized property access.

1. Select the existing HTTPS URL-prefix property; do not create a property or change ownership.
2. Open /sitemap.xml and error details. Record status, type, submitted/last-read dates, exact URL and discovered count; use N/A for blanks.
3. Expand error details where available and record the exact code/reason. Check Manual actions if fetch still fails.
4. Save sanitized screenshots/JSON without account identifiers. Do not resubmit or delete the sitemap here.
5. If already Success with six URLs, skip fixes and proceed to S5. If Success with a different count, compare the processed version and update time.

Output: fresh GSC snapshot, Verified persistence or Verified recovery. Yesterday's screenshot is not today's state.

### S1 — Isolate public transport and XML behavior

Role: HTTP tester; bounded GET requests, no load test.

1. GET the exact submitted URL. Record status/headers, redirects if present, content-type, body length/hash, response timing and connection errors.
2. Parse actual XML: UTF-8, standard urlset/namespace, six absolute HTTPS loc entries on the correct host, no duplicates/private/utility/query URLs and no HTML challenge/error body.
3. Compare loc entries with publicPagePaths, canonicals and robots Sitemap reference. HEAD is supplementary; GET proves retrieval.
4. Run Google Live URL Inspection for the sitemap itself; record Crawl allowed and Page fetch. Do not request indexing of XML.
5. If network differences need isolation, make one GET from the current machine and one from the VPS; test IPv4/IPv6 only with suitable client connectivity. A client-side IPv6 failure does not establish an origin/DNS fault.
6. Googlebot user-agent tests may compare responses, but label them simulated requests from the test IP, not genuine Googlebot traffic.

Output: GSC fetch / public GET / origin GET / XML matrix, completed before proposing a fix.

### S2 — Identify the failing layer if S0 still fails

Roles: server debugger and edge operator, read-only.

1. Establish public → Cloudflare → tunnel/reverse proxy → Next.js routing through relevant configuration and running processes; do not dump environment variables, tokens or tunnel keys.
2. Compare internal origin GET with public GET; inspect release SHA and restart time. Read bounded web/proxy/tunnel logs around failures and reconcile UTC with displayed GSC times before correlating.
3. With Cloudflare access, inspect relevant hostname/path security events or analytics for /sitemap.xml and /robots.txt: block/challenge/rate limits, upstream errors, cache and applicable rules. Missing log retention is an evidence gap.
4. Verify Google requests using published IP ranges or reverse-then-forward DNS following official guidance. Distinguish Googlebot from the Inspection fetcher; user-agent names alone are insufficient.
5. If no corresponding origin request exists, investigate edge/tunnel/DNS rather than blaming application code. If edge logs are also unavailable, record an unestablished cause and required inputs.
6. If fetch/parse succeed but the report still fails, inspect last-read time, manual actions and whether Google has retried. These are hypotheses, not a finding of poor content.

Required output: reproduced failure, responsible layer, pre-fix evidence, smallest proposed change and rollback.

## Conditional fix decision matrix

| Finding | Proposed response | Gate |
|---|---|---|
| GSC Success, six URLs | No fix; index monitoring | Save fresh snapshot |
| Wrong submitted URL, 404 or redirect | Use correct final URL; repair references if wrong | Demonstrate mismatch between submitted and retrievable URL |
| Origin and public both fail | Repair proven route/build/routing issue or recover process | Reproduced HTTP/log evidence; approved production action |
| Valid origin XML, edge 403/429/challenge/5xx | Repair the particular rule/tunnel/upstream | Correlated rule/event/request; do not disable domain-wide protection |
| 200 with HTML or broken XML | Repair middleware/rewrite/serialization or responsible cache | Reproduced body; change only the generating layer |
| robots blocks sitemap | Repair the conflicting rule | Evidence of Google's blocking rule; preserve training policy |
| GET and Live Test pass, no new GSC read | Retain sitemap, recheck on milestones; no code fix yet | Unknown type alone is not malformed XML evidence |
| No edge access/logs or no reproduction | Mark cause diagnosis Blocked, continue independent checks | State exact missing data/access and responsible operator |

Do not add a sitemap index for six pages, change URLs to evade reporting, assign current-time lastmod, remove AAAA without evidence or create bot-only content. Do not widen access/public ports, disable auth/TLS or weaken abuse controls for sitemap recovery.

### S3 — Prepare and implement the smallest evidenced fix

- Proposed code zones: apps/web/app/sitemap.ts, apps/web/app/robots.ts, apps/web/lib/public-page-inventory.ts, apps/web/lib/site.ts and SEO tests; select only files responsible for the fault.
- next.config.mjs, Dockerfile/workflow/compose or edge rules enter scope only after diagnosis and an explanation of impact.
- Exclude UI components, auth/payment/credit/API/DB and SEO/content strategy expansion.
- Preserve all existing uncommitted diffs/docs/screenshots; no reset/clean. Prepare a reviewable diff before requesting production-change approval.
- For code changes: build, restart an owned local server, run the 26 SEO checks plus a focused regression for the new fault; do not write helper-mirroring tests.
- Reviewer checks XML, discovery, robots, canonicals, narrow rule scope and rollback. Sync English/Vietnamese documentation.
- Rollback only the patch or particular rule, using the prior release where necessary. No DB rollback. Preserve before/after evidence; do not promise immediate Google updates.
- Keep implementation, commit and deployment approvals distinct; this planning request performs none of them.

### S4 — Verify public output and resubmit deliberately

1. After an authorized fixed deployment, verify new SHA, process restart, public XML GET and logs; rerun the 26 checks against the public origin.
2. Google Live Test must fetch successfully and allow crawling; six page canonicals and indexing policy must remain correct.
3. Resubmit once after correcting the cause or when evidence justifies a fresh fetch request. Retain the current sitemap URL; do not delete the old submission to erase evidence.
4. Save request acceptance separately from processing status. Recheck after 24 hours, then 48–72 hours if there is no new read. This is a proposed operator cadence, not Google's SLA.
5. Do not repeat the five accepted page-index requests merely to increase priority. Do not use the Indexing API for ordinary app pages.
6. If failure recurs after correction, return to S2 with new timestamp/rule/release evidence; repeated submissions do not replace diagnosis.

### S5 — Acceptance and outcome monitoring

| Layer | Acceptance |
|---|---|
| App/public | Valid XML, six correct HTTPS URLs, aligned robots; applicable HTTP/browser/log checks pass |
| Google sitemap fetch/processing | GSC Success, recognized sitemap, parsed count consistent with six URLs; record pending if count has not updated |
| Per-page indexing | Separate six URL statuses, remaining exclusion reasons and available crawl/canonical data |
| Traffic/GEO | Measure separately using the runbook; unavailable evidence remains Not run, never inferred from sitemap status |

Keep release D = 2026-10-09: D+7/14/28 on 2026-10-16, 2026-10-23 and 2026-11-06. If a new sitemap repair is released, also record its remediation date to distinguish periods. No monitoring job is created during planning.

## Handoff artifacts and effort

- New execution evidence: artifacts/reports/seo-geo/2026-10-10/; fresh GSC snapshots, HTTP/XML, sanitized logs, diagnostic matrix, patch/rule if any and acceptance results.
- Estimated hands-on effort: S0 15–20 minutes, S1 20–30 minutes, S2 30–60 minutes with access/logs available. S3 depends on diagnosis and is not estimated prematurely. Google waiting time is separate.
- Review checkpoint: at S2 completion, the proposal must identify the failing layer, evidence, exact change, impact and rollback.
- Deferred: domain migration, redesign, new content, paid audit, hosting-platform replacement and crawler-policy expansion.

## References

- [Google Sitemaps report / fetch troubleshooting](https://support.google.com/webmasters/answer/7451001): submission, fetch, processing and indexing are separate; Google may retry failed fetches for several days.
- [Verify Google requests](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests): use official crawler/fetcher verification methods.
