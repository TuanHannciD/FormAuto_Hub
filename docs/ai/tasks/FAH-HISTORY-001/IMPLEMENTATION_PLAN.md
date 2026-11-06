# Generation history and separated pricing — Implementation Plan

> Current authority (2026-11-05): Task 1 independent reviews R1–R3 and user approval of L1/L2/P1/O1 plus reviewed contracts/schema are recorded in [PROGRESS](PROGRESS.md). Tasks 2–6 are authorized for local implementation and validation in the isolated worktree. Earlier proposal/pending wording below preserves design history; it does not reopen approved decisions. No production activation, live provider, commit or deployment authority is inferred.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development only when explicitly selected. Steps use checkbox syntax. No agent dispatch is authorized by this plan alone.

**Goal:** Retain 20 runs/user and support reuse, separating generation fees 0/1/2 from 1 credit per successful send.

**Architecture:** Add generation groups, immutable admitted-item snapshots and durable credit reservations. The dedicated credit service reserves/settles per attempt, SQL Server serializes account spending, and provider calls stay outside transactions and EF retries.

**Tech Stack:** Existing .NET 9, EF Core/SQL Server, Next.js 15/React 19, xUnit and Playwright; no new packages.

**Spec:** [Approved specification](INDEX.md). User approved the written specification on 2026-11-04. User selected subagent-per-task execution on 2026-11-05. Task 1 proposals/review are in progress; its explicit contract/financial approval gates still apply.

## Global Constraints

- Maximum 20 account-wide reusable runs; the 21st evicts the oldest from reuse without removing audit/ledger.
- 1–100 responses/run or job; sequential batches of 10; one active job/project.
- Creation fees: rules 0, default AI 1, custom AI 2 credits per valid persisted response.
- Each successful send costs 1 credit; confirmed failure releases funds, unknown remains reserved for reconciliation without automatic retry.
- Balance is posted ledger balance; available = Balance minus outstanding reservations; a reservation is not a debit/refund.
- Direct rules retains one Tạo và gửi ngay action without preview/second confirmation. AI/resends retain active preview/confirmation.
- No NCKH/auth/PayOS changes, official Google Forms API activation, background worker, physical purge or live providers.
- Base main df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c. Preserve/copy both untracked task INDEX files when isolating work; do not automatically commit.
- Current stage is Task 1 documentation and independent review under the approved subagent execution route. Establish isolation and DB/process ownership before product implementation; skill examples do not authorize installation, commit/push/deployment/cleanup.
- Credit/migration/submission-safety review must be independent. If agents are selected: Sol only, at most gpt-6.1-sol/high, inspect live catalog per dispatch and record model/effort/taskId. No dispatch during planning.

## Review Focus

- RF1: Google HTTP 200/302 login/error/unrecognized HTML must not be charged as successful; Task 4 tests classification.
- RF2: AI creation concurrent with another project's send must not spend reserved funds; Task 2 tests SQL concurrency.
- RF3: Eviction racing admission/sending blocks new admission without destroying admitted payloads; Tasks 3/4 test ordering.
- RF4: Lost commit acknowledgement after Google success must not cause provider/debit replay; Task 4 injects faults.
- RF5: Legacy/session switch/unknown/retry must not double-charge, show another user's data or resend uncertainty; Tasks 1/4/5 cover these.

## File map and proposed interfaces

New names below are proposals for Task 1 review, not existing contracts. Do not proceed to code while required contract/schema/lifecycle approval remains incomplete.

- Create entities: src/FormAutoHub.Api/Entities/GenerationBatch.cs, CreditReservation.cs, CreditReservationEvent.cs, SubmissionJobItem.cs. Responsibilities: group/reuse metadata, reservation, immutable reservation-change evidence, per-job payload/attempt/settlement link.
- Modify entities: GeneratedResponse.cs (nullable batch and legacy/new pricing policy), SubmissionJob.cs (owner/command/fingerprint), UserCreditAccount.cs only if review demonstrates need. Preserve Balance meaning.
- Persistence: Data/FormAutoHubDbContext.cs, Data/Migrations/<EF-generated timestamp>_GenerationHistoryAndReservations.cs plus designer/snapshot. Do not invent timestamps or edit old migrations.
- Create Contracts/GenerationHistoryDtos.cs, CreditReservationDtos.cs; modify Contracts/Phase3Dtos.cs, Phase6AiGenerateDtos.cs, Phase2Dtos.cs.
- Create Services/GenerationHistoryService.cs, GenerationBatchWriter.cs, CreditReservationService.cs, SubmissionSettlementService.cs, SubmissionCompatibilityService.cs.
- Modify Services/CreditService.cs, CreditWriteTransaction.cs, ResponseGenerationService.cs, AiGenerationService.cs, SubmissionAdmission.cs, SubmissionService.cs, DirectRuleSubmissionService.cs, Phase3Mappings.cs, DashboardService.cs; inspect AiAnalyticsService.cs for fee semantics.
- Create Controllers/GenerationHistoryController.cs; modify SubmissionsController.cs and Program.cs registration. No unreviewed reconciliation endpoint/public states.
- Integration: Integrations/GoogleForms/GoogleFormsClient.cs and GoogleFormSubmitResult (find its actual symbol/path before editing).
- Web relative to apps/web: create app/dashboard/forms/history/page.tsx, _components/GenerationHistory.tsx, _components/HistoryRunDetail.tsx; modify forms/page.tsx, _types.ts, _helpers.ts, _constants.ts, _components/WorkflowSummary.tsx, lib/api.ts, components/dashboard-shell.tsx.
- Tests are listed by task; preserve older tests and opt-in SQL fixtures, including their hardcoded task DB names.

Proposed C# interfaces, finalized by Task 1 before consumers:
- GetCreditAvailabilityAsync(Guid userId, CancellationToken ct) -> Task<CreditAvailabilityResponse>, including Balance, Reserved, Available.
- ReserveSubmissionAsync(Guid userId, Guid jobId, IReadOnlyList<Guid> itemIds, CancellationToken ct) -> Task<CreditReservationResult>; participates in admission transaction, no nested commit.
- SettleAttemptAsync(Guid itemId, VerifiedSubmissionOutcome outcome, CancellationToken ct) -> Task<SubmissionSettlementResult>; idempotent transaction after provider call.
- AppendBatchAsync(Guid projectId, string mode, IReadOnlyList<GeneratedResponse> responses, int requestedCount, int generationCredits, CancellationToken ct) -> Task<Guid>; same transaction as responses/debit and user-scoped retention lock.
- GetMineAsync(int page, int pageSize, CancellationToken ct) -> Task<GenerationHistoryPageResponse>; GetDetailAsync(Guid batchId, CancellationToken ct) -> Task<GenerationHistoryDetailResponse?>.
- VerifiedSubmissionOutcome distinguishes success/rejected/unknown internally; enum names/transitions require review, without silently replacing existing statuses.

## Task 1: Finalize contracts, legacy rules and migration direction

**Files:** Create paired CONTRACTS.md, DB_REVIEW.md, CUTOVER.md in dossier; propose canonical API_CONTRACT_GUIDE.md, DOMAIN_ENTITIES_OVERVIEW.md, ARCHITECTURE_BOUNDARIES.md updates only after review.

**Interfaces:** Consumes spec; produces reviewed contract/schema/state matrix and exact signatures above for Tasks 2–5.

- [ ] Document owner-scoped list/detail routes, send command/fingerprint/IDs/confirmation, creation/reservation/settlement responses and 400/404/409 errors; page>=1, pageSize 1..20 default10, time/id ordering.
- [ ] Document nullable legacy batch/policy, durable job items, reservations/events, unique item-to-ledger settlement and non-cascading FKs. Establish consistent user/account -> project -> batch -> item lock ordering everywhere.
- [ ] Document planned/possible dispatch/known outcome/settled/released/unknown transitions; Failed does not prove no remote send. Command replay never dispatches.
- [ ] Finalize legacy confirmed failures without any success: propose retaining prepaid first-success entitlement, consumed atomically upon success; unknown requires reconciliation. Obtain approval of this spec-Deferred decision before code.
- [ ] Specify compatibility checks against read-only refreshed entry IDs/types/options/required metadata; insufficient evidence blocks sending. Define Google body/redirect success evidence, not HTTP status alone.
- [ ] Document quiesce/drain, provable entitlement backfill without timestamp grouping, old-client resume/version behavior and evidence-based reconciliation. No operator mutation tool/API without authorization/audit review.
- [ ] Self-review and obtain authorized independent contract/DB review; present new decisions for user approval. Plan approval does not silently approve unpresented schema/statuses. Output must leave no Deferred financial decisions blocking dependent code.

**Verification:** Check 0/1/2+1, 20/100/10, ownership/legacy/unknown matrices and paired UTF-8/links. No DB/provider operations yet.

## Task 2: Durable credit reservations and settlement

**Files:** Entities/persistence/credit interfaces from file map, Services/CreditService.cs; create tests/FormAutoHub.Tests/GenerationCreditReservationTests.cs, GenerationHistorySqlFixture.cs, GenerationCreditReservationSqlTests.cs.

**Interfaces:** Consumes reviewed Task 1 schema; produces GetCreditAvailabilityAsync, ReserveSubmissionAsync, SettleAttemptAsync. Generation deduction checks Available; settlement converts its own held amount into a debit.

- [ ] Write tests: Balance10 reserve7 -> Balance10/Reserved7/Available3 with no debit/TotalUsed; success1 -> Balance9/Reserved6/Available3 with one debit; reject1 -> Reserved5/Available4; unknown unchanged; replay success leaves debit count1.
- [ ] Run dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter FullyQualifiedName~GenerationCreditReservation; verify failure from missing behavior rather than missing configuration.
- [ ] Implement reviewed services/entities/migration; atomically persist successful outcome/debit/reservation consumption/usage; verify event uniqueness/counter invariants and no refund on release.
- [ ] All deductions use Available, account locks/version and local-SQL-only execution retries; cover absent accounts, balance0, fractional balance and concurrent topup without lost update.
- [ ] Add dedicated FormAutoHub_History_Safety_20261104 SQL fixture with FAH_HISTORY_SQL_SERVER/FAH_HISTORY_SQL_DATABASE opt-in and machine/database identity verification every run; do not reuse prior task DB fixtures.
- [ ] Apply migration to owned clean and verified baseline DBs; SQL tests cover two projects/send-versus-AI overspend, rollback/commit-ack/replay debits and preserved historical counts/ledger. InMemory cannot replace SQL gates.
- [ ] Rerun focused tests and independently read persisted results. Obtain independent migration/credit review before dependent work; no deployment. Record checkpoint; commit only with permission.

## Task 3: Twenty-run persistence and generation pricing

**Files:** GenerationBatchWriter.cs, GenerationHistoryService.cs, ResponseGenerationService.cs, AiGenerationService.cs, related entities/model; create GenerationHistoryServiceTests.cs, GenerationHistorySqlTests.cs; update AiGenerationServiceTests.cs, Phase3FormAutomationTests.cs.

**Interfaces:** Consumes Task 2 availability/deduction; produces AppendBatchAsync and list/detail methods from file map.

- [ ] Write tests: rules100 with balance0 creates100/debit0; AI10 default/custom debits10/20; zero valid produces no batch/debit; partial3 costs3/6; request101 rejected.
- [ ] Run dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter "FullyQualifiedName~GenerationHistory|FullyQualifiedName~AiGenerationServiceTests"; verify failure for new pricing/quota.
- [ ] Implement atomic batch/responses/generation debit; rules never calls DeductUsageCreditsAsync with amount0; AI calls outside SQL retry, valid responses and debit commit together.
- [ ] Implement stable account-wide 20-slot retention and owner-scoped list/detail; supplementary requests are new runs; reject evicted response read/reuse except admitted job snapshots.
- [ ] SQL tests append21 leaves20, failure never evicts, concurrent appends and append/admission follow lock order; AI analytics aggregates creation fees without send fees.
- [ ] Rerun those tests plus Phase3FormAutomationTests; verify pagination/ownership/no raw audit; checkpoint and independently review changed credit paths.

## Task 4: Sending/resending, success classification and recovery

**Files:** SubmissionCompatibilityService.cs, SubmissionSettlementService.cs, SubmissionAdmission.cs, SubmissionService.cs, DirectRuleSubmissionService.cs, GoogleFormsClient.cs, controllers/contracts/DI; create GenerationHistorySubmissionTests.cs, GenerationHistorySubmissionSqlTests.cs, GoogleFormsOutcomeTests.cs; update DirectRuleSubmissionServiceTests.cs, DirectRuleSubmissionSqlServerTests.cs, FahErrSubmissionPersistenceTests.cs.

**Interfaces:** Consumes Tasks 2–3; admission snapshots/reserves; SettleAttemptAsync accepts verified integration outcomes, not current response status.

- [ ] Write tests: select10, reserve10, success7/failure2/unknown1 -> debit7/reserved1; command replay leaves original provider-call count; a new confirmed resend command settles another1.
- [ ] Test Google HTTP200 login/error, 302 auth redirect, malformed/truncated body, timeout and success fixtures without false success debits; pre-send structure mismatch yields no provider call or hold leak.
- [ ] Run dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter "FullyQualifiedName~GenerationHistorySubmission|FullyQualifiedName~GoogleFormsOutcome"; verify red.
- [ ] Implement shared admission replay, explicit confirmation and batch eligibility; preserve direct-rules affordable subset/one action; do not merely remove existing status/log guards.
- [ ] Persist planned items before sends and possible dispatch before calls; immutable payload/outcomes are independent of latest response status. Crashes fail closed and execution strategies never replay external calls.
- [ ] Implement atomic outcome settlement; pause/cancel releases only after runner acknowledgement; no TTL-based unknown release.
- [ ] SQL faults cover pre-send SaveChanges, post-Google-success persistence, lost commit acknowledgement, same/different commands, two projects, in-flight pause/cancel and eviction; verify logs/ledger/receiver calls independently.
- [ ] Test Task 1 legacy unattempted/success/unknown rules with no double charging or double entitlement use. Reconciliation/replay never calls Google.
- [ ] Rerun Task 4 suites plus DirectRuleSubmission/FahErrSubmissionPersistence; obtain independent safety/credit review of the new snapshot.

## Task 5: Dashboard history, fee breakdown and resend

**Files:** Web paths in file map; create apps/web/tests/generation-history.spec.ts; update form-automation.spec.ts, direct-rule-submission.spec.ts, fah-err-forms-errors.spec.ts; backend DashboardService.cs, Phase2Dtos.cs and lib/api.ts.

**Interfaces:** Consumes reviewed history list/detail, available/reserved and command send APIs; frontend does not own balance or provider success authority.

- [ ] Apply repository Impeccable/UI UX Pro Max workflow when UI work starts; read complete consumers. Reuse existing tokens/BaseTable/PaginationControls/Alert; avoid unrelated layout changes.
- [ ] Write Playwright tests for20 runs/10-per-page, detail100, selection/x1 fee, resend warning, command replay, expired run, unknown lock, clearing old-user data after logout/session switch and read-only status restoration after reload.
- [ ] Run npx playwright test tests/generation-history.spec.ts --project=chromium from apps/web against an owned server/profile; verify red from missing UI.
- [ ] Implement history route/components, stable selection and session/owner guards; explicit resend confirmation, incompatible/stale form rejection, pending mutation lock and no automatic POST retries.
- [ ] Update rules0/AI1/2+send1 breakdown and form/dashboard available/reserved; preserve posted currentCreditBalance meaning. Update typed DTOs/resume version; stored browser balance is never authoritative.
- [ ] Fixture browser checks at1366/390/320 plus keyboard/empty/loading/error/hydration/chunks; run all three consumer suites and new suite. Separate mocked browser from API/SQL integration evidence.
- [ ] Run npm run lint, npm run test:auth, npm run build in apps/web; checkpoint/review UI/API binding without claiming live Google verification.

## Task 6: Cutover rehearsal, runtime and final review

**Files:** Paired CUTOVER.md, VALIDATION.md, HANDOFF.md; canonical API/entities/boundaries/UI_CREDIT_FOLLOWUP_SYNC updates only for approved changes, synchronized across languages.

**Interfaces:** Consumes frozen Tasks 1–5 snapshot; produces evidence/review handoff, without automatic release.

- [ ] Verify runtime identity before starting: Program.cs automatically migrates DB, so only start after owned test DB/schema permission checks; record DB/migrations/account/ports/process/browser ownership.
- [ ] Rehearse old-generation/send quiesce, job drain, reviewed migration/backfill, entitlement and 20-slot eligibility verification; no historical debit rewriting. Unresolved legacy/unknown policy blocks cutover.
- [ ] Rehearse synthetic-evidence success/non-success reconciliation with actor/reason audit and idempotent replay; inadequate operational evidence blocks production activation, without inventing an unreviewed endpoint.
- [ ] Run dotnet build FormAutoHub.sln -c Release and dotnet test FormAutoHub.sln -c Release; run new SQL opt-in tests separately with no skipped required SQL gates.
- [ ] Restart owned API/web on intended source/schema; real User JWT, wrong-owner/Admin checks, HTTP history/detail/generate/send, safe loopback Google/fake AI; independently verify SQL balances/holds/logs and receiver-call counts.
- [ ] Use T3 preview_status then preview_open if needed; verify history reload/session, AI confirmation/rules direct, chunk200/hydration/console and API logs. Screenshots/mocks do not prove DB behavior.
- [ ] Independently review the complete new diff; after fixes rerun/re-review affected gates. Missing permission/reviewer blocks the gate while other authorized work continues.
- [ ] Synchronize docs and verify UTF-8/links/diff; report Summary/Files/Scope/Validation performed/not performed/Risks/Next; preserve evidence. No automatic DB/worktree/log cleanup, commit/push/deployment.

## Self-review and execution handoff

- Spec coverage: pricing/holds Task2; quota/generation Task3; resends/unknown/legacy Tasks1+4; UI/session Task5; cutover/runtime/review Task6.
- RF1–RF5 each have an assigned test/task. Proposed signatures/types are consistent; Task1 finalizes them before consumers.
- Spec-Deferred legacy failures/reconciliation are Task1/6 decision/cutover gates, not silently chosen business rules.
- Verified during planning: read-only source discovery and script/config inspection; document UTF-8/link/paired-section checks run separately. No application tests executed during planning.
- Not run: product builds/tests/SQL/browser/provider/independent review; no implementation.
- Execution selected: Subagent-driven (worker/reviewer per task), 2026-11-05. Preserve model ceilings, actual scope/permissions and Task 1 approval gates.
- The prior Inline recommendation was not selected. Use fresh task implementers and independent reviewers; do not start dependent product code before required Task 1 decisions are approved.
