# Task 4 — Báo cáo triển khai cục bộ

## Summary

Đã triển khai Task4 FAH-HISTORY-001 được duyệt trong worktree `fah-history-001`, base `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`. Trạng thái hiện tại sau R1 sửa I1 vòng1: source/test/report đã freeze để review độc lập R2. Bằng chứng triển khai gốc bên dưới là lịch sử trước R1; phần cuối cập nhật số liệu/hash hiện hành. Đây là bàn giao tác giả, chưa phải Done/tích hợp/release. Giữ nguyên Task2/3 và bằng chứng. Không agent con, cài đặt, provider thật, process/listener, commit hay deploy.

Admission v2 chụp snapshot/hold và chỉ dispatch sau commit PossibleDispatch đã được xác nhận; settlement dùng evidence bất biến có kiểu. Rules trực tiếp tạo batch miễn phí trong khả năng Available và reserve phí send cùng transaction. Replay không refresh compatibility, generation, hold, debit, log hay takeover runner. Paid send production vẫn Blocked: parser không chứng minh metadata đầy đủ, HTTP/body/redirect Google chưa chứng minh receipt.

## Files changed

28 file source/test Task4 (19 production,9 test), SHA256 trước/sau tại `artifacts/reports/fah-history-001/task4-final-manifest.json`; SHA256 manifest hiện hành **221679bbdc5b17cd994030e38032832ca3d2731d6657f298af3fde60364f2446**. Baseline dùng manifest47 file ban đầu và HEAD qua working-tree filters cho file tracked trước đó sạch.

- Contracts: `Phase3Dtos.cs`, mới `SubmissionCompatibilityDtos.cs`: primary constructor v2 chính xác, phí/item/counter polling. Không còn overload public cho legacy mutation.
- Controllers: `SubmissionsController.cs`, `GeneratedResponsesController.cs`, `AiResponsesController.cs`, mới `GenerationContractFence.cs`: HTTP code/ProblemDetails có kiểu, no-store và owner-first generation version fence.
- Integration/DI: `GoogleFormsClient.cs`, mới `GoogleSubmissionEvidence.cs`, `Program.cs`: outcome có kiểu, HTTPS identity chặt, một POST/không auto redirect, hash body giới hạn/redirect trace, Unknown cho receipt thật chưa được chứng minh; đăng ký compatibility fail-closed.
- Services: `SubmissionService.cs`, `SubmissionAdmission.cs`, `DirectRuleSubmissionService.cs`, mới `SubmissionCompatibilityService.cs`/`SubmissionContractException.cs`, `CreditReservationService.cs`, `SubmissionSettlementService.cs`, `SubmissionItemMutation.cs`; sửa tối thiểu `ResponseGenerationService.cs` bỏ nhánh direct giá1 chuyển tiếp và `AiGenerationService.cs` thêm owner query cho controller fence. Không đổi model/schema/migration.
- Tests: `DirectRuleSubmissionServiceTests.cs`, `DirectRuleSubmissionSqlServerTests.cs`, `FahErrSubmissionPersistenceTests.cs`, `GenerationHistorySqlTests.cs`, `Phase3FormAutomationTests.cs`; mới `SubmissionV2Tests.cs`, `SubmissionV2Fixture.cs`, `GenerationHistorySubmissionSqlTests.cs`, `GoogleFormsOutcomeTests.cs`.
- Báo cáo song ngữ; checkpoint trước giữ tại `artifacts/reports/fah-history-001/task4-checkpoint-{ai,vi}.md`; mọi log RED/trung gian được giữ.

## Scope alignment

Authorization owner trước validation/activity của project; fingerprint/replay phía server,1–100 ID phân biệt, confirmation/cảnh báo duplicate, membership/expiry/proven legacy được kiểm lại dưới lock Users/account→projects→batch→response/item. Kiểm lại Available; snapshot/hold bất biến sống qua logical eviction. Rules trực tiếp vẫn một action, affordable floor(Available/1), không confirmation thứ hai; phí generation rules0/AI1/2 giữ nguyên.

Provider ngoài transaction/retry SQL. Synthetic success được xác minh settle own hold đúng một lần; rejection release; Unknown giữ hold/fence và dừng. Pause/cancel chỉ yêu cầu control; runner acknowledgement chỉ release Planned. Counter, RunnerAcknowledgedAt, FinishedAt và active predicate giữ ý nghĩa v2/legacy chính xác; reconciliation không sửa lịch sử vận hành. Không endpoint resume/worker.

Legacy Available claim first success prepaid0, consume một lần, khôi phục sau confirmed rejection, giữ claim khi Unknown; Consumed không mở lại. Bool log Success/Failed cũ thiếu terminal classification bị `OutcomeUnresolved`. Không đoán nhóm bằng timestamp, backfill, hold/ledger lịch sử giả hay operator mutation. No-hold reconciliation tooling Deferred; không đưa attempt không hold vào settlement thông thường.

## Validation performed

Ngày2026-11-05; worktree này; Release/cached dependencies; không restore/install. Command exit0 trừ RED lịch sử ghi riêng. Log tại `artifacts/reports/fah-history-001/`.

| Status | Command/kết quả/artifact trước R1 |
|---|---|
| Verified | `dotnet build FormAutoHub.sln -c Release --no-restore`:0 lỗi,3 NU1603 có sẵn; `task4-final-build4.log`. |
| Verified | `dotnet test FormAutoHub.sln -c Release --no-restore`:387 passed/0 failed/46 opt-in skipped,433 total; `task4-final-test4.log`. |
| Verified | Guard chính xác localhost / DESKTOP-TS5JR7L / `FormAutoHub_History_Safety_20261104`; filter `FullyQualifiedName~GenerationHistorySubmissionSqlTests`:7 passed/0 failed/skipped; `task4-final-sql-safety3.log`. |
| Verified | Cùng Safety DB; filter `GenerationHistorySqlTests|GenerationCreditReservationSqlTests|GenerationCreditReservationConsumerSqlTests`:23 passed/0 failed/skipped; `task4-final-sql-regression.log`. Tổng30 test Safety phân biệt qua2 lần chạy. |
| Verified | Baseline được guard `FormAutoHub_History_Baseline_20261105`; filter `GenerationCreditReservationMigrationTests`:1 passed/0 failed/skipped; `task4-final-sql-baseline.log`. Không migration mới/reset DB. |
| Verified | `GoogleFormsOutcomeTests`:18 passed (`task4-google-outcomes2.log`); mapping HTTP control1 passed (`task4-control-http-green2.log`), cũng thuộc full suite. |
| Verified | EF `has-pending-model-changes --project src/FormAutoHub.Api --configuration Release --no-build`:không pending (`task4-final-pending4.log`); `git diff --check`:0 lỗi whitespace (`task4-final-diff4.log`, chỉ cảnh báo chuẩn hóa LF). |

SQL đếm độc lập10 lần receiver,7 debit,7 usage item,10 submission log,30 reservation event,1 held/2 released cho7success/2reject/1Unknown. Replay cùng command đổi thứ tự ID không thêm provider/compatibility/accounting; resend command mới có confirmation/cảnh báo tốn1. Direct rollback chứng minh batch/generation/hold/job/usage rollback cùng nhau. Hai project cạnh tranh Available trong khi job đầu settle own hold tại Available0. Pause/cancel và append/eviction đồng thời giữ snapshot; chỉ Planned release sau acknowledgement. Legacy SQL success/rejection/Unknown replay giữ entitlement, không double charge.

| Fault SQL | Receiver | Debit | Outstanding | Trạng thái bền vững / active fence |
|---|---:|---:|---:|---|
| Mất ack commit admission |0|0|1|Running/Planned; ack=null,finish=null; active |
| Save trước provider lỗi |0|0|0|Failed/NotDispatched; có ack/finish; inactive |
| Mất ack commit trước provider |0|0|1|Failed/PossibleDispatch; có ack/finish; active |
| Save outcome sau receiver lỗi |1|0|1|Failed/PossibleDispatch; có ack/finish; active |
| Mất ack commit outcome |1|1|0|Completed/Succeeded; có ack/finish; inactive |

Giá trị ISO chính xác acknowledgement/finish và active predicate được in ở `task4-final-sql-safety3.log`. Unknown7/2/1 kết thúc Failed, có ack/finish và active=true. Paused acknowledged giữ finish=null/active=true; explicit cancel đặt finish, gỡ fence khi không còn item unresolved.

RED là hành vi thật, không phải compile error: `task4-red-boundaries.log`4fail; `task4-red-admission.log`3fail/3pass; `task4-red-cutover-expiry.log`2fail/9pass; `task4-red-insufficient.log`1fail; `task4-red-owner-selection.log`2fail; `task4-red-legacy-classification.log`2fail; `task4-red-control-http.log`1fail. Full39failure trung gian và các count xanh sau đó giữ trong log lịch sử. Không coi compile-only edit là TDD proof.

Migration regression giữ ý định/số ca: Direct24 ca kiểm phí/hold theo item, fingerprint conflict và legacy GET-only; FahErr14 ca giữ fault/inner-cause/transport/cancellation/control/NCKH, dùng usage theo item và Unknown;6 ca send Phase3 dùng v2 và resend rõ ràng. Direct SQL cũ đã dùng v2, synthetic verified outcome, common prepaid selection, own-hold/lost-ack projection, in-flight control. Giữ nguyên DB name/guard cũ, không mở DB đó. Mapping tương đương trong Safety Task4: atomic rejection/direct rollback; owner/replay/active guard; same/different command; account chung/hai project; pause/cancel/eviction;5 fault phase. Không còn success assertion cũ dựa version0.

## Validation not performed

- Not run trước R1:46 entry opt-in của full run;30 Safety+1 Baseline chạy riêng;15 ca SQL fixture cũ còn Not run vì cần owner/DB riêng, không takeover. Direct SQL cũ đã compile/migrate nhưng không tuyên bố thực thi.
- Not run: API restart/authenticated HTTP, browser rendering/hydration/chunks, provider thật. Brief cấm API startup/process mới; gate tích hợp runtime để root/Task6 thực hiện.
- Blocked: provenance metadata/receipt Google thật được chấp nhận và năng lực reconciliation operator. Receiver synthetic chỉ chứng minh cơ chế; compatibility/classifier production vẫn fail-closed.
- Pending: review safety/credit độc lập mới của root. Self-review không thay review độc lập.

## Risks / Deferred items

Parser Google hiện không chứng minh đầy đủ inventory/required/options/validation/constraints/receipt; `SubmissionCompatibilityService` trả `FormEvidenceUnavailable` cho identity được hỗ trợ, `FormIncompatible` cho identity khác, không bịa facts hay gọi network. Mọi body/status/redirect Google thật chưa xác minh là Unknown; không có positive-marker classifier production. Chưa được phép/chưa sẵn sàng enable paid-send production. Không parser rewrite rộng, provider mới, official Forms/OAuth/NCKH, frontend, backfill/operator tool, TTL/auto-release/auto-retry/resume, physical delete hay live activation.

## Next recommended step

Root đóng gói manifest/report freeze cho review safety/credit độc lập. Sửa finding có evidence mới và review lại; sau đó tiếp tục Task5/6/gate runtime được duyệt. Không suy ra tích hợp/release từ kiểm tra cục bộ.

## R1 sửa vòng1 / bàn giao R2 hiện hành — 2026-11-05

R1 `artifacts/reports/fah-history-001/task4-review-r1.md` có **I1 Important,0 Critical**. Initial runner query ở ngoài `try/finally` sau admission acknowledged; query fault/cancellation có thể để Running/Planned hold chưa dispatch mà không có acknowledgement. Sửa hẹp `Services/SubmissionService.cs`: đưa `ToListAsync(ct)` đầu vào `try/catch/finally` hiện hữu. Finalizer vẫn token30 giây độc lập cancellation, reload durable items và chỉ release Planned. Không đổi replay admission/Unknown/provider/credit/lifecycle contract.

Thêm6 regression SQL thật tại `GenerationHistorySubmissionSqlTests.cs`: selected/direct × query-fault/query-cancel/after-admission-ack-cancel. `task4-r1-red-initial-load-six.log` chứng minh6/6 fail trước sửa, durable Running thay vì Failed; `task4-r1-green-initial-load.log` chứng minh6/6 pass sau sửa. Mỗi ca đếm độc lập receiver0,debit0,2 NotDispatched/Released,outstanding0,released2,balance2,ack/finish có giá trị,active=false,không submission log và replay chỉ đọc. In ISO timestamp/active predicate chính xác. Ca lost-admission-ack và5 fault phase cũ vẫn xanh, không takeover runner.

Xác minh cuối sau sửa, cùng worktree/Release/cached dependencies và Safety DB guard chính xác:

| Status | Kết quả hiện hành / artifact |
|---|---|
| Verified | Build0 lỗi/3 NU1603 baseline: `task4-r1-final-build.log`. |
| Verified | Full suite **387 passed/0 failed/47 opt-in skipped**,434 total: `task4-r1-final-test.log`. xUnit gộp SQL theory6 ca chưa opt-in thành1 skipped theory;6 ca đã chạy riêng dưới đây. |
| Verified | Safety filter kết hợp `GenerationHistorySubmissionSqlTests|GenerationHistorySqlTests|GenerationCreditReservationSqlTests|GenerationCreditReservationConsumerSqlTests`: **36 passed/0 failed/skipped**, gồm Task4 mười ba + foundation/history23: `task4-r1-final-sql-safety.log`. |
| Verified | EF không pending model: `task4-r1-final-pending.log`; diff-check không lỗi whitespace: `task4-r1-final-diff.log` (chỉ cảnh báo LF có sẵn). |
| Verified (giữ lại, không ảnh hưởng) | Baseline migration1/1: `task4-final-sql-baseline.log`; I1 không đổi schema/model/migration. |
| Verified |28 SHA256 source/test hiện hành trong `task4-final-manifest.json`, SHA256 **221679bbdc5b17cd994030e38032832ca3d2731d6657f298af3fde60364f2446**. Chỉ service và file SQL test khác snapshot product/test R1. |

47 entry skip trong full gồm SQL được phép chạy riêng (36 Safety+1 Baseline actual case,6 theory case gộp thành1 skip entry) và15 SQL fixture cũ còn Not run. Không coi skip là pass. Giữ toàn bộ log RED/checkpoint/build/full/SQL trước đó.

Minor M2 precedence error code để root ledger cho final review; Task3 M1 vẫn Deferred. Không mở rộng scope hay sửa Minor. Không API/browser/runtime/live provider, process/listener/DB mới, operator tool, deploy hay Git mutation. Metadata/receipt Google thật và reconciliation adequacy vẫn Blocked; paid-send production giữ fail-closed. Tiếp theo: root review scoped R2 độc lập cho I1/snapshot mới; chưa Done/tích hợp/release.
