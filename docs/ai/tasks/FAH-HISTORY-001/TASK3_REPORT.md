# Task 3 — Báo cáo triển khai

## Summary

Đã triển khai cục bộ generation/history Task3 trong worktree `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`; nền Task2 uncommitted được giữ nguyên. Implementer duy nhất: `/root/history_task3`, `gpt-6.1-sol/high`, không agent con. Snapshot bắt đầu: `artifacts/reports/fah-history-001/task3-baseline-20261105-123140/` (37 SHA256); baseline50/50 do root ghi nhận. Báo cáo này bàn giao cho review độc lập, không tuyên bố Done/tích hợp/release.

Rules standalone tạo1–100 phản hồi với phí0 kể cả balance0/không account. AI default/custom tính1/2 trên số phản hồi hợp lệ thực sự lưu, giữ nguyên RunId/Source/status và analytics expenditure. Mỗi request bổ sung thành một run;20 run mới nhất toàn account, run21 evict logic theo SQL `(CreatedAt DESC,Id DESC)`, không xóa payload/audit/ledger.

## Files changed

16 source/test files thay đổi riêng Task3:

- Thêm `Contracts/GenerationHistoryDtos.cs`; sửa `Contracts/Phase3Dtos.cs`, `Phase6AiGenerateDtos.cs`: chỉ các trường generation được review (`GenerationBatchId`, `GenerationFeePerResponse`, `Credits`); history DTO đúng hợp đồng.
- Thêm `Services/GenerationBatchWriter.cs`, `GenerationHistoryService.cs`; đăng ký2 interface trong `Program.cs`. Chưa tạo history controller/route mới.
- Sửa `ResponseGenerationService.cs`, `AiGenerationService.cs`: pricing, shared append, exact replay, stable IDs/completion time, metadata chụp trước provider, owner-before-validation/audit, recovery lọc eligible/proven legacy và trả null→404 khi explicit IDs chứa expired/missing/unowned.
- Sửa `Services/CreditWriteTransaction.cs`: read callback nhận context/token; local SQL retry giữ prepared output; lost commit acknowledgement không transient cũng quan sát durable state bằng context mới/token chẩn đoán trước khi trả kết quả. Provider không nằm trong retry. Failed audit replay giữ MissingCredits đúng như lần commit đầu.
- Sửa `Data/FormAutoHubDbContext.cs`: guard immutable batch snapshot/membership/payload/policy, cấm physical deletion và reverse/rewrite EvictedAt; giữ mutable response Status cho consumer hiện tại. Không đổi model/schema/migration.
- Thêm `GenerationHistoryServiceTests.cs`, `GenerationHistorySqlTests.cs`; sửa `AiGenerationServiceTests.cs`, `Phase3FormAutomationTests.cs`, `FahErrAiErrorContractTests.cs`, `GenerationCreditReservationConsumerSqlTests.cs`. Hai consumer regressions mất Available/failure audit trước đây của rules được chuyển sang actual AI consumer vì standalone rules nay miễn phí; assertions debit/audit durability giữ nguyên. Existing direct tests không sửa pricing expectation.
- Paired `TASK3_REPORT.md`; log tại `artifacts/reports/fah-history-001/`. Root sở hữu dossier ledger/review packaging và DB/process lifecycle.

## Scope alignment

`AppendBatchAsync` dùng transaction/ordered locks của caller, không commit/nest transaction: Users→account→các project parent theo SQL order→batch→membership; SaveChanges nội bộ vẫn nằm trong transaction caller. Batch/responses/debit qua dedicated CreditService/usage/retention cùng commit. Batch ID=first response ID cố định; replay kiểm exact ordered membership, payload và giá, không thêm slot/usage/debit. Timestamp và observation giữ nguyên qua local retry. Creation metadata `Partial`, receipt `Unknown`; Required/Constraints và empty/unproven options giữ null. Incomplete observation không chặn creation.

History owner-only (Admin không tự có quyền): defaults1/10, page>=1, size1..20, distant page không overflow, SQL consistent read count/page, detail<=100 theo ordinal, expired/unowned absent, không raw AI/provider audit. Outcomes đếm attempt; legacy bool Success/Failed không tự trở thành receiver proof. New rows `SeparatedV1`/`NotApplicable`, không import/backfill/đoán legacy entitlement.

**Ranh giới Task4 theo ruling của root:** `GenerateForSubmissionAsync` đang được legacy DirectRuleSubmissionService gọi trong legacy admission; giữ giá1/phản hồi và affordable subset cũ, không đưa nhánh này vào history mới cho tới Task4 wiring reservation/settlement. Điều này tránh vô tình kích hoạt direct send miễn phí. Standalone rules0 và AI1/2 đã đổi, nhưng selected-send consumer cũ chưa thu send fee mới. Không được coi snapshot này là end-to-end pricing đã tích hợp hoặc activation/cutover; không có live send/provider. Task4 phải nối eligibility/contract version/hold/settlement, Task5 mới UI.

## Validation performed

Ngày2026-11-05; cwd worktree này; Release/cached dependencies, `--no-restore`, không install. Commands/log cuối sau sửa failed-replay DTO:

| Status | Command / kết quả / log |
|---|---|
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`:exit0,0 errors,3 NU1603 đã có; `task3-final2-build.log`. |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`:349 passed,0 failed,38 opt-in skipped,387 total; `task3-final2-test.log`. |
| Verified | `FAH_HISTORY_SQL_SERVER=localhost`, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Safety_20261104`; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter "FullyQualifiedName~GenerationHistorySqlTests|FullyQualifiedName~GenerationCreditReservationSqlTests|FullyQualifiedName~GenerationCreditReservationConsumerSqlTests"`:22 passed,0 failed/skipped; `task3-final2-sql-safety.log`. Gồm11 Task3,7 foundation,4 actual-consumer. |
| Verified | Cùng localhost, exact `FormAutoHub_History_Baseline_20261105`; filter `FullyQualifiedName~GenerationCreditReservationMigrationTests`:1 passed,0 failed/skipped; `task3-final2-sql-baseline.log`. |
| Verified | `dotnet ef migrations has-pending-model-changes --project src/FormAutoHub.Api --configuration Release --no-build`:no model changes; `task3-final2-pending.log`. `git diff --check`:exit0; `task3-final2-diff-check.log`. |
| Verified | Focused generation/history/Phase3/direct/error contract109 passed,0 failed/skipped trước final; `task3-green-focused.log`; full cuối bao phủ thêm assertions. |

Mỗi SQL fixture open kiểm whitelist localhost/exact DB và ServerName/MachineName=`DESKTOP-TS5JR7L` trước ghi. Không reset/drop/EnsureDeleted; giữ mọi synthetic fixtures. SQL test suite lặp lại được bằng IDs riêng từng run.

**RED→GREEN evidence:**

- `task3-red-pricing.log`:6 failed/32 passed; rules còn thu1/giới hạn balance, rules100 tại0 bị chặn, AI vẫn2/3. `task3-red-retention.log`:1 failed/0 passed,21 calls chưa tạo batch. GREEN ban đầu `task3-green-history.log`:44/44.
- `task3-red-history.log`:4 failed/2 passed (read service chưa triển khai); `task3-red-expired-recovery.log`:1 failed; `task3-red-immutability.log`:4 failed; sau triển khai có `task3-green-immutability.log` và full cuối.
- `task3-red-observation-owner.log`:3 failed (metadata drift trong provider call,2 owner/audit); `task3-green-observation-owner.log`:58/58. `task3-red-empty-options.log`:1 failed; sửa unknown empty-options. `task3-red-large-balance.log`:1 failed (decimal balance bị ép int); free rules100 nay hoạt động với3 tỷ posted credits.
- `task3-red-fresh-ack.log`:1 failed (nontransient commit ack mất); `task3-green-fresh-ack-r2.log`:13/13 SQL sau fresh observation. Một lần SQL rerun trước đó (`task3-green-fresh-ack.log`) có1 fail/12 passed do literal synthetic GUID collision từ dữ liệu retained; đổi common random middle giữ SQL tie-order độc lập, không sửa/xóa fixture cũ.
- Full initial `task3-full-initial.log`:345 passed/2 failed/35 skipped do2 assertions giá Option2 cũ trong FahErrAiErrorContractTests; expected chỉnh từ2 thành1 theo spec. Final349/0/38 như trên.
- `task3-red-failed-replay-dto.log`:1 failed cho MissingCredits của failed-audit lost-ack replay; final Safety22/22 kiểm cả replay response/posted funds lẫn đúng1 failed usage,0 batch/debit/provider-repeat.

Coverage hành vi: rules100 tại0/không account; AI10 cost10/20 và partial3 cost3/6; zero valid không slot/debit/eviction;101 reject trước provider;20/21/concurrent22 giữ20 account-wide; SQL uniqueidentifier tie khác .NET ordering; rollback sau staged append không mất run cũ/payload/audit/debit; ownership/pagination/distant page/expired recovery; Partial snapshots không drift; immutable guards/exact replay; actual AI dưới hold và hai consumer cạnh tranh Available; transient local commit retry/transient+nontransient lost ack không gọi lại provider; legacy direct rejection tại0 khóa account trước project và0 provider calls. Admitted immutable snapshot/reservation được giữ khi append evict batch; đây là kiểm thử nền snapshot/hold và common locks, không phải v2 send admission end-to-end Task4.

## Validation not performed

- Not run: API HTTP/authenticated roles/browser/hydration/chunks và process restart; root cấm startup API auto-migrate trong Task3. Cần Task6 runtime gate trên server/session/DB do root xác minh; local service/SQL evidence không thay thế runtime.
- Not run:15 SQL cũ dùng DB task khác (không được takeover).38 skips full gồm15 cases này và23 history cases đã chạy riêng22 Safety+1 Baseline; không tính skip thành pass.
- Not run: provider AI/Google/payment thật; mọi provider fixture synthetic/local, không network I/O. Không paid send/cutover/production/schema activation.
- Pending: fresh independent credit/safety review do root điều phối. Author self-review không thay independent review.

## Risks / Deferred items

- Task4 v2 send admission phải recheck eligible batch dưới account lock, xác nhận user/duplicate warning, snapshot/reservation/settlement và receipt evidence; test append/reservation hiện tại không chứng minh toàn bộ admission đó. Giữ Unknown/holds, không auto resend/release.
- UI/fee copy/contract-version cutover và history route/controller thuộc tích hợp tiếp theo; snapshot Task3 chưa an toàn để bật standalone pricing cùng selected-send legacy như một release hoàn chỉnh. Không có quyền live activation.
- Logical eviction chỉ giới hạn reuse20 run, không giới hạn physical storage; audit/ledger giữ nguyên. Existing NU1603 vẫn còn, không install để sửa warning.

## Next recommended step

Đóng băng16 source/test files và paired report cho root đóng gói diff so với Task3 baseline rồi dispatch fresh independent Sol/high reviewer. Sau kết quả review, chỉ reopen đúng findings được root giao; tiếp tục Task4 theo kế hoạch đã duyệt. Không commit/push/merge/deploy/cleanup hoặc kết luận release.


## Independent R1 I1 fix round — 2026-11-05

Reviewer R1 identified Important I1: explicit response recovery performed `CountAsync` then a separate eligible payload query, allowing eviction to interleave and return HTTP200 with a subset. M1 detail-query count remains Deferred per root; no expansion performed.

**RED:** `artifacts/reports/fah-history-001/task3-r1-red-recovery-race.log` records 1 failed interleaving regression against the two-SELECT implementation. A retained SQL interceptor triggered a concurrent run21 eviction between membership count and payload read; the old method returned a non-null incomplete result.

**Fix:** `ResponseGenerationService.GetProjectResponsesAsync` now materializes the eligibility/payload query exactly once, then compares the materialized count to distinct explicit IDs before mapping. Missing/expired/unowned explicit membership returns null for controller 404; an unfiltered project read still returns only current eligible/proven legacy recovery. No transaction/schema/API route/provider behavior changed.

**GREEN:** `task3-r1-green-recovery-race.log`:1 passed/0 failed/0 skipped on exact Safety DB, covering two deterministic interleavings (expired-only and expired+kept), complete pre-race recovery, post-eviction unfiltered20 eligible responses, retained payload21 and no expired re-exposure. `task3-r1-final-unit.log`:41 passed/0 failed/0 skipped (`GenerationHistoryServiceTests|Phase3FormAutomationTests`). `task3-r1-final-sql.log`:12 passed/0 failed/0 skipped (`GenerationHistorySqlTests`). `task3-r1-final-diff-check.log`:clean. No full suite rerun per scoped reviewer instruction; prior final full suite remains349/0/38 and this change is limited to recovery read plus its SQL regression.

**Freeze after I1:** fresh author manifest `artifacts/reports/fah-history-001/task3-author-freeze-r1.json` records changed Task3 source/test hashes against the original Task3 baseline. Paired reports remain byte-identical UTF-8. Root should dispatch fresh scoped R2 review of I1 only; do not reopen M1 unless separately authorized.
