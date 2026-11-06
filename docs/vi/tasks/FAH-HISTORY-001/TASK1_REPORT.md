# Báo cáo tác giả Task 1

## Summary

**Verified: chỉ soạn tài liệu và self-review, 2026-11-05.** Contract/schema/chuyển trạng thái, policy legacy và gate cutover/reconciliation đề xuất đã sẵn sàng để root review độc lập. Chưa đánh dấu Task1 accepted, duyệt quyết định tài chính mới, triển khai Tasks2–5 hay kích hoạt gửi.

## Files changed

Chỉ tạo bốn file song ngữ tại `docs/ai/tasks/FAH-HISTORY-001/` và `docs/vi/tasks/FAH-HISTORY-001/`:

- [CONTRACTS.md](CONTRACTS.md): route owner, DTO/interface exact, fingerprint/replay server, lỗi, tương thích và bằng chứng.
- [DB_REVIEW.md](DB_REVIEW.md): field/type/null/index/FK/check exact đề xuất, snapshot/event bất biến, lock/retry, state/entitlement matrix và yêu cầu SQL.
- [CUTOVER.md](CUTOVER.md): grouping/backfill có proof, drain/client recovery, policy operator evidence và bốn quyết định.
- TASK1_REPORT.md (báo cáo này).

## Scope alignment

HEAD vẫn `df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c`; dossier đã untracked lúc bắt đầu nên tracked diff không biểu diễn file đã tồn tại. Giữ INDEX, IMPLEMENTATION_PLAN, PROGRESS, TASK1_BRIEF và mọi work ngoài phạm vi. Không đổi canonical/production, DB/process/provider/network/install/commit/remote/deploy/cleanup. Không agent con; tác giả được parent dispatch Sol trong giới hạn cấu hình, root chịu trách nhiệm review độc lập.

Dùng contract guard, DB architecture planner và verification-before-completion. Phân tích rủi ro DB là self-review tác giả, không phải reviewer độc lập. Đã đọc README/AGENTS/authority/execution/routing/skill matrix, spec AI+VI đã duyệt, constraints/file map/Task1 của plan; source entity/EF/contract/controller/service/integration và test/consumer liên quan. Search chỉ tìm ResponseGenerationService/AiGenerationService hiện debit usage; CreditService sở hữu đổi balance. Parser Google Required=false/fallback và success2xx/302 ngăn tuyên bố receipt đáng tin.

## Validation performed

- Verified source chỉ đọc: symbol/path GoogleFormSubmitResult thật; account decimal/RowVersion, model thiếu reservation/unique-owner, admission project-first/direct replay chỉ đọc; đọc test failure/unknown/cancel/commit-ack và resume consumer, không chạy.
- Verified self-review song ngữ: cùng API/schema/type/financial commitments,0/1/2+send1,20 account runs,1–100/tuần tự10; L1 chưa duyệt; Unknown không Failed/TTL-release/auto-retry; tên mới vẫn đề xuất.
- Verified cấu trúc: decode UTF-8 strict, không ký tự replacement, mỗi file<400 dòng, relative link tồn tại, code record/enum/interface C# đồng nhất bỏ comment dịch; không conflict marker. Kết quả command cuối báo root kèm file.
- Verified status/diff scope cuối: chỉ dossier untracked hiện hữu, không tracked change. Bốn cặp file mới là output được phép. Parent có thể đồng thời ghi PROGRESS riêng; tác giả không sửa ledger đó.

## Validation not performed

Not run: application build/unit/API/browser/SQL/migration/provider/live Google vì Task1 chỉ cho tài liệu. Đề xuất chưa runtime validation, không được báo implemented. Independent review: tác giả Not run; root sẽ dispatch reviewer mới. User approval: Blocked chờ trình artifact/quyết định đã review; tác giả chưa hỏi user.

## Risks / Deferred items

Gói quyết định cho root: **L1** giữ prepaid first-success sau legacy confirmed failure; **L2** chỉ grouping có proof và quarantine/recovery; **P1** hỗ trợ provider giới hạn fail-closed, chưa có receipt đáng tin; **O1** quyền operator/evidence/tooling có scope. L1 chặn consumer entitlement/backfill; evidence/khả năng đối soát chặn paid-send production activation. Tạo/lịch sử nền tảng vẫn đã duyệt. Không âm thầm áp dụng lựa chọn tài chính.

Batch retry identity đề xuất là first fixed response ID (ghi rõ để giữ signature AppendBatchAsync trong plan); reviewer cần kiểm cùng filtered uniqueness/FK/check khi migration SQL tương lai. Success lịch sử cũng có thể mơ hồ như Failed vì classifier boolean cũ. Quota20 không giới hạn audit/payload storage. Purge vật lý, parser rộng hơn, operator endpoint, worker, official API/NCKH vẫn Deferred/ngoài scope.

## Next recommended step

Root review độc lập contract/DB/submission-safety toàn bộ tám file trên snapshot này, sửa/check/re-review finding rồi trình user L1/L2/P1/O1. Không bắt đầu production phụ thuộc khi quyết định financial/schema/lifecycle bắt buộc chưa duyệt. Không tuyên bố commit/integration/release.

## Sửa review vòng 1 — phản hồi tác giả

Đã xử lý cả ba Important finding trên đúng tám file được phép, không source/DB/runtime: (1) matrix status/FinishedAt/RunnerAcknowledgedAt v2, predicate active-project exact, counter v2 tách legacy; Unknown đã dừng vẫn fence project/giữ quỹ; (2) ReconcileLegacyAttemptAsync(response/log/manifest identity,evidence) riêng cho legacy không item/hold, bảng evidence append-only thứ năm và AuditLog bất biến, idempotency/conflict SQL không ledger write; (3) ObservedMetadata thiếu lúc tạo vẫn hiển thị lịch sử, required/constraint nullable và receipt Unknown, chỉ admission gửi cần CompatibilityEvidence mới đầy đủ và copy vào job item bất biến.

Đã chạy lại check tài liệu sau sửa: UTF-8, link/anchor, C# contract song ngữ, <400 dòng/file, không conflict marker, git diff --check. Product/runtime vẫn Not run. Root cần re-review/acceptance độc lập; L1/L2/P1/O1 vẫn chưa duyệt. Reviewer cần đánh giá fence Unknown toàn project và bảng legacy-evidence thứ năm là lựa chọn kỹ thuật đề xuất cụ thể, không phải hành vi implemented hiện có.

## Sửa regression review vòng 2 — phản hồi tác giả

Đổi index key SubmissionJobs không hợp lệ chứa `Status nvarchar(max)` hiện tại thành nonclustered key `(ProjectId,RunnerAcknowledgedAt)` INCLUDE `(Status)` trong cả hai DB_REVIEW. Không đề xuất thu hẹp kiểu Status. Giữ predicate active đầy đủ, EXISTS trạng thái item, legacy handling và bảo đảm lock đúng thứ tự. Check tài liệu mới gồm UTF-8, link/anchor, giới hạn dòng, đề xuất song ngữ và git diff --check; không SQL/runtime/source/commit. Vòng này chỉ đổi DB_REVIEW/TASK1_REPORT AI/VI. Đóng băng cả tám artifact để re-review sau check.
