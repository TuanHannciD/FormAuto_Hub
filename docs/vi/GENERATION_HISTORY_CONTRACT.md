# Lịch sử tạo — contract đã triển khai local

Phạm vi duyệt: [FAH-HISTORY-001](tasks/FAH-HISTORY-001/INDEX.md), [contract chính xác](tasks/FAH-HISTORY-001/CONTRACTS.md), [kiểm chứng](tasks/FAH-HISTORY-001/VALIDATION.md). Bổ sung này ghi hành vi local; production activation còn chặn do bằng chứng provider thật và operator tooling cần quyền riêng.

## HTTP và ownership

- `GET /api/generation-history?page=1&pageSize=10` owner-only/no-store trả20 run eligible mới nhất toàn account; page>=1, size1..20. Detail `GET /api/generation-history/{batchId}` có<=100 response theo ordinal; thiếu/khác owner/evicted trả404. Admin không có quyền vượt owner.
- Generation giữ route rules/AI hiện có, yêu cầu `X-FormAuto-Contract-Version: 2`; client cũ nhận409 `ClientUpgradeRequired` sau owner check. Response thêm `generationBatchId`, `generationFeePerResponse`, `credits` posted/reserved/available. AI run khác generation batch.
- Tạo rules0; AI mặc định/tùy chỉnh1/2 mỗi response commit. Partial chỉ tính row lưu thật; zero valid không batch/debit. Mỗi request thành công là một immutable run; continuation là run mới. Run21 logical evict cũ nhất; audit/ledger/payload vật lý giữ nguyên.
- Selected-send giữ route cũ, yêu cầu contractVersion2, commandId, một batch/project, response IDs và xác nhận. Cùng command/fingerprint chỉ đọc lại. Resend chủ động dùng command mới và cảnh báo trùng. Rules direct vẫn một action, không xác nhận thứ hai.
- Compatibility production hiện chặn thiếu bằng chứng form/receipt trước provider I/O/job/hold. Compatibility/receiver synthetic chỉ là fixture test, không phải switch cấu hình production.

## Persistence và credit

`GenerationBatch` lưu owner/project, completion time durable, mode, requested/generated, phí tạo, policy, observation/hash bất biến và thời điểm logical eviction. `GeneratedResponse` lưu batch membership/ordinal và pricing/entitlement evidence separated hoặc legacy đã chứng minh. Timestamp gần nhau không chứng minh legacy grouping.

`CreditReservation`, append-only `CreditReservationEvent` và `SubmissionJobItem` giữ payload/evidence, attempt và settlement identity. Balance đã ghi sổ; Reserved là hold còn lại; Available=Balance-Reserved. Hold không phải chi tiêu. `CreditService` ghi mọi debit/grant; usage tạo và gửi tách riêng.

v2 `SettleAttemptAsync` đã triển khai để chốt một possible-dispatch/Unknown từ immutable reviewed evidence, actor/reason phù hợp và replay idempotent. Success tiêu hold đúng một lần; rejection giải phóng hold của nó; Unknown vẫn giữ tiền và fence. Runner acknowledgement khác đóng tài chính; reconciliation giữ thời điểm kết thúc vận hành.

Có schema/read consumer `LegacyAttemptEvidence`. `ILegacyAttemptReconciliationService.ReconcileLegacyAttemptAsync` được đề xuất và operator mutation/backfill **chưa triển khai**, vẫn Deferred. Không public mutation endpoint, auto-release, runner takeover hay suy đoán receipt.

## Giới hạn runtime

Task6 phân biệt web/API/SQL có xác thực với cấu hình production thông thường và service/receiver synthetic có kiểm soát. Không test gửi Google/receipt provenance thật; paid sending activation vẫn Blocked. Xem [cutover](tasks/FAH-HISTORY-001/CUTOVER.md), [bàn giao](tasks/FAH-HISTORY-001/HANDOFF.md).
