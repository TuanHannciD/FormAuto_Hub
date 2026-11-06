# Task 2 — Báo cáo triển khai của tác giả

## Summary

Đã triển khai nền tảng Task 2 được duyệt tại nhánh `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`: reservation giữ nguyên Balance đã hạch toán; Available trừ hold; success dùng chính hold đúng một lần; rejection giải phóng không debit/refund; Unknown giữ tiền/quyền prepaid. Replay cùng bằng chứng chỉ đọc; bằng chứng đổi nội dung hoặc kết quả cuối mâu thuẫn bị chặn. Đây là bàn giao tác giả cho review độc lập, chưa tích hợp/phát hành/Done.

Quyền thực hiện theo [PROGRESS](PROGRESS.md), [CONTRACTS](CONTRACTS.md), [DB_REVIEW](DB_REVIEW.md), Task2 brief và ruling của root về khóa account-first. Implementer `gpt-6.1-sol/high`, không agent con; root sở hữu vòng đời hai DB test và runtime.

## Files changed

- Entity mới: `GenerationBatch`, `SubmissionJobItem`, `CreditReservation`, `CreditReservationEvent`, `LegacyAttemptEvidence`; bổ sung trường nullable batch/legacy/job/log/usage đã duyệt vào entity hiện tại. Bảng legacy evidence chỉ là persistence; chưa có operator tool/backfill.
- EF: `FormAutoHubDbContext.cs`, `Data/GenerationHistoryModel.cs`, designer/snapshot EF-generated; migrations `20261105043707_GenerationHistoryAndReservations` và `20261105044810_HardenHistoryNullableContractChecks`. Migration đầu có preflight duplicate/orphan fail-closed, không sửa/xóa lịch sử. Migration sau chặn lỗ hổng CHECK với NULL của SQL; giữ nguyên migration đã áp dụng.
- Thêm `CreditReservationDtos.cs`, `CreditAccountLock.cs`, `CreditReservationService.cs`, `SubmissionItemMutation.cs`, `SubmissionSettlementService.cs`; sửa `CreditService.cs`, `CreditWriteTransaction.cs`; đăng ký service nội bộ trong `Program.cs`, không route mới.
- Thay đổi tối thiểu để an toàn writer hiện tại: `ResponseGenerationService.cs`, `AiGenerationService.cs`, `SubmissionAdmission.cs`, `AdminCreditOperationsService.cs`, `AdminTopupOrderService.cs`, `PaymentService.cs`. Khóa account trước project/spending; chỉ retry lưu SQL cục bộ đã chuẩn bị, không retry provider. Giá cũ rules=1/default AI=2/custom AI=3 giữ đến Task3. Payment chỉ thêm transaction/serialization local, không đổi signature/status/provider.
- Thêm `GenerationCreditReservationTests.cs`, `GenerationHistorySqlFixture.cs`, `GenerationCreditReservationSqlTests.cs`, `GenerationCreditReservationMigrationTests.cs`; cập nhật inventory entity trong `FoundationTests.cs`. Sửa barrier sau debit trong `DirectRuleSubmissionSqlServerTests.cs` cho cơ chế khóa mới; giữ assertion một debit/runner và một lỗi thiếu credit, giữ tên DB/opt-in cũ.
- Hai bản `TASK2_REPORT.md`; bằng chứng tại `artifacts/reports/fah-history-001/`. Root quản lý PROGRESS/review package.

## Scope alignment

Không triển khai Task3 pricing/history writer/quota/API/UI, Task4 send flow/classifier, legacy backfill/cutover/operator reconciliation, worker, auth/NCKH, install/commit/push/deploy. GenerationBatch và legacy evidence chỉ là schema nền tảng đã duyệt. Không chạy API/web, không gọi Google/AI/payment thật, không truy cập DB khác, không drop/reset/cleanup.

Đã triển khai khóa `Users -> account -> project -> batch/response/item`, unique account owner/ledger/usage/terminal event theo item, rowversion, FK không cascade, snapshot bất biến và evidence append-only, settlement dùng token chẩn đoán độc lập có hạn thời gian, đọc fresh context khi mất commit acknowledgement, chỉ release Planned sau runner acknowledgement. Unknown prepaid vẫn mở dù outstanding tiền bằng0.

## Validation performed

Các lệnh chạy trong worktree cô lập, Release; dependency cache local, dùng `--no-restore` khi hỗ trợ, không cài đặt. Log dưới `artifacts/reports/fah-history-001/`.

| Trạng thái | Bằng chứng |
|---|---|
| Verified | RED: `task2-red-behavior.log` chứng minh tiêu nhầm hold; `task2-red-invariants.log` cho own-hold-at-zero/evidence/ack; `task2-red-snapshots.log` cho sửa snapshot; `task2-red-null-check.log` cho NULL bypass SQL; `task2-red-fresh-ack.log` cho thiếu fresh recovery. Các lượt GREEN sau bao phủ lỗi. Log skeleton ban đầu có lỗi compile thiếu type; RED hành vi được ghi riêng. |
| Verified | Unit tập trung12 passed/0 failed (`task2-green-snapshots.log`):10/7/3 ->9/6/3 ->9/5/4, unknown/replay, zero/fractional/missing account, Available0, evidence conflict, runner ack, prepaid success/reject/unknown, immutability. InMemory chỉ chứng minh unit. |
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`: exit0,0 lỗi,3 warning NU1603 có từ baseline (`final-build.log`). |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`: cuối327 passed/0 failed/23 opt-in skipped, total350 (`final-test.log`). Lượt full đầu chỉ fail inventory entity cũ; cập nhật xong có lượt327 passed/22 skipped/349; thêm SQL missing-account thành số cuối. |
| Verified | Safety: `FAH_HISTORY_SQL_SERVER=localhost`, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Safety_20261104`; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter FullyQualifiedName~GenerationCreditReservationSqlTests`:7 passed/0 failed/0 skipped (`final-sql-safety.log`). |
| Verified | Baseline: cùng server, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Baseline_20261105`, filter `FullyQualifiedName~GenerationCreditReservationMigrationTests`:1 passed/0 failed/0 skipped (`final-sql-baseline.log`). Lần đầu preflight duplicate51000/orphan51001 và apply baseline: `task2-sql-baseline.log`; lượt cuối đọc lại bảo toàn lịch sử. |
| Verified | Mỗi kết nối fixture chỉ được mở sau whitelist localhost/tên DB và xác minh ServerName/MachineName=`DESKTOP-TS5JR7L`. Safety sạch và Baseline có migration cũ+dữ liệu lịch sử đã áp dụng cả hai migration mới; giữ dữ liệu synthetic. Fresh context độc lập kiểm tiền/hold/ledger/log/keys. |
| Verified | SQL bao phủ hai project tranh reservation; hai generation debit đồng thời không tiêu hold; topup đồng thời và tạo missing account không lost update; rollback trước save; mất xác nhận commit settlement đọc fresh/replay chỉ1 debit; sum/check/FK/unique và NULL guard. Credit-service synthetic chứng minh accounting local, chưa chứng minh AI/provider end-to-end. |
| Verified | `dotnet ef migrations has-pending-model-changes --project src/FormAutoHub.Api --configuration Release`: không pending (`final-pending.log`); `git diff --check`:exit0. Kiểm UTF-8/báo cáo song ngữ tại lúc đóng băng. |

## Validation not performed

- Not run: API/runtime HTTP, role/session, browser/hydration/chunks, provider AI/Google/payment thật. Không route mới; smoke consumer chạy thật rộng hơn là gate Task6, chưa miễn bỏ.
- Not run:15 SQL opt-in cũ dùng DB task riêng vì không có quyền tiếp quản. Lượt full skip15 test đó và8 test SQL mới;8 test mới đã chạy riêng trên DB được cấp. Barrier SQL direct-rule cũ đã compile, chưa chạy fixture cũ.
- Not run: production/cutover, receipt Google thật, legacy reconciliation/backfill, quota/eviction, AI/send retry/provider count end-to-end; thuộc task sau/gate activation.
- Review credit/migration độc lập đang chờ root cấp reviewer mới; self-review của tác giả không thay thế.

## Risks / Deferred items

- Chạm transaction/lock local của generation/payment writer: cần runtime/consumer smoke và review tài chính trước activation. SQL đang kiểm dedicated credit path, không provider thật.
- `Program.cs` vẫn auto-migrate: không chạy trên DB chưa xác minh. Chỉ hai DB test root sở hữu đã được cấp quyền và giữ lại.
- Unknown giữ hold chờ evidence, không TTL release/auto resend. Legacy classification/tool và receipt adequacy là gate sau.
- Không tuyên bố purge/storage bound/history activation/phát hành. NU1603 cũ còn; log cuối không còn analyzer warning mới.

## Next recommended step

Đóng băng source/test để root review độc lập Task2 credit/migration. Sửa finding kèm recheck/review mới rồi tiếp tục Task3. Build/unit/SQL local không thay cho API/runtime/cutover/release.

## Sửa finding review độc lập R1 — vòng 1, 2026-11-05

R1 có Important I1/I2, không Critical/Minor; lưu tại `artifacts/reports/fah-history-001/task2-review-r1.md`. Snapshot tác giả bên trên là bằng chứng lịch sử; kết quả dưới thay thế số hiện tại. Chưa có kết quả review độc lập lại bản sửa.

- **I1 fixed:** availability đọc riêng ngoài transaction hiện có dùng context khác cho transaction/retry. Clear tracker đọc không còn detach AI run Added hoặc thay đổi đang chờ của caller. Khi caller có transaction thì vẫn dùng context/transaction gốc. Sửa `Services/CreditReservationService.cs`, không đổi AI provider/giá/status/schema.
- **I2 fixed:** rules generation lưu Failed UsageLog0 credit, trả kết quả lỗi local để transaction commit, sau đó mới ném InvalidOperationException cũ cho controller. ID failed-usage cố định và lookup kết quả đã commit chặn log trùng khi mất commit acknowledgement tạm thời. Sửa `Services/ResponseGenerationService.cs`; direct admission vẫn rollback transaction ngoài và ghi failure audit ở boundary caller hiện có.
- Thêm kiểm thử SQL consumer thực trong `GenerationCreditReservationConsumerSqlTests.cs`, gọi `AiGenerationService`/`ResponseGenerationService` thật cùng SQL execution strategy. Provider synthetic không gọi mạng. Không thêm schema/migration.

**RED:** `task2-r1-red-consumers.log` ghi đủ3 lỗi: AI success retry mất run gây FK run-items; AI provider lỗi thiếu run durable; competing spend làm mất rules Failed UsageLog. `task2-r1-red-audit-replay.log` ghi2 failure usage khi mất xác nhận commit audit tạm thời. Giữ nguyên log. **GREEN:** `task2-r1-green-consumers.log`:4 passed/0 failed/0 skipped; retry đọc>=2, provider đúng1 lần, đúng1 run success/failure durable và item/debit/usage tương ứng; rules không có generated response/generation debit, đúng1 failed usage0 credit, debit của luồng cạnh tranh vẫn còn, kể cả replay commit.

Kiểm chứng cuối sau sửa R1 tại worktree cô lập, dependency cache local:

| Trạng thái | Lệnh / kết quả / artifact |
|---|---|
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`:exit0,0 lỗi,3 warning NU1603 baseline; `task2-r1-final-build.log`. |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`:327 passed/0 failed/27 opt-in skipped,total354; `task2-r1-final-test.log`.27 skip gồm15 SQL cũ và12 SQL mới;12 test mới chạy riêng bên dưới. |
| Verified | Guard Safety đúng identity không đổi; `FAH_HISTORY_SQL_SERVER=localhost`, `FAH_HISTORY_SQL_DATABASE=FormAutoHub_History_Safety_20261104`; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-restore --filter "FullyQualifiedName~GenerationCreditReservationSqlTests|FullyQualifiedName~GenerationCreditReservationConsumerSqlTests"`:11 passed/0 failed/0 skipped; `task2-r1-final-sql-safety.log`. |
| Verified | DB Baseline đúng `FormAutoHub_History_Baseline_20261105`, localhost có identity guard; filter `FullyQualifiedName~GenerationCreditReservationMigrationTests`:1 passed/0 failed/0 skipped; `task2-r1-final-sql-baseline.log`. Fixture lịch sử không đổi. |
| Verified | `dotnet ef migrations has-pending-model-changes --project src/FormAutoHub.Api --configuration Release`:không pending; `task2-r1-final-pending.log`. `git diff --check`:exit0; kiểm UTF-8 strict/mục báo cáo song ngữ. |

**Giới hạn giữ nguyên:** không API/web/runtime/browser/provider thật, DB task khác, install/commit/deploy/cleanup. SQL consumer thực bổ sung bằng chứng credit-service trước đây; provider synthetic không chứng minh AI/Google thật. Đóng băng lại source/test để root review R2 độc lập credit/migration; chưa tích hợp/phát hành/Done.
