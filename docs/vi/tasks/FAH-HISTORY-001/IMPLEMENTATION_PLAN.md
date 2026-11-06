# Lịch sử tạo và tách phí — Implementation Plan

> Thẩm quyền hiện tại (2026-11-05): Review độc lập Task 1 qua R1–R3 và việc người dùng duyệt L1/L2/P1/O1 cùng contract/schema đã review được ghi tại [PROGRESS](PROGRESS.md). Tasks 2–6 được phép triển khai và kiểm thử cục bộ trong worktree riêng. Các nhãn đề xuất/chờ duyệt bên dưới lưu lịch sử thiết kế, không mở lại quyết định đã duyệt. Không suy ra quyền kích hoạt production, gọi provider thật, commit hay deploy.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development only when explicitly selected. Steps use checkbox syntax. No agent dispatch is authorized by this plan alone.

**Goal:** Lưu 20 lượt tạo/user và cho phép gửi lại, tách phí tạo 0/1/2 khỏi phí 1 credit/bản gửi thành công.

**Architecture:** Thêm nhóm lượt tạo, snapshot từng bản được admission và khoản giữ credit bền vững. Dedicated credit service giữ/quyết toán theo attempt, SQL Server đồng bộ chi tiêu toàn tài khoản; provider call nằm ngoài transaction và retry EF.

**Tech Stack:** .NET 9, EF Core/SQL Server, Next.js 15/React 19, xUnit và Playwright hiện có; không thêm package.

**Spec:** [Đặc tả đã duyệt](INDEX.md). Người dùng duyệt văn bản ngày 2026-11-04. Người dùng chọn subagent theo từng task ngày 2026-11-05. Task 1 đang soạn/review đề xuất; các gate duyệt contract/tài chính của task vẫn giữ.

## Global Constraints

- Mỗi user tối đa 20 lượt trên toàn tài khoản; lượt 21 loại lượt cũ nhất khỏi reuse, không xóa audit/ledger.
- Mỗi lượt/job 1–100 bản; gửi tuần tự batch 10; một active job/project.
- Tạo rules 0; AI mặc định 1; AI tùy chỉnh 2 credit/bản hợp lệ đã lưu.
- Mỗi bản gửi thành công 1 credit; thất bại xác định giải phóng; unknown giữ chờ đối soát, không tự retry.
- Balance là số dư đã ghi sổ; available = Balance − khoản giữ chưa quyết toán; giữ không phải debit/refund.
- Rules direct vẫn một Tạo và gửi ngay, không preview/xác nhận thứ hai. AI và resend giữ preview/xác nhận chủ động.
- Không đổi NCKH/auth/PayOS, không tự bật official Google Forms API, background worker, physical purge hay live provider.
- Base main df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c. Hai INDEX hiện untracked là tài liệu task cần bảo toàn/copy khi tạo checkout; không tự commit.
- Giai đoạn hiện tại là tài liệu và review độc lập Task 1 theo phương thức subagent đã duyệt. Isolation, DB/process owner phải xác định trước code sản phẩm; không cài dependency, commit/push/deploy/cleanup theo ví dụ skill.
- Review credit/migration/submission safety phải độc lập. Nếu chọn agent: chỉ Sol tối đa gpt-6.1-sol/high, kiểm live catalog mỗi lần, lưu model/effort/taskId. Chưa dispatch ở bước lập plan.

## Review Focus

- RF1: Google trả HTTP 200/302 nhưng là login/error/HTML lạ: không debit như thành công; Task 4 kiểm phân loại.
- RF2: Tạo AI đồng thời gửi ở project khác cùng user: không tiêu phần đang giữ; Task 2 kiểm SQL concurrency.
- RF3: Eviction trùng admission/job đang gửi: chặn admission mới nhưng job đã nhận không mất payload; Task 3 và 4 kiểm race.
- RF4: Mất commit acknowledgement sau Google success: replay không gọi provider/debit lần hai; Task 4 kiểm fault injection.
- RF5: Legacy, đổi phiên đăng nhập, unknown và retry: không double-charge/đọc dữ liệu user cũ/gửi lại unknown; Task 1, 4, 5 kiểm.

## File map và giao diện dự kiến

Tên mới dưới đây là đề xuất cho review Task 1, không phải contract hiện hành. Không tự chuyển sang code nếu contract/schema/lifecycle còn chưa được duyệt.

- Create entities: src/FormAutoHub.Api/Entities/GenerationBatch.cs, CreditReservation.cs, CreditReservationEvent.cs, SubmissionJobItem.cs. Group/reuse metadata; khoản giữ; evidence thay đổi giữ; immutable per-job payload/attempt/settlement link.
- Modify entities: GeneratedResponse.cs (nullable batch + pricing policy legacy/new), SubmissionJob.cs (owner/command/fingerprint), UserCreditAccount.cs chỉ nếu review chứng minh cần. Không đổi nghĩa Balance.
- Modify persistence: Data/FormAutoHubDbContext.cs, Data/Migrations/<EF-generated timestamp>_GenerationHistoryAndReservations.cs + designer/snapshot. Không đoán timestamp hoặc sửa migration cũ.
- Create Contracts/GenerationHistoryDtos.cs, CreditReservationDtos.cs; modify Contracts/Phase3Dtos.cs, Phase6AiGenerateDtos.cs, Phase2Dtos.cs.
- Create Services/GenerationHistoryService.cs, GenerationBatchWriter.cs, CreditReservationService.cs, SubmissionSettlementService.cs, SubmissionCompatibilityService.cs.
- Modify Services/CreditService.cs, CreditWriteTransaction.cs, ResponseGenerationService.cs, AiGenerationService.cs, SubmissionAdmission.cs, SubmissionService.cs, DirectRuleSubmissionService.cs, Phase3Mappings.cs, DashboardService.cs; kiểm AiAnalyticsService.cs theo nghĩa phí.
- Create Controllers/GenerationHistoryController.cs; modify SubmissionsController.cs và Program.cs registration. Không tạo reconciliation endpoint/public state chưa duyệt.
- Integration: Integrations/GoogleForms/GoogleFormsClient.cs và GoogleFormSubmitResult (tìm symbol/path hiện tại trước sửa).
- Web: create app/dashboard/forms/history/page.tsx, _components/GenerationHistory.tsx, _components/HistoryRunDetail.tsx; modify forms/page.tsx, _types.ts, _helpers.ts, _constants.ts, _components/WorkflowSummary.tsx, lib/api.ts, components/dashboard-shell.tsx. Đường dẫn tương đối dưới apps/web.
- Tests: các file được liệt kê theo task; giữ tests cũ và opt-in SQL fixtures cũ, không thay tên DB hardcoded của task trước.

Giao diện C# dự kiến, review Task 1 khóa chữ ký trước khi Task 2–5 dùng:
- GetCreditAvailabilityAsync(Guid userId, CancellationToken ct) -> Task<CreditAvailabilityResponse>, gồm Balance, Reserved, Available.
- ReserveSubmissionAsync(Guid userId, Guid jobId, IReadOnlyList<Guid> itemIds, CancellationToken ct) -> Task<CreditReservationResult>; nằm trong admission transaction, không tự commit lồng.
- SettleAttemptAsync(Guid itemId, VerifiedSubmissionOutcome outcome, CancellationToken ct) -> Task<SubmissionSettlementResult>; idempotent, mở transaction riêng sau provider call.
- AppendBatchAsync(Guid projectId, string mode, IReadOnlyList<GeneratedResponse> responses, int requestedCount, int generationCredits, CancellationToken ct) -> Task<Guid>; cùng transaction lưu responses/debit, khóa retention theo user.
- GetMineAsync(int page, int pageSize, CancellationToken ct) -> Task<GenerationHistoryPageResponse>; GetDetailAsync(Guid batchId, CancellationToken ct) -> Task<GenerationHistoryDetailResponse?>.
- VerifiedSubmissionOutcome phân biệt success/rejected/unknown nội bộ; tên enum và transition cần review, không thay statuses hiện có ngầm.

## Task 1: Khóa contract, legacy và hướng migration

**Files:** Create paired CONTRACTS.md, DB_REVIEW.md, CUTOVER.md trong dossier; proposed canonical updates API_CONTRACT_GUIDE.md, DOMAIN_ENTITIES_OVERVIEW.md, ARCHITECTURE_BOUNDARIES.md chỉ sau review.

**Interfaces:** Consumes spec; produces reviewed contract/schema/state matrix và exact signatures nêu trên cho Task 2–5.

- [ ] Ghi owner-scoped list/detail routes, send request command/fingerprint/IDs/confirmation, response creation fee/hold/settlement và lỗi 400/404/409; pagination page>=1, pageSize 1..20, default 10, sort time/id.
- [ ] Ghi schema nullable legacy batch/policy, durable job items, reservations/events, settlement unique item->ledger và non-cascading FK. Ghi lock order thống nhất user/account -> project -> batch -> item cho mọi workflow.
- [ ] Ghi state transitions: planned, possible dispatch, known outcome, settled/released/unknown; không đồng nhất Failed với chắc chắn chưa gửi. Job replay cùng command không dispatch.
- [ ] Chốt legacy confirmed-failure chưa từng success: đề xuất giữ quyền first-success đã trả phí, tiêu entitlement atomically khi success; unknown luôn cần đối soát. Đây là quyết định Deferred trong spec, xin duyệt trước code.
- [ ] Ghi compatibility check so entry IDs/type/options/required với metadata đọc lại mà không ghi project; nếu không đủ thông tin thì chặn. Chốt tín hiệu Google success theo body/redirect; HTTP status riêng không chứng minh success.
- [ ] Ghi cutover quiesce/drain, snapshot legacy entitlement không suy timestamp, resume payload/version của client cũ, và phương án đối soát có bằng chứng. Chưa mở admin mutation/tool reconciliation trước review quyền và audit.
- [ ] Tự review + lấy review contract/DB độc lập khi có quyền; trình người dùng chốt các quyết định mới. Không coi plan approval là phê duyệt schema/status chưa được trình bày. Đầu ra phải đủ cho implementer, không còn quyết định tài chính Deferred trước code phụ thuộc.

**Verification:** ma trận 0/1/2+1, 20/100/10, owner/legacy/unknown và link/UTF-8 AI/VI khớp. Chưa chạy DB/provider.

## Task 2: Khoản giữ credit và settlement bền vững

**Files:** entities/persistence/credit interfaces từ file map, Services/CreditService.cs; create tests/FormAutoHub.Tests/GenerationCreditReservationTests.cs, GenerationHistorySqlFixture.cs, GenerationCreditReservationSqlTests.cs.

**Interfaces:** Consumes reviewed Task 1 schema; produces GetCreditAvailabilityAsync, ReserveSubmissionAsync, SettleAttemptAsync. Generation debit kiểm Available; settlement chuyển chính khoản đã giữ thành debit.

- [ ] Viết tests Balance10 reserve7 -> Balance10/Reserved7/Available3, không debit/TotalUsed; success1 -> Balance9/Reserved6/Available3 và đúng một debit; reject1 -> Reserved5/Available4; unknown không đổi. Replay success giữ debit count1.
- [ ] Chạy dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter FullyQualifiedName~GenerationCreditReservation; xác nhận đỏ vì chưa có implementation, không vì cấu hình thiếu.
- [ ] Implement service/entity/migration theo contract; success atomically lưu outcome+debit+release hold+usage; event uniqueness/counters kiểm invariant, giải phóng không refund.
- [ ] Mọi deduction dùng Available, row lock/version và execution retry chỉ local SQL; kiểm absent account/balance0/fractional balance, concurrency với topup không mất update.
- [ ] Tạo fixture SQL riêng tên FormAutoHub_History_Safety_20261104, opt-in FAH_HISTORY_SQL_SERVER/FAH_HISTORY_SQL_DATABASE, verify machine/database trước mỗi run; không dùng fixture DB task cũ.
- [ ] Apply migration trên DB sạch và bản baseline riêng đã xác minh owner; SQL tests hai projects/send-vs-AI không overspend, rollback/commit-ack/replay không double debit, migration giữ counts/ledger. EF InMemory không thay gate SQL.
- [ ] Rerun focused tests và kiểm persisted independent contexts. Review độc lập migration/credit trước dùng làm nền; chưa deploy. Ghi snapshot/checkpoint, commit chỉ nếu có quyền.

## Task 3: Lưu nhóm 20 lượt và cập nhật phí tạo

**Files:** GenerationBatchWriter.cs, GenerationHistoryService.cs, ResponseGenerationService.cs, AiGenerationService.cs, entities/model liên quan; create GenerationHistoryServiceTests.cs, GenerationHistorySqlTests.cs; update AiGenerationServiceTests.cs, Phase3FormAutomationTests.cs.

**Interfaces:** Consumes Task 2 availability/deduction; produces AppendBatchAsync và list/detail methods trong file map.

- [ ] Viết tests rules100 balance0 vẫn tạo100/debit0; AI10 default/custom debit10/20; zero valid không batch/debit; partial3 chỉ thu3/6; request101 bị chặn.
- [ ] Chạy dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter "FullyQualifiedName~GenerationHistory|FullyQualifiedName~AiGenerationServiceTests"; xác nhận fail theo giá/quota mới.
- [ ] Implement atomic batch+responses+generation debit; rules không gọi DeductUsageCreditsAsync với amount0; AI gọi provider ngoài SQL retry, chỉ ghi dữ liệu hợp lệ với debit commit cùng.
- [ ] Implement account-wide stable 20-slot retention và list/detail owner scope; request bổ sung là lượt mới; reject evicted IDs ở cả responses read/reuse paths, trừ job snapshot đã admission.
- [ ] SQL tests append21 giữ20, fail không eviction, concurrent append và append-vs-admission có thứ tự khóa; AI analytics tổng phí tạo không gồm phí gửi.
- [ ] Rerun tests trên và Phase3FormAutomationTests; kiểm list pagination/owner/no raw audit; checkpoint kết quả và independent review phần credit thay đổi.

## Task 4: Gửi/gửi lại, xác nhận success và phục hồi

**Files:** SubmissionCompatibilityService.cs, SubmissionSettlementService.cs, SubmissionAdmission.cs, SubmissionService.cs, DirectRuleSubmissionService.cs, GoogleFormsClient.cs, controllers/contracts/DI; create GenerationHistorySubmissionTests.cs, GenerationHistorySubmissionSqlTests.cs, GoogleFormsOutcomeTests.cs; update DirectRuleSubmissionServiceTests.cs, DirectRuleSubmissionSqlServerTests.cs, FahErrSubmissionPersistenceTests.cs.

**Interfaces:** Consumes Tasks 2–3; admission snapshots/reserves; SettleAttemptAsync nhận outcome từ integration đã xác minh, không suy success từ response status hiện tại.

- [ ] Viết tests 10 selected: reserve10, success7/failure2/unknown1 -> debit7, reserved1; retry command gọi provider đúng số ban đầu; new confirmed command resend success trả thêm phí1.
- [ ] Viết tests Google HTTP200 login/error, 302 auth redirect, malformed/truncated body, timeout và success fixture: không falsely debit; pre-send structure mismatch -> no provider/no hold leak.
- [ ] Chạy dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter "FullyQualifiedName~GenerationHistorySubmission|FullyQualifiedName~GoogleFormsOutcome"; xác nhận đỏ.
- [ ] Implement common admission command replay, explicit confirmation và batch eligibility; direct rules giữ affordable subset và một action; không chỉ bỏ existing status/log guard.
- [ ] Persist planned item trước send; đánh dấu possible dispatch trước call; snapshot payload/read outcome độc lập với latest response status. Crash trước/giữa call fail-closed; provider call không bị execution strategy chạy lại.
- [ ] Implement atomic outcome settlement, pause/cancel releases chỉ khi runner xác nhận ngừng; unknown không auto-release theo TTL.
- [ ] SQL fault tests SaveChanges trước send, sau Google success, commit-ack loss, same/different commands, two projects, pause/cancel in-flight, eviction race; độc lập kiểm logs/ledger/receiver calls.
- [ ] Test legacy chưa attempt/đã success/unknown theo Task 1; no-double-charge, entitlement không bị dùng hai lần. Reconciliation test quyết toán/lặp lại không gọi Google.
- [ ] Rerun Task4 suites cùng DirectRuleSubmission/FahErrSubmissionPersistence; review độc lập safety/credit của snapshot mới.

## Task 5: Dashboard lịch sử, fee breakdown và gửi lại

**Files:** web paths trong file map; create apps/web/tests/generation-history.spec.ts; update form-automation.spec.ts, direct-rule-submission.spec.ts và fah-err-forms-errors.spec.ts; backend DashboardService.cs, Phase2Dtos.cs, lib/api.ts.

**Interfaces:** Consumes reviewed API list/detail, available/reserved and command send; không frontend tự tính balance hay xác nhận provider outcome.

- [ ] Dùng Impeccable/UI UX Pro Max theo rules dự án khi bắt đầu UI, đọc consumers hoàn chỉnh. Giữ tokens/primitives BaseTable/PaginationControls/Alert, không đổi layout ngoài phạm vi.
- [ ] Viết Playwright tests list20/10perpage, detail100, selection và phí x1, warning resend, pending command replay, expired run, unknown locked, wrong-user/logout clears displayed data, reload restores read-only status.
- [ ] Chạy npx playwright test tests/generation-history.spec.ts --project=chromium trong apps/web với server/profile owned; xác nhận fail vì thiếu UI.
- [ ] Implement history route/components, stable selection và owner/session guard; gửi lại giữ explicit confirm; stale/mismatched form chặn; disable mutation đang pending và không auto retry POST.
- [ ] Cập nhật fee breakdown rules0/AI1/2 + send1, available/reserved tại form/dashboard; giữ currentCreditBalance nghĩa posted balance. Update typed DTOs/resume version, không dùng saved browser balance làm authority.
- [ ] Kiểm browser fixture tại 1366/390/320, keyboard, empty/loading/error, hydration/chunks; chạy ba suites consumers và test mới. Phân biệt mocked browser với API/SQL integration.
- [ ] Chạy npm run lint, npm run test:auth, npm run build trong apps/web; checkpoint/review UI và API binding, chưa claim Google live.

## Task 6: Cutover rehearsal, runtime và review cuối

**Files:** paired CUTOVER.md, VALIDATION.md, HANDOFF.md trong dossier; canonical API/entities/boundaries/UI_CREDIT_FOLLOWUP_SYNC chỉ cập nhật approved changes, AI/VI cùng nghĩa.

**Interfaces:** Consumes Tasks 1–5 frozen snapshot; produces evidence/review handoff, không tự release.

- [ ] Kiểm runtime identity trước khởi động: Program.cs tự Database.Migrate nên chỉ chạy API khi test DB riêng/schema được phép; ghi DB/migration/account/ports/process/browser owner.
- [ ] Rehearse quiesce legacy generation/send, drain jobs, migrate+backfill đã review, verify entitlement và 20-slot eligibility; không rewrite historical debit. Có unresolved legacy/unknown policy thì Blocked cutover.
- [ ] Rehearse reconciliation success/non-success với bằng chứng synthetic, audit actor/reason, replay idempotent; operational source-of-truth chưa đủ thì Blocked production activation, không tự tạo endpoint ngoài contract.
- [ ] Chạy dotnet build FormAutoHub.sln -c Release và dotnet test FormAutoHub.sln -c Release; explicit SQL opt-in mới chạy riêng, yêu cầu không skip các gate SQL task.
- [ ] Restart owned API/web đúng source/schema; JWT User thật, sai owner, Admin, HTTP list/detail/generate/send; safe loopback Google và fake AI, kiểm SQL độc lập tiền/hold/log và receiver request count.
- [ ] Browser T3 preview_status rồi preview_open nếu cần; kiểm history reload/session, AI confirm/rules direct, chunk200/hydration/console và relevant API logs. Không dùng hình/mock làm bằng chứng DB.
- [ ] Review toàn diff mới bởi reviewer độc lập; sau fix rerun/review lại affected gates. Nếu chưa có quyền hoặc reviewer thì Blocked gate, tiếp tục phần khác được phép.
- [ ] Sync docs, UTF-8/link/diff checks; report Summary/Files/Scope/Validation performed/not performed/Risks/Next; giữ evidence. Không tự xóa DB/worktree/log, commit/push/deploy.

## Tự rà soát và handoff thực thi

- Spec coverage: pricing/holds Task2; quota/generation Task3; resend/unknown/legacy Task1+4; UI/session Task5; cutover/runtime/review Task6.
- RF1–RF5 đều có task/test chỉ định. Chữ ký/types chỉ là đề xuất thống nhất, Task1 khóa trước khi consumer triển khai.
- Không bỏ qua Deferred trong spec: legacy failed và reconciliation được đưa vào Task1/Task6 như decision/cutover gates, không tự chọn thành business truth.
- Verified khi lập plan: read-only source discovery, script/config inspection; văn bản sẽ kiểm UTF-8/link/section pair. Không có test app đã chạy trong lượt lập plan.
- Not run: product builds/tests/SQL/browser/provider/independent review; chưa triển khai.
- Phương thức đã chọn: Subagent-driven (worker/reviewer từng task), ngày 2026-11-05. Giữ model cap, quyền/phạm vi thực tế và các gate duyệt Task 1.
- Khuyến nghị Inline trước đây không được chọn. Dùng implementer mới và reviewer độc lập từng task; chưa code sản phẩm phụ thuộc trước khi các quyết định bắt buộc Task 1 được duyệt.
