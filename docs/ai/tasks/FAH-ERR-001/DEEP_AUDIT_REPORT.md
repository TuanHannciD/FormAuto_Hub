# FAH-ERR-001 — Deep audit report

2026-10-30 · HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` · **Bounded evidence accepted by independent review; current dossier checks recorded separately. Full-system verification incomplete.**

## Summary and authority

The authorized follow-up deepens the error-message audit across backend, UI/shared helpers and representative runtime paths. Root coordinates and summarizes delegated evidence; separate Sol agents inspect source, reproduce behavior, review it independently and write this dossier. No error-remediation implementation is approved. The separately authorized local DB synchronization is tracked in [FAH-DB-SYNC-001](../FAH-DB-SYNC-001/INDEX.md).

The independently accepted deduplicated register is **24 groups: 2 P1, 20 P2, 2 P3**. ERR-001–020 retain their IDs, with corrections below; [ERR-021–024](DEEP_AUDIT_FINDINGS.md) add unknown-data presentation,clipboard feedback,omitted submission-attempt reasons and date/time display/config mismatch. These are current defects/risks, not fixed behavior or production incidents. The required ERR-012/015 corrections below incorporate the final independent [review report](../../../../artifacts/reports/error-audit-2026-10-29/deep/review/report.md).

## Accepted UI remainder and ERR-024

[Independent UI review](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md) accepts one new P2 group ERR-024: clearing a date/time field stores an empty config while the input displays a fallback. Original component/helper/save-handler probes reproduce visible defaults with empty POST values; backend validation is source-traced, not executed HTTP. UIR-002 merges into ERR-019 (Option2/3/public implementation jargon); UIR-003 into ERR-021/017 (dataset unknown presented as empty, parent warning retained); UIR-004 into ERR-021 (failed admin user search shown as no results/stale options; existing version guard retained). No extra duplicate groups, confirmed wrong credit, persistence or provider effect. Error fixes remain Deferred.

## Main normalization and resumed real audit — current

**Verified actual main apply at UTC2026-10-29T19:42:12 (2026-10-30 ICT):** attempt03 used exact reviewed wrapper/NoPooling helper and unchanged R1 incremental. Main current13/applied14,pending0/modelPendingfalse,POST compatible,canonical400/100bytes;only planned migration added,33business-table count/PK/full-row hashes unchanged,two exact legacy indexes INFO preserved. [Execution result](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-result-03.json),[actual POST](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-post-03.log). History14/source13 is expected known legacy,not a blocker. Main actual Program/Migrate startup/read smoke now Verified:health200,anonymous profile401,missingroute404;owned PID24496/5247 stopped on request,all34post-migration fingerprints unchanged after startup. [HTTP proof](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/main-http-results.json). [Final independent review](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) accepts scoped DB sync and bounded audit;no release/full-system claim.

Attempts01/02 stopped at unchanged guard before normalization;attempt02 proved own pooled fingerprint session. Separate NoPooling helper and attempt03 received [fresh independent GO](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review-attempt03/report.md);old helper/failed evidence retained,guard never weakened. [Attempt history](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-attempts01-02-report.md). Original SQL candidate Msg102 remains Failed/withdrawn;R1source17integration/B2SQL16pass0skip remain separate successful evidence.

[Real API/JWT/SQL follow-up](RUNTIME_API_SQL.md) now records **15scenarios+health+2authsetup=18HTTPobservations** on owned restored clone,actual User/Admin/refresh sessions,13/18existing-trace log correlations. Strengthens ERR-002actualMVC errors/traceId,ERR-005persisted failed AnalyzeForm UsageLog and ERR-013actualHTTP500/noPackagePersist;no new IDs or error fixes. Clone fixtures after B2 mean current clone is no longer byte-equal main. Browser/provider/full E2E coverage remains incomplete;do not promote old mocks or18observations to all24groups tested.

## Evidence levels and reproduction

| Evidence | Executed result | What it establishes / limit |
| --- | --- | --- |
| Prior automated screening | 321 selected first-party files; 105 with 701 signal lines, 216 without matches | Search denominator, not 321 full manual reads or every reachable branch. [Inventory](SOURCE_INVENTORY.md) remains the screening record. |
| Backend implementation harness | Fresh explicit-source API assembly; 16 observations in 10 probe groups; exit 0 | Actual services/controller/adapter with fake HTTP/logger and fresh-context EF InMemory reads. Confirms observed in-process behavior; no MVC server, SQL transaction/migration or external provider. [Backend report](../../../../artifacts/reports/error-audit-2026-10-29/deep/backend/report.md), [results](../../../../artifacts/reports/error-audit-2026-10-29/deep/backend/results.json). |
| UI/helper harness | 8 observations; exit 0 | Original AST functions/components with synthetic boundaries, minimal hook state and JSX object trees. No React DOM/browser/API persistence. [UI report](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/report.md), [results](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui/probe-results.json). |
| Browser + HTTP fixture | 5 rendered observations, screenshots, captured HTTP/console; evidence-check exit 0 | Real Next dev app, owned incognito tab, guest then synthetic User; all API behavior supplied by owned fixture. Reproductions Verified; the expected UX/error behavior Failed. No real account/API/DB/provider integration. [Runtime report](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/report.md), [manifest](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/evidence-manifest.json). |
| SQL read-only metadata | sqlcmd exit 0; local DB identity, migration history and selected column names | Metadata only. 13 migration-history rows versus 12 source migrations; history-only `20260601083335_Phase10ManualCreditOperations`. Does not prove corrupt DB or complete schema/entity parity. |
| Independent review | Final report; independent backend 16/UI 8 reruns exit 0, 7 review checks | Separate reviewer accepts 23 groups after ERR-012/015 corrections, independently asserts 5 saved browser captures and source/SQL/release evidence. Browser not rerun; no provider/SQL behavior implied. |

Counts above have different denominators and must not be added into a single “system tests passed” total. The previous backend 158/158 and auth 9/9 runs remain dated regression evidence in [Validation](VALIDATION.md); they are not new end-to-end checks or fixes.

## Disposition of ERR-001–020

“Confirm” retains the bounded finding, “Revise” changes a material claim, and “Clarify/expand” narrows evidence or adds a trigger. No entire old group is rejected; individual unsupported claims are explicitly rejected. Probe IDs identify exact entries in the linked backend/UI results above; runtime IDs identify rows in the runtime report.

| ID / priority | Disposition | Current conclusion and exact new evidence |
| --- | --- | --- |
| ERR-001 / P2 | Confirm, stronger evidence | HTTP identity is lost before consumer mapping. RUNTIME-01 renders `Unauthorized` for fixture login 401. Browser network still retains status; credential wording remains generic. |
| ERR-002 / P2 | Confirm actual MVC payload | Shared JSON helper discards existing field errors/traceId. UI source review confirms the boundary; original PROBE-02 is synthetic. Real HTTP-01/02 now prove MVC400 field errors/traceId on clone;shared-helper loss remains source/mock-traced. |
| ERR-003 / P2 | Confirm, expand consumers | Short raw/English text survives filtering; some usage/credit pages render `.message` directly. RUNTIME-02/03/04 show `Service Unavailable`; no secret leak or XSS established. |
| ERR-004 / P2 | Confirm static | Blob path discards body explanation; source review confirms existing Google-versus-JWT 401 discriminator must be preserved. Original PROBE-04 is mock, no failed export executed. |
| ERR-005 / P2 | Confirm actual SQL persistence | Analysis message reaches UsageLogs and UI. `FormProjectService` preserves inner exception. Usage filter must include AnalyzeForm to show those records; HTTP-10/11 now confirm failed AnalyzeForm UsageLog via API+SQL aggregate;browser remains Not run. |
| ERR-006 / P2 | Confirm boundary | BE-P09: fake PayOS 503 body is included in ErrorMessage. Service/controller/UI forwarding remains source-traced; no real leak or PayOS HTTP end-to-end test. |
| ERR-007 / P2 | Confirm, stronger evidence | BE-P03 fresh InMemory context: job/usage Failed but description `Gửi form thành công`. Pause/cancel/mixed outcomes remain static. |
| ERR-008 / P1 | Confirm, stronger evidence | BE-P01: fake send success then transport throw leaves fresh-context Running, 0 attempt/usage logs and 0 persisted successes. BE-P02 loses payload JsonException inner; BE-P04 thrown collect leaves 0 collection logs. Remote-create follow-up failure remains static. InMemory durable reads do not establish SQL durability. |
| ERR-009 / P1 | Confirm, stronger evidence | BE-P05 captures two Information entries with synthetic prompt/response markers; synthetic API key excluded. User-content exposure risk at logger boundary, no real credential incident or retention/access conclusion. |
| ERR-010 / P2 | Confirm, narrow | BE-P10: Forms 403/404/429/503 each return null. Transport/malformed-JSON can throw; do not say all exceptions collapse to null. OAuth/config branches source-traced. |
| ERR-011 / P2 | Clarify | Run ErrorMessage omitted by response/analytics; RunId already exists. BE-P06: malformed outer JSON throws, malformed assistant content in valid envelope yields 0 outputs. Do not merge all parse failures or claim all correlation is absent. |
| ERR-012 / P2 | **Revise** | BE-P08 disproves syntax-cause-loss claim: malformed JSON has distinct message and JsonReaderException inner at service. Valid JSON with invalid constraints still collapses to generic mismatch. Controller returns only message; retained inner object is not proof it was logged. |
| ERR-013 / P2 | Confirm action boundary | BE-P07 actual controller/service throws ArgumentException for price 0, no ActionResult/package row. HTTP-13 now reproduces actual500 text/plain in Development;package count unchanged. |
| ERR-014 / P2 | Confirm mock/static | Original FULL-04 and UI source review: failed profile read resets AI settings. No confirmed overwrite; distinguish verified absence from failed read, including endpoint-specific 404 semantics. |
| ERR-015 / P2 | **Revise and expand** | UI-P06 rejects NCKH false-mutation-failure example: loader records read error and resolves. Throwing reloads remain in top-up/admin handlers. UI-P05 adds AI POST success → GET failure, losing returned run/preview IDs and credit outcome in UI state. Backend save/debit-before-return chain is static; no actual duplicate debit. |
| ERR-016 / P2 | Confirm, stronger evidence | RUNTIME-02: fixture detail 503 renders not-found/ownership advice. Preserve privacy-safe behavior for genuine hidden/not-found resources; do not infer absence from read failure. |
| ERR-017 / P2 | Expand | Existing partial-slice retention plus UI-P07: A requested before B, B resolves before A; all requests succeed, final variables belong to A. Model identity/request ownership missing; no mistaken save executed. |
| ERR-018 / P2 | Expand actual-source evidence | UI-P01: actual service `Invalid Google Form URL.` detail maps to expired/invalid authentication. Registration password fixture stays synthetic; no claim current API emits that exact sentence. Duplicate-relation client guard limits that trigger. |
| ERR-019 / P2 | Confirm bounded wording subset | Backend/UI review confirms technical/English text in traced consumers. Provider check is local configuration evaluation, not connectivity. Internal detailed validators are not UI defects without a consumer trace; admin technical concepts can be appropriate. |
| ERR-020 / P3 | Confirm static | Legacy exploratory smoke scripts lack sufficient assertions. Not executed; no claim current CI falsely passed or browser compatibility failed. |

## Independent additions and shared repair map

See [new findings](DEEP_AUDIT_FINDINGS.md) for source, trigger, observed text, proposals and checks. UI-001 maps only to ERR-021; UI-005 to ERR-022; UI-006 to ERR-023. UI-002/003/004 extend ERR-015/018/017 respectively. Backend observations strengthen existing IDs, rather than creating duplicate defects.

Proposed repair order is Deferred:

1. ERR-008/009: preserve known/unknown external outcomes, exception context and safe AI diagnostics; review persistence/recovery/privacy decisions first.
2. ERR-015/021/017/014/007/016: separate confirmed write outcome and valid/current data from failed reads. Keep returned IDs before retrying only the read; do not automatically resend/generate.
3. ERR-001–004/006/010–013/018/023: preserve safe cause/HTTP identity at existing boundaries, then render audience-appropriate guidance and existing support IDs. New fields/statuses/error contracts require review.
4. ERR-005/019/020/022: wording, exploratory-check quality and clipboard feedback. Historical-row changes and content retention require separate decisions.

This is a proposal map, not authorization to implement all changes or select a new phase. Generic credential protection, dedicated credit service/transactions, UsageLogs/SubmissionLogs, NCKH Google-versus-JWT handling, preview/confirmation and sequential submission controls remain invariants.

## Coverage and limits

Two UI authors report99/99 full-file TS/TSX reads under app/components/lib:43 prior +56 disjoint remainder. [Remainder coverage](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/coverage.json) records per-file dispositions/hashes. [Independent review](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md) checks denominator/provenance and selected complete units, not a reviewer reread of all99. Two new original-source mock observations independently rerun,8 probe-source hashes match. Backend coverage remains bounded to the units in its report. See [Coverage](COVERAGE.md).

The 5 browser cases cover login, top-up detail, profile, security and NCKH list. Canonical account evidence is `browser-profile-confirmed.json` and `browser-security-confirmed.json`; earlier selector diagnostics/pre-switch snapshots remain preserved and superseded. Captured JavaScript requests: **27, of which 26 HTTP 200 and 1 dev HMR abort**. Required observed screens rendered; captured console has no hydration exception. This is not a blanket “all chunks 200” or whole-browser-network claim.

Earlier API startup was not run because read-only authorization excluded startup auto-migration, not because13/12 history counts prove failure. Later SQL analysis found all12 current migrations applied, pending0/model-pendingfalse, actual max-column drift and exact optional legacy indexes. Extra known history alone is INFO. R1 local source integration and real B2 SQL rehearsal are now Verified in the [DB dossier](../FAH-DB-SYNC-001/VALIDATION.md);main apply and actual API/SQL evidence are now Verified;new browser/provider/full-matrix coverage remains incomplete. Actual ASP.NET/auth/SQL transactions/providers and broad browser coverage are not established by the old fixtures. Full-system verification remains incomplete.

## Ownership, files and resource ledger

The following ledger describes the earlier audit-only run. New DB migration/tool/test work is separately authorized and isolated; its current snapshot/resources belong to the DB dossier. Earlier321-source hashes remain historical screening evidence.

Actual roster: root `gpt-6.1-sol / medium` coordinates only after the user delegation instruction; backend auditor, UI auditor, runtime verifier, independent reviewer and document synthesizer each `gpt-6.1-sol / high`. Root checked the live model catalog before each dispatch. No Astra or child escalation; this synthesizer dispatches no children.

Allowed authored changes are paired task docs and audit evidence; no tracked product/test/contract/schema edits. The runtime did nevertheless write ignored `apps/web/.next` despite attempted custom distDir isolation. [Observation](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/ignored-next-output-observed.json) records that deviation; no cache deletion/restoration attempted without a baseline. Do not claim only artifacts were written.

Runtime owner released PID 27304 after restart, then PID 21404, ports 3137/3138 and its incognito tab. [Release evidence](../../../../artifacts/reports/error-audit-2026-10-29/deep/runtime/resource-release.json): both PIDs absent, no target listeners. Other processes/tabs/DB service preserved. No dependency installation, real database business-row writes, provider cost, actual submission, commit/push/merge/deploy or cleanup.

## Validation, risks and next step

[Validation](VALIDATION.md) separates historical checks, fresh behavioral evidence, independent review and current dossier checks. [Current synthesis checks](../../../../artifacts/reports/db-sync-2026-10-29/dossier/current-validation.json) record current document integrity;earlier synthesis/verification files remain historical and do not certify changed hashes.

Deferred: all product fixes, contract/correlation additions, recovery/persistence/retention policy, full SQL/provider/E2E verification and release. Next recommended step: review and approve a concrete remediation group with its contracts, test environment and acceptance before implementation. This report does not claim a fix, integration, release or fully verified system.
