# FAH-DIRECT-001 — Closeout cục bộ

Ngày: 2026-11-02. Trạng thái: **Done local** trong scope được duyệt sau review độc lập cho lần sửa copy cuối; chưa commit, tích hợp, deploy hoặc phát hành.

## Tóm tắt

Option 1 rules hiện dùng một thao tác **Tạo và gửi ngay**, không có UI preview, checkbox hoặc xác nhận lần hai. Option 2/3 giữ AI preview và xác nhận rõ. Route direct dùng response hiện có đã duyệt, partial-credit x1, replay chỉ đọc theo first-call-wins, runner tuần tự chung và ranh giới recovery fail-closed.

Lần sửa copy cuối loại bỏ wording preview đã cũ khỏi toast phân tích Rules, metadata workflow và helper editor quy tắc, đồng thời giữ wording preview/xác nhận của AI. Review đóng task độc lập không tìm thấy finding Critical/Important chưa xử lý.

## File đã thay đổi

- Backend/API services, DTO/controller/DI và focused tests được liệt kê trong [BACKEND](BACKEND.md).
- Frontend rules workflow, command recovery và focused Playwright coverage được liệt kê trong [FRONTEND](FRONTEND.md).
- Contract baseline song ngữ hiện hành và task report, gồm [DOCS_SYNC](DOCS_SYNC.md).
- Không đổi entity, migration, dependency, production configuration hoặc provider integration.

## Phù hợp scope

Authorization, giới hạn 1..100, batch tuần tự 10, dedicated credit service/`CreditTransactions`, `UsageLogs`, `SubmissionLogs`, riêng tư wrong-owner, xác nhận chung cho AI và quy tắc anti-abuse vẫn được giữ. Không thêm schema/status/refund/provider, automatic takeover, tự gửi lại hoặc cam kết exactly-once.

## Validation đã thực hiện

- Verified backend focused 58/58, không skipped, gồm 20 ca SQL thật; concurrency SQL runtime ban đầu 8/8. Snapshot broad backend trước đó: 315 pass và 12 phương thức SQL skipped, với giới hạn snapshot đã ghi. Build Release pass.
- Verified frontend affected suite 30/30 trước F2 round 2, focused direct suite cuối 17/17, lint pass và production build pass, chỉ còn warning ngoài scope đã ghi.
- Verified review độc lập backend, frontend và final code/spec. Final review khớp 24 hash đóng băng và không còn finding Critical/Important chưa xử lý.
- Verified runtime an toàn với auth local thật, dashboard read, rule write, direct API và persistence SQL cô lập thật. Chỉ bước analysis dùng fixture deterministic; submission kết thúc tại loopback fake receiver sở hữu, không phải Google.
- Verified recovery sau transport reset dùng lại cùng command, không save rule hoặc gọi provider lần nữa; 42 Next chunks trả 200, không page exception, mobile 390px không overflow ngang và AI mode giữ preview gate mà không gọi provider.
- Verified SQL cuối: một completed job total/success 1/1, một debit -1, một generated response đã submitted, hai usage row tổng một credit và không failure, một submission log thành công, balance 4. Log reset/AI-profile 404 dự kiến đã được chẩn đoán.
- Verified các port API/web/receiver sở hữu 7042/3020/18081 đã giải phóng. DB riêng, fixture synthetic, log và screenshot được giữ lại làm evidence.
- Verified copy-fix RED 1 rồi GREEN 3/3, Playwright affected 35/35, lint/build exit 0, detector `[]`, và runtime production browser dùng mock mới với 32/32 chunk HTTP 200, không có console/page error, port 3021 đã giải phóng. Hash freeze và ma trận chấp nhận được ghi trong [COPY_FIX](COPY_FIX.md) và [COPY_FIX_REVIEW](COPY_FIX_REVIEW.md).

## Validation chưa thực hiện

- Not run: gửi Google live, AI generation live/trả phí, production/current DB, deployment, production smoke, commit, push, integration hoặc release.
- Xác nhận sau AI preview được cover bằng frozen Playwright suite, không phải runtime call provider live/trả phí.
- Closeout này không tuyên bố đã chạy lại broad full-repository suite sau mọi cập nhật tài liệu/runtime cuối.
- Reviewer copy-fix không chạy lại suite của author hoặc check backend/API/SQL; hash backend không đổi và bằng chứng đã review độc lập/kiểm chứng runtime trước đó được tái sử dụng cho delta chỉ sửa copy frontend.

## Rủi ro và Deferred

- Hard crash hoặc commit không chắc chắn có thể để lại reservation active cần đối soát thủ công; replay không takeover.
- Hủy paused runner đã thoát có thể để `Cancelled` với `FinishedAt` null và chặn admission tới khi đối soát thủ công.
- Web Locks là yêu cầu cho việc tạo direct command an toàn giữa nhiều tab. Browser không hỗ trợ sẽ fail closed trước rule write/tạo direct command.
- Không tự gửi lại outcome provider chưa xác định. Không duyệt automatic recovery, refund behavior hoặc mở rộng schema.

## Bước tiếp theo đề xuất

Task đủ điều kiện đóng cục bộ trên snapshot đã freeze. Người dùng quyết định có commit và tích hợp hay không. Mọi push, deployment, production validation, cleanup evidence, xóa database hoặc release cần quyền và evidence riêng. Staging chọn lọc phải kiểm kê artifact untracked và secret-check `src/FormAutoHub.Api/artifacts/`; không tự động stage toàn bộ dirty tree.
