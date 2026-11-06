# Task 1 — Đề xuất cutover và gate đối soát

> Thẩm quyền hiện tại (2026-11-05): Review độc lập Task 1 qua R1–R3 và việc người dùng duyệt L1/L2/P1/O1 cùng contract/schema đã review được ghi tại [PROGRESS](PROGRESS.md). Tasks 2–6 được phép triển khai và kiểm thử cục bộ trong worktree riêng. Các nhãn đề xuất/chờ duyệt bên dưới lưu lịch sử thiết kế, không mở lại quyết định đã duyệt. Không suy ra quyền kích hoạt production, gọi provider thật, commit hay deploy.

Trạng thái: **Đề xuất; Task1 không cấp quyền rehearsal, migration, operator write hay activation.** [Contracts](CONTRACTS.md), [DB design](DB_REVIEW.md), [scope đã duyệt](INDEX.md). Ngoài phạm vi: purge vật lý, NCKH, thiết kế lại auth/identity, official Google Forms API, provider mới, worker nền, commit/deploy.

## Phân loại và grouping legacy

Giữ nguyên từng byte ledger/usage/submission/AI cũ; không hoàn tiền, tính lại giá lịch sử, đổi Balance/TotalUsed. Giá tạo rules cũ1, AI Option2/3 cũ2/3 bao gồm quyền thành công đầu trả trước đang đề xuất; giá mới0/1/2 + gửi thành công1. Lưu policy trên batch/response/item, không suy từ giá hôm nay hay browser storage.

| Bằng chứng legacy chắc chắn | Quyền/chính sách gửi đề xuất |
|---|---|
| Response hợp lệ, chứng minh bundled debit tạo; không attempt sau drain | Available: thành công đầu prepaid0; thành công gửi lại thu1. |
| Success trước đáng tin, nối đúng response | Consumed: mỗi success gửi lại thu1. Cờ Success cũ chưa đủ vì client coi2xx/302 success; mơ hồ phải đối soát. |
| Rejection xác nhận, chưa từng success | **L1 user quyết định:** khuyến nghị Available; chỉ consume prepaid khi success đầu. Chưa áp dụng đến khi review/duyệt. |
| Có thể đã gọi, log dở, timeout, Failed/Success mơ hồ, thiếu evidence | ReconciliationRequired; không gửi mới/tự retry miễn phí/debit/release. Legacy unknown trước cutover có thể không monetary hold; không tạo hold/debit hồi tố. |
| Thiếu pricing provenance hoặc owner/ledger/log mâu thuẫn | Cách ly khỏi reuse/send mới; giữ owner recovery chỉ đọc và audit đến khi được phép giải quyết. |

Không grouping bằng timestamp gần nhau, payload giống, UI selection hay project hiện tại. Nguồn chứng minh có thể dùng:

- AI: đúng tập response ID distinct qua AiGenerationRunItems.GeneratedResponseId (item theo câu hỏi nên deduplicate), cùng owner/project, count/time completed run hợp lệ, ledger tham chiếu AiGenerationRun. Kiểm link thiếu/trùng, partial/zero-output audit, fee/question snapshot và completion time. Không output hợp lệ không import run.
- Direct rules: command/job với đầy đủ bằng chứng membership bền vững và provenance debit tạo có thể chứng minh run. SubmissionLog chỉ có bản đã attempt; paused/crashed có thể thiếu bản chưa attempt, nên log không chứng minh toàn membership. Ledger tham chiếu job/first response không liệt kê phần còn lại.
- Rules thường: một ledger trỏ first response và timestamp lân cận không đủ nhóm. Giữ GenerationBatchId null; không tạo lượt giả một response hay bịa completion time để lấp quota.

Chuẩn bị manifest backfill idempotent đã review, keyed bởi source evidence ID; có membership, owner/project, completion time đã chứng minh, policy, căn cứ entitlement, evidence hash và lý do loại. Import mỗi run nonempty chứng minh được một lần; batch identity deterministic=first proven response trong thứ tự manifest rõ ràng; AI RunId giữ riêng. Mỗi user giữ20 imported run mới nhất theo cùng thứ tự SQL time/ID; đánh dấu run cũ evicted. Không copy/thu lại ledger/AI audit. Legacy chưa nhóm nhưng từng bản có bằng chứng vẫn giữ owner preview/first-use recovery hẹp, không cấp membership lịch sử mới tổng quát. Storage vật lý ngoài quota.

## Trình tự quiesce/drain (thao tác tương lai khi được phép)

1. Ghi SHA/snapshot bất biến, schema/contract/quyết định đã review, server/DB identity, owner process/account/operator và kế hoạch khôi phục. Backup/restore cần quyền vận hành riêng. API có thể tự migrate lúc start: không start vào DB chưa được phép chỉ để xem hành vi.
2. Chặn mọi generation/send admission cũ, cả direct, tab cũ và API instance đồng thời; hiển thị maintenance/upgrade. Owner GET polling vẫn có. Chỉ chặn frontend không đủ. Không chạy đồng thời writer giá bundled cũ và separated mới.
3. Drain AI đang tạo thành audit/result bền vững theo giá cũ hoặc rollback precommit có chứng minh; kiểm kê Pending/Running/Paused/Cancelled chưa ack, item attempted/unattempted. Không kill process không rõ owner hay gán rejection để kết thúc drain.
4. Chờ runner acknowledgement/outcome bền vững cho item đã gửi. Unknown cần phân loại bằng evidence, không replay provider. Chỉ stop item chưa attempt khi có proof/ack. Tách legacy unknown khỏi monetary hold tương lai. Chưa phân loại được=>giữ path bị chặn; activation cần policy exclusion/reconciliation đã review và không còn runner cũ không an toàn.
5. Preflight account trùng/orphan/count/evidence. Migration được phép mới thêm nullable column/bảng trước, chạy manifest deterministic, kiểm constraint/index/v2 nonnull; giữ row cũ. Sai lệch=>dừng, không auto merge/delete.
6. Xác minh độc lập membership/entitlement/newest20, tổng ledger/account/audit gốc, hold/event/item invariant và cả hai owner access path. Rehearse lost commit/rollback bằng synthetic receiver/fake AI; so call count và SQL fresh-read.
7. Chỉ restart runtime sở hữu trên version/schema đã review, smoke User/wrong-owner/Admin/no-session, history/resend/direct controls. Kiểm reload/session switch, chunks/hydration/API logs. Live provider tắt đến khi evidence/reconciliation gate qua. Review bằng chứng activation trước enable riêng có quyền; Task1 không release.

Rollback phải fence writes lại. Khi đã có hold/settlement mới, không start writer cũ hay destructive Down migration: chúng không hiểu Available/prepaid claim. Ưu tiên forward repair; restore cần quyền recovery riêng đã review và đối soát external outcome. Backup không thể hoàn tác Google submission.

## Client cũ, recovery và session

- Request send/direct v2 bắt buộc ContractVersion2. Version thiếu/không rõ với command mới=>409 ClientUpgradeRequired, không diễn giải lại request giá bundled. Cùng command v2 GET/replay theo owner, không thực thi lại. Legacy direct command không fingerprint chỉ GET recovery; POST=>409 kể cả đổi Count. Đây là siết chủ ý so với test hiện bỏ qua Count đổi.
- Resume envelope web tương lai: `version:2`, `userId`, `projectId`, `batchId|null`, `commandId|null`, IDs response và snapshot phí/hiển thị từ server. Balance/fee/payload/confirmation browser không có thẩm quyền. Preview v1/không version phải refetch owner recovery; xác nhận AI/history mới trước command mới. Command đã phát hành trước tiên GET; không auto-POST lúc mount/reload/reconnect/trở về topup.
- ID legacy trong local storage theo user (DirectRuleCommandContext hiện tại) chỉ là gợi ý read-only recovery. Job thiếu/không rõ không chứng minh chưa dispatch; không tự retry tạo/gửi. Hiển thị server state; chỉ thao tác chủ động mới sau review eligibility/uncertainty.
- Logout/đổi user xóa history/selection/payload/pending confirmation trong memory, abort read cũ, key cache theo user/session xác thực và refetch. Không import snapshot legacy của user khác; không xóa evidence không liên quan/không đọc được. Không phục hồi confirmation đã chấp nhận từ storage.
- Owner preview recovery giữ cho legacy chưa nhóm từng bản đã chứng minh, có kiểm compatibility/entitlement. Response batch đã loại không được đọc qua route cũ/mới. Snapshot admitted job và GET status vẫn đọc được sau eviction.

## Đối soát đề xuất (tool operator Deferred)

Không đề xuất public mutation endpoint hay worker tự động. Implementation/tooling/quyền operator cần review/authorization riêng trước production activation. Polling chỉ đọc không quyết định tài chính. Thiếu operator/evidence không phải quyền release quỹ.

Evidence success phải nối duy nhất item/attempt v2 hoặc identity response/log/manifest legacy, form identity, payload bất biến tới kết quả acknowledged/received đáng tin. Evidence non-success phải chứng minh không có response được chấp nhận (ví dụ no-dispatch bền vững đã ack trước I/O hoặc validation rejection chắc chắn đã review). Một dòng đáp án giống có thể mơ hồ giữa payload trùng; thiếu dòng/chênh count, thời gian trôi, screenshot, lời user, HTTP status/error text/cờ Failed cũ không đủ. Core chưa có receipt/khả năng đọc response Google chính thức. Không mặc nhiên cho rằng export owner nhận diện attempt, mở OAuth scope hay gọi NCKH/Forms API để tạo proof.

Thủ tục operator khi đã được phép riêng:

1. Fence item v2 hoặc identity response/log legacy và eligibility gửi mới; kiểm actor role/right, owner, payload/form hash, pre-call event, provider trace, outcome/settlement trước. Đọc artifact qua storage nội bộ có kiểm soát, không fetch URL client hay log token/đáp án nhạy cảm thô.
2. Ghi evidence ID, classifier/version, artifact reference+SHA256, observed time, actor UserId và reason không rỗng max1000; append event bất biến. Reviewer xác nhận nguồn phân biệt attempt này với dữ liệu trùng; không đủ=>giữ Unknown.
3. Item/reservation v2 dùng SettleAttemptAsync với lock/key evidence exact: success debit chính hold hoặc consume prepaid claim; rejection chắc chắn chỉ release hold/claim của item. Legacy no-hold không item/reservation dùng ReconcileLegacyAttemptAsync(LegacyAttemptIdentity, VerifiedSubmissionOutcome), không SettleAttemptAsync: kiểm owner/project/response/log-hoặc-manifest-đã-review/hash, append LegacyAttemptEvidence+AuditLog bất biến và đổi entitlement/fence atomically. Không item/reservation/hold/debit hồi tố giả. Success consume entitlement đã duyệt; non-success chắc chắn chỉ restore khi L1 đã duyệt, không success trước/legacy attempt chưa rõ; Unknown giữ fence. Tool/operator mutation vẫn Deferred. Cả hai path không gọi provider/refund/sửa ledger lịch sử.
4. Fresh-read event/item/reservation/account/ledger/usage/submission và so invariant. Evidence lặp trả kết quả cũ. Fact terminal mâu thuẫn=>conflict/dừng điều tra được phép riêng, không ghi đè/auto-compensate.
5. Giữ evidence/review có access control. Chỉ mở eligibility response đã giải quyết. Không TTL/auto-resend/auto-release/runner takeover. Không giải quyết được=>giữ quỹ/claim và fence, báo qua UI được duyệt, không gửi message bên ngoài mới.

**Giới hạn vận hành:** receipt/call count giả chứng minh phần mềm, không chứng minh Google nhận thật. Không lập được bằng chứng real-form success/non-success an toàn=>paid sending activation Blocked. Refund/goodwill thủ công rộng hơn là quyết định tài chính mới, chưa được bịa ở đây.

## Quyết định ngắn gọn cho root/user review

| ID | Khuyến nghị và lý do | Hệ quả/gate |
|---|---|---|
| L1 (tài chính mới) | Giữ prepaid first-success sau legacy confirmed failure chưa từng success; giữ tổng phí lần dùng đầu đã trả. | User duyệt rõ trước consumer entitlement/backfill; unknown vẫn fence. |
| L2 (kỹ thuật/chuyển đổi) | Chỉ import nhóm hoàn chỉnh có proof; giữ recovery legacy chưa nhóm đã chứng minh; cách ly row không rõ, không đoán timestamp/outcome. | User review phần legacy không được reuse và thiếu certainty; manifest/SQL rehearsal trước cutover. |
| P1 (evidence/support provider) | Chỉ gửi form public có metadata kiểm đầy đủ và confirmation/rejection evidence đã review; còn lại fail closed. | Chưa có receipt đáng tin. User review phạm vi form hỗ trợ bị giảm; safety review độc lập/real-flow evidence trước activation gửi tính phí. Tạo/lịch sử vẫn trong scope đã duyệt. |
| O1 (vận hành) | Duyệt riêng quyền operator và rubric/tooling evidence; Unknown không tự hết hạn. | Cho phép khả năng đối soát có người chịu trách nhiệm trước activation hoặc giữ gửi tắt. Tài liệu không cấp quyền endpoint/worker. |

Root trình các artifact song ngữ cụ thể sau fresh independent review contract/DB/safety; tác giả không hỏi human hay đánh dấu approved. Gate tài chính bắt buộc vẫn Blocked đến khi ghi quyết định rõ. Task1 giữ canonical API/entity/architecture docs; thay đổi đã duyệt có thể được đề xuất ở đó về sau.

Guard generation cũ: cả hai API tạo giữ URL/body nhưng bắt buộc header v2 ở CONTRACTS khi mở admission. Kiểm phía server trên mọi instance; tab tạo cũ nhận409, không nhận giá mới dưới UI cũ. Không thêm xác nhận tạo cho rules.

## Làm rõ round 1: observation lúc tạo và runner dừng

Backfill/import ghi ObservedMetadataJson đúng quan sát lúc tạo, gồm Required=null/constraint/receipt unknown, không giả parser cũ biết false/không có. Thiếu compatibility/receipt không chặn tạo/lưu lịch sử; chỉ chặn admission gửi. Snapshot CompatibilityEvidence đầy đủ mới được lấy riêng mỗi admission gửi và copy bất biến vào item, không bịa từ metadata batch cũ.

Lifecycle/predicate chuẩn ở [CONTRACTS](CONTRACTS.md#vòng-đời-job-và-ánh-xạ-active-project): runner acknowledgement khác đóng tài chính. Unknown đã dừng có thể Failed/Cancelled+FinishedAt nhưng vẫn fence project và hold Reserved; project khác thấy Available giảm. Legacy unknown no-hold fence eligibility response; job active cũ vẫn cần drain/phân loại trước cutover, không bịa hold/counter/runner ack v2 cho chúng. Rehearsal phải kiểm phân biệt này, gồm legacy không item replay/conflict và tạo/lịch sử thành công với metadata thiếu.

Yêu cầu record vận hành: mọi báo cáo drain/finalization/reconciliation phải ghi exact giá trị RunnerAcknowledgedAt và FinishedAt (hoặc null rõ ràng) cùng kết quả predicate active-project; không suy từ text Status.

## Kết quả diễn tập local Task6 — 2026-11-05

Diễn tập trên Safety SQL có guard dùng API5305/web3305 deterministic. Xem [VALIDATION](VALIDATION.md), [HANDOFF](HANDOFF.md), [supplement đã triển khai](../../GENERATION_HISTORY_CONTRACT.md). Selected/direct send production-config fail-closed 409 FormEvidenceUnavailable, không job, hold hay provider invocation. Receiver synthetic được gắn nhãn, không chứng minh Google delivery.

`task6-cutover-transitions.jsonl` ghi success/rejection/Unknown v2 synthetic sau runner stop. Mỗi ca giữ Failed và đúng RunnerAcknowledgedAt/FinishedAt; success chốt1 lần, rejection giải phóng1, Unknown giữ Reserved1 và active fence. Replay cùng evidence chỉ đọc; facts khác và thiếu actor reason bị từ chối. Legacy no-hold có RunnerAcknowledgedAt=null, FinishedAt=2026-11-05T16:47:27.174296+00:00, LegacyActive=false và OutcomeUnresolved; không tự tạo hold/group/ghi lại ledger.

Ruling của root: `ILegacyAttemptReconciliationService.ReconcileLegacyAttemptAsync` được đề xuất nhưng chưa có; operator mutation/backfill là Deferred và không triển khai. Legacy mutation/import và Google receipt classification thật vẫn Blocked. Không nhóm timestamp, production cutover, reopen admission hay activation.
