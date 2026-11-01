# FAH-ERR-001 — Follow-up API/JWT/SQL thật

2026-10-30 · **Audit runtime thật đại diện Verified;chưa sửa lỗi hoặc nghiệm thu toàn hệ thống.** Source là binary Release parent SHA256 `1497eab5c545e04ffbdd44091c94af18050e864756855a8747a5ff9a8f268485`. [Report owner đã làm sạch](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/report.md),[quan sát HTTP](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/clone-http-results.json),[ledger](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/ledger.json).

## Đích,role và mẫu số

PID16928/localhost5248 riêng mới chạy Program/Migrate/MVC/JWT/EF SQL Server thật trên **restored clone riêng** `FormAutoHub_FAHERR001_restore_20261029_a19f7a2` id8,đã normalized/history14. **15scenario giới hạn +health+2setup xác thực =18quan sát HTTP**,không là18nhóm lỗi độc lập. Session User/Admin từ register/login/refresh thật cùng signing key chỉ process;không forged bearer/admin bypass. Main user DB không có auth/fixture DML từ audit này.

| Scenario | Kết quả quan sát và ý nghĩa |
| --- | --- |
| JSON sai/thiếu trường login |400 application/problem+json;field/error validation tiếng Anh thật cùng traceId hiện hữu. Tăng bằng chứng ERR-002/019;không mặc định contract mới. |
| Đăng ký password ngắn |400 generic `Bad Request`;không chứng minh API hiện phát câu password cụ thể của fixture cũ hoặc mapping fixture ERR-018. |
| Password sai/profile anonymous |401ProblemDetails `Unauthorized` so401challenge rỗng. Tăng bằng chứng boundary backend ERR-001;giữ bảo vệ credential chung. |
| Quyền User/Admin |User thật403 `Forbidden`;Admin thật200 ở cùng GET admin-packages. |
| Profile/refresh |Profile owned200;refresh200 rồi profile200 bằng token mới. Luồng auth/session/SQL thật;không tái hiện browser account503fallback. |
| Topup/evidence thiếu |UUID ngẫu nhiên404 `Not Found` thật;baseline ERR-016. Không tái hiện realAPI503 hoặc lộ ownership khác. |
| Analyze URL sai/usage |400 `Form analysis failed` / `Invalid form URL.`;GET UsageLogs và aggregate SQL độc lập xác nhận Failed/AnalyzeForm,CreditUsed0,không gọi Google ngoài. Tăng bằng chứng persistence ERR-005. |
| Admin package price0 |500 text/plain thật trong Development;ArgumentException nội bộ tại PackageService.ValidatePackageInput;count package không đổi. Tăng ERR-013 từ throw trong process tới HTTP500 thật;chưa sửa thành công. |

## Persistence,log và tài nguyên an toàn

Register dùng AuthService→CreditService riêng,có một user/account/CreditTransaction owned. Sau audit vẫn1/1/1;failed AnalyzeForm log1,refresh token1→3. SQL fixture trực tiếp chỉ đổi exact synthetic User.Role thành Admin;không sửa balance/credit ledger trực tiếp. Fixture clone diễn ra **sau preservation B2**,nên clone hiện không còn byte-equal main;proof B2 vẫn đúng theo thời điểm.

Server log có34JSON record;TraceId hiện hữu nối **13/18quan sát**. Năm request không có application record khớp theo config hiện tại;không claim mọi request đã log. Artifact auth payload chỉ giữ tên key;response500 chỉ bytecount/content-type,không DeveloperExceptionPage/Authorization. Bounded scan không thấy JWT/Bearer value hoặc external-client origin;không là proof toàn máy/không secret tuyệt đối.

PID16928 được terminate theo yêu cầu,exit1 do requested termination;đã nhả PID/port,giữ SQLservice. Override DB/JWT/AI chỉ process,không sửa config/source. Giữ DP key store ngoài Git. Không acquire browser/provider/charge/submission/gọi ngoài/cleanup. [Release](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/clone-resource-release.json).

## Bốn case bổ sung lưu trữ evidence

Session User riêng khác trên cùng clone upload PNG68byte với tên244ASCII code unit:HTTP200,tên lưu200unit. Aggregate SQL độc lập xác nhận một evidence row,filename DATALENGTH400,MIME18byte,image/png,content68byte,chưa gắn order;orders0,registrationaccount1/CreditTransaction1 qua Auth/CreditService thật. Download200 trả bytes/SHA256 y hệt,`Cache-Control:no-store`,`X-Content-Type-Options:nosniff`;invalidtype400 và file rỗng400 giữ hướng dẫn tiếng Việt hiện có. [Bốn kết quả và aggregate SQL](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/supplement-evidence-results.json).

Đây là validation lưu trữ cột normalized qua API/SQL thật,không nhóm finding mới hoặc test provider/submission. Đã nhả PID19496/5249 sau requested termination;fixture DML chỉ clone,không main mutation. Fingerprint main không đổi sau clone writes. Giữ mẫu số4case riêng với18quan sát trước và3request read smoke main. Không mở rộng case hoặc sửa lỗi nữa.

## Giới hạn và bước tiếp theo

Not run:browser/render/hydration/chunk mới,provider-stub integration qua DI không đổi,network/timeout provider/payment/webhook/submission,toàn surface lỗi,security penetration hoặc production. Browser5/fixture trước giữ riêng. Không ID finding mới;register vẫn24=2P1/20P2/2P3,chưa sửa. Đồng bộ/startup main là [checkpoint DB riêng](../FAH-DB-SYNC-001/VALIDATION.md). Cần review cuối độc lập các quan sát giới hạn và tổng hợp song ngữ;gate audit toàn hệ thống còn hở.

## Evidence cuối đã freeze và nhả tài nguyên

[Manifest evidence22file chính thức](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/evidence-hashes-final.json) thay draft stale vẫn giữ;dùng entry report/hash/size hiện tại,không manifest cũ. [Proof State Listen cuối](../../../../artifacts/reports/db-sync-2026-10-29/runtime/final-resource-release-listen-final.json) xác minh PIDs16928/24496/19496 không còn và0TCP listener5247/5248/5249. Capture PID0 trước là lịch sử,không proof listener cuối. Giữ SQLservice/DB/backup/evidence/DPkey;không cleanup. [Review cuối độc lập](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) nay nhận evidence thực thi đã freeze;bytes docs song ngữ cuối do owner tài liệu kiểm,reviewer không chứng nhận bản dịch.
