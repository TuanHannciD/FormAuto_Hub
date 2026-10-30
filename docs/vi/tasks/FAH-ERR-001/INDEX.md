# FAH-ERR-001 — Hồ sơ audit hiện hành

## Acceptance local cuối — 2026-10-30 13:50 UTC

**24 đã sửa /24 Verified /0 finding mở trong phạm vi remediation local đã duyệt.** [Review độc lập tổng fresh](../../../../artifacts/reports/error-remediation-2026-10-30/final-overall-review/report.md) chấp nhận source, check bắt buộc phù hợp và paired docs; SHA256 report `15b99709168ff1b61951642a5be1128fc20dee5a0a5f807067e3d5130db6181c`. Không claim toàn hệ thống hết bug, integration hay release. [Bảng acceptance/bằng chứng24 ID hiện hành](REMEDIATION_VALIDATION.md) sở hữu trạng thái hiện tại, thay phát biểu tiến độ cũ bên dưới; vẫn giữ các phát biểu cũ làm lịch sử theo ngày.

Review cuối thấy residual P2 ERR-001/003/018 ở core `/auth/callback?id_token=...`. Fix tối thiểu nay chỉ map typed ApiError Google POST409/401 sang hướng dẫn hiện có, còn lại fallback chung an toàn. RED3 hợp lệ trước fix. Verified: Node27=callback3+shared15+auth9, build mới exit0, lint exit0 với đúng hai warning đã review; review source đúng scope chấp nhận. Browser10 đầu=7pass/3strict-locator fail, sau sửa targeted callback3 pass đủ assertion. Test giới hạn alert trong region AuthShell có nhãn; route announcer rỗng của Next nằm ngoài. Sửa fixture không đổi production; giữ evidence Failed.

Evidence Verified khác: backend Release build;291pass/6SQLmigrationSkipped/0fail; SQL durability9; AI services/controller thật+fake adapter SQL6 lượt/5scenario; Program25HTTP thật+SQL độc lập; browser/CLI/Node tập trung. D vẫn split10pass+targeted4, không full13rerun; broad83 vẫn69pass/14fail rồi rerun target. Hfinal3ESMpass không xóa cold health fail cũ chưa rõ cause. Không claim provider/payment/submission thật.

Process riêng cuối đã release/listener không còn tại `runtime/auth-callback-final/release.json`; API có proof riêng. `generated-config-restoration.json` restore tsconfig SHA5BB0AC… và next-env SHA F4E897… **đúng byte baseline371 ban đầu**. Proof tsconfig C706… trước chỉ thuộc snapshot LF trước wave sau, không byte ban đầu; proof cuối thay claim độ chính xác đó. Giữ cache/fixture rows.

[Inventory ownership cuối](../../../../artifacts/reports/error-remediation-2026-10-30/dossier-checkpoint/owned-delta-from-baseline371-final.json):80file riêng=52product+22test+2contractdoc+4tooling;57hash đổi so baseline371/23ngoài scope (không tự chứng minh file mới).75overlap runner343 hiện hành khớp, năm path ngoài scope runner; actual hash không drift. Không làm lại DB-sync/đếm dirty tùy tiện. Manifest runner SHA7183A217… chứa byte callback/fixture cuối.

Root `gpt-6.1-sol/medium`; mọi dispatch tiếp tục kiểm catalog/đặt rõ `gpt-6.1-sol/high`, không con/Astra. Sole runner `/root/runtime_resume` giữ runtime; writer chỉ sửa source/test đã giao hoặc paired docs/artifact static đúng ownership được duyệt. Verdict review tổng fresh đã accepted; cập nhật sau review này chỉ đổi status/link theo verdict và chỉ đạo root. Không commit/push/merge/deploy/cleanup/provider action.

## Checkpoint lịch sử — giữ tiến độ trước bên dưới

## Root cập nhật mới nhất — thay trạng thái chờ ở checkpoint cũ

Backend full run:291 Passed,6 SQL Skipped,0 Failed; gate SQL chưa được kiểm chứng. Browser32 C/E/F:30 Passed,2 Failed ở fixture đếm GET; browser13 D:10 Passed,3 Failed locator ERR-024 trước khi kiểm hành vi. Giữ evidence fixture Failed; không suy product pass khi assertion chưa tới. **Review source F độc lập thấy P2 ERR-015 approve receipt mất field đã xác nhận hiện có; fix-r1 đang làm, acceptance source phần còn sót là Failed.** Câu đủ24 implementation chỉ nghĩa có patch, không đủ acceptance. H source chấp nhận, VM24 pass; ESM smoke thật chờ chạy. Gate API/SQL/fault/browser cuối vẫn mở; chưa full Done. Inventory72 mô tả packet freeze trước, không chứng nhận byte F fix-r1 đang sửa.

## Checkpoint remediation — 2026-10-30 08:56 UTC / 15:56 ICT

Quyền người dùng nay gồm sửa cả24 finding, source/test/docs và kiểm chứng local an toàn. Cả tám vùng A–H đã có source implementation đúng scope. **Chưa finding nào Done:** còn gate browser/API/SQL/fault/log/build cuối. [Acceptance và bằng chứng từng ID hiện tại](REMEDIATION_VALIDATION.md), [ledger thực thi](REMEDIATION_LEDGER.md), [plan đã duyệt](REMEDIATION_PLAN.md) sở hữu tiến độ hiện hành.

Packet Verified: A14+36, AI48, C15+auth9, Gfix6+63+87, Dnode8, Enode9, Fnode22, H24; có ca giao nhau, không cộng thành tổng test duy nhất. Snapshot source A/B/C/D/E/G đã được review độc lập nhận; F/H đang review. Wave C5+E4+F23 browser32 đang chạy, D browser13 chờ; không ghi browser pass tại đây. Chỉ runtime owner acquire tài nguyên; lần này chỉ cập nhật tài liệu.

Giữ baseline runtime371 đường; manifest ownership worker mới nhất khai báo72 file riêng (51 hash thay đổi,21 ngoài scope baseline), khác mẫu số screening321 và99 UI-read lịch sử. [Giới hạn coverage/inventory](REMEDIATION_VALIDATION.md). DB-sync đã xong; history legacy đã biết không blocker, không làm lại. Provider/payment/submission thật, release/cleanup và contract chưa duyệt vẫn Deferred.

## Checkpoint audit lịch sử — giữ nguyên bên dưới

Mọi phần sau giữ assertion theo ngày, gồm chữ “hiện tại”, “chưa sửa”, Not run/Deferred cũ. Chúng mô tả snapshot audit lúc ghi; tiến độ remediation được checkpoint trên thay thế. Reproduction pass cũ không kiểm chứng fix.

2026-10-30 · Snapshot sản phẩm đã audit HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. **24 nhóm sau khử trùng: 2 P1 / 20 P2 / 2 P3. Chưa đủ kiểm chứng toàn hệ thống.**

## Kết quả hiện tại và quyền thực hiện

Người dùng cho phép đồng bộ DB local thực tế với backup/restore an toàn, rồi tiếp tục audit lỗi còn dở. Root chỉ điều phối; agent Sol/high riêng sở hữu implementation, SQL/runtime, audit, review độc lập và tổng hợp. Triển khai sửa các lỗi và release còn Deferred. Đồng bộ DB có [hồ sơ FAH-DB-SYNC-001 riêng](../FAH-DB-SYNC-001/INDEX.md).

- [Báo cáo sâu](DEEP_AUDIT_REPORT.md) giữ ERR-001–023 cùng correction ERR-012/015. [Finding ERR-021–024](DEEP_AUDIT_FINDINGS.md) thêm **ERR-024 / P2** được review độc lập nhận: ô ngày/giờ hiện mặc định nhưng config POST vẫn giữ trường rỗng.
- [Review UI còn lại](../../../../artifacts/reports/error-audit-2026-10-29/deep/ui-remainder-review/report.md) nhận ERR-024, gộp UIR-002 vào ERR-019, UIR-003 vào ERR-021/017 và UIR-004 vào ERR-021. Không thêm ID trùng.
- Hai tác giả UI ghi nhận **99/99 lượt đọc trọn tệp TS/TSX = 43 trước + 56 còn lại không giao nhau**, trong `apps/web/{app,components,lib}`. Reviewer kiểm inventory/disposition/hash và unit chọn; không tự đọc lại cả99. Đã chạy lại độc lập hai quan sát mock từ source gốc; khớp8 hash nguồn probe. Đây là bao phủ source/mock, chưa kiểm browser/API/SQL.

## Normalization main và audit thật tiếp tục — hiện tại

**Verified main apply thật UTC2026-10-29T19:42:12 (ICT2026-10-30):** attempt03 dùng wrapper/helper NoPooling đã review chính xác,cùng incremental R1 không đổi. Main current13/applied14,pending0/modelPendingfalse,POST compatible,canonical400/100bytes;chỉthêm planned migration,count/PK/full-row hash33bảng business không đổi,giữ hai index legacy exact INFO. [Kết quả execute](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-result-03.json),[POST thật](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-cutover-post-03.log). History14/source13 là legacy đã biết đúng kỳ vọng,không blocker. Program/Migrate startup/read smoke main thật nay Verified:health200,profile anonymous401,route thiếu404;PID24496/5247 riêng đã dừng theo yêu cầu,fingerprint34bảng sau migration không đổi qua startup. [HTTP proof](../../../../artifacts/reports/error-audit-2026-10-29/deep/api-sql/main-http-results.json). [Review cuối độc lập](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) nhận DB sync giới hạn và audit đại diện;không release/full-system.

Attempts01/02 dừng trước normalization bởi guard không đổi;attempt02 chứng minh session fingerprint pooled riêng. Helper NoPooling riêng/attempt03 đã có [GO độc lập mới](../../../../artifacts/reports/db-sync-2026-10-29/main-apply-review-attempt03/report.md);giữ helper gốc/evidence lỗi,không nới guard. [Lịch sử attempt](../../../../artifacts/reports/db-sync-2026-10-29/runtime/main-attempts01-02-report.md). Candidate SQL Msg102 ban đầu giữ Failed/đã rút;R1source17integration/B2SQL16pass0skip là evidence thành công riêng.

[Follow-up API/JWT/SQL thật](RUNTIME_API_SQL.md) nay ghi **15scenario+health+2authsetup=18quan sát HTTP** trên restored clone riêng,session User/Admin/refresh thật,13/18log correlation bằng trace hiện hữu. Tăng ERR-002MVC errors/traceId thật,ERR-005UsageLog AnalyzeForm thất bại persisted và ERR-013HTTP500 thật/noPackagePersist;không ID mới/sửa lỗi. Fixture sau B2 khiến clone hiện không còn byte-equal main. Browser/provider/full E2E còn thiếu;không nâng mock cũ hoặc18quan sát thành đã test cả24nhóm.

## Bằng chứng, giới hạn và bước tiếp theo

Backend16/HTTP giả+InMemory, UI8/mock và browser5/HTTP fixture giữ đúng mức bằng chứng cũ. Browser dùng Next thật với API/session giả; chưa kiểm tích hợp ASP.NET/auth/SQL/provider thật. Capture browser có26 JS request HTTP200 +1 HMR dev abort, không hydration exception đã thu. Cache ignored `apps/web/.next` bị ghi là kết quả tách output **Failed**, vẫn giữ. PIDs27304/21404, ports3137/3138 và tab incognito riêng trước đã nhả.

[Coverage](COVERAGE.md), [Validation](VALIDATION.md) và [inventory sàng lọc321 tệp lịch sử](SOURCE_INVENTORY.md) giữ mẫu số. Manifest/review cũ chỉ chứng nhận bytes theo ngày; migration/tool/test mới cần append inventory snapshot, không ghi lại lịch sử321. [Baseline đã giữ](../../../../artifacts/reports/db-sync-2026-10-29/dossier/baseline-documents.json) lưu dossier trước cập nhật. Check tổng hợp hiện tại thuộc `db-sync-2026-10-29/dossier/current-validation.json`; check synthesis cũ là lịch sử.

Roster cấu hình thực tế: root `gpt-6.1-sol / medium` điều phối; workers được giao `gpt-6.1-sol / high`, không con/Astra. Checkout isolated/task identity của implementer ở dossier DB. Người viết này chỉ sửa task docs song ngữ/dossier evidence, không acquire SQL/process/browser. Giữ backup/DB riêng/evidence; không tự cleanup, install, commit/push/deploy hoặc gọi provider/gửi form trả phí.

Tiếp theo: nhận migration được review độc lập + kết quả clone/clean/guard, hoàn tất đồng bộ main và evidence API/role/runtime audit thật phù hợp, rồi cập nhật checkpoint theo report chính xác. **Deferred:** sửa cả24 nhóm lỗi, hợp đồng error/correlation mới, policy recovery/retention, provider live và release. Không đóng full audit bằng số đọc tay hoặc việc công khai thiếu check.

## Đã giao follow-up giới hạn — full audit gốc còn thiếu

[Review cuối độc lập](../../../../artifacts/reports/db-sync-2026-10-29/final-review/report.md) nhận follow-up API/SQL thật và DB normalization local đã hoàn tất. Register vẫn24nhóm:2P1/20P2/2P3,chưa sửa nhóm nào;ERR-013actual500 vẫn là lỗi hiện hữu. Gate full-system/browser/provider gốc giữ mở. Bytes/link/AI-VI docs cuối thuộc verifier dossier hiện tại,không là reviewer chứng nhận dịch. Bước nên làm:chọn nhóm remediation được duyệt;không mở thêm case hoặc tự chạy provider.

## Lịch sử mở task và các checkpoint trước

Toàn bộ phần dưới ghi quyền, tiến độ và giới hạn ở thời điểm tương ứng. Các câu “20 nhóm”, “không dispatch/tài nguyên” và runtime Not run đã được phần hiện hành thay thế; không mô tả checkpoint rà sâu này.

Ngày: 2026-10-29. Trạng thái: **Đã xong lượt rà tĩnh toàn phạm vi được chọn — kiểm chứng runtime toàn hệ thống còn Not run**.

## Yêu cầu và quyền thực hiện

Người dùng yêu cầu mở task rà soát tất cả thông báo lỗi về: gộp nguyên nhân gây khó chẩn đoán; thông báo UI khó hiểu với người không chuyên do tiếng Anh hoặc thuật ngữ; thông báo console/throw thiếu dữ kiện phục vụ test, debug và truy vết.

Yêu cầu này cho phép tạo hồ sơ task song ngữ. Mốc này xác định phạm vi và tiêu chí rà soát; không khẳng định đã rà soát hoặc duyệt một thiết kế sửa cụ thể. Không chọn phase toàn cục mới. [FAH-UI-002](../FAH-UI-002/CLOSEOUT.md) đã đóng, chỉ là bối cảnh, không phải hàng đợi triển khai đang hoạt động.

## Kết quả và phạm vi

Lập danh mục có thể truy vết và các phát hiện có thứ tự ưu tiên trên mã do dự án duy trì: UI web, helper API/xử lý lỗi dùng chung, controller/service/integration API, bộ xử lý ngoại lệ, validation, console trình duyệt/máy chủ và logging. Bao gồm user/admin, xác thực, credit/nạp tiền/thanh toán, tự động hóa biểu mẫu, AI và nhánh NCKH có quy định riêng. Kiểm tra script và helper kiểm thử được duy trì khi chúng che mất hoặc làm sai lệch lỗi ứng dụng.

Theo dõi lỗi từ nơi phát sinh qua catch/chuyển đổi/HTTP/xử lý phía client tới UI và đầu ra chẩn đoán. Bao gồm lỗi tại trường nhập, toast/hộp thoại/trang, callback, trạng thái rỗng/lỗi và lỗi bất đồng bộ. Phân biệt nhánh có thể tái hiện trên runtime với nhánh mới đọc mã. Không rà mã sinh tự động/thư viện bên ngoài/build như mã dự án; đánh giá cách xử lý lỗi bên ngoài tại ranh giới tích hợp.

Ba nhóm phát hiện:

1. **Gộp hoặc phân loại sai nguyên nhân:** lỗi khác nhau bị gom một thông báo; request thất bại hiển thị thành dữ liệu rỗng/thành công; mã lỗi hoặc nguyên nhân hữu ích bị ghi đè; fallback/retry che mất thất bại.
2. **Khả năng hiểu của người dùng:** tiếng Anh chưa dịch, thuật ngữ chưa giải thích, câu mơ hồ, sai ngôn ngữ, thiếu thao tác bị lỗi hoặc bước tiếp theo khả thi, UI mâu thuẫn với kết quả thực tế. Ưu tiên tiếng Việt dễ hiểu; đánh giá tên sản phẩm và thuật ngữ cần thiết theo ngữ cảnh, không cấm mọi từ tiếng Anh.
3. **Độ đầy đủ khi chẩn đoán:** nuốt ngoại lệ, mất nguyên nhân/stack gốc, throw/log không có ngữ cảnh, sai mức độ log, ghi trùng gây nhiễu, thiếu ngữ cảnh thao tác/lớp xử lý hoặc không nối được UI/API/log. Kiểm tra khả năng truy vết hiện có trước khi đề xuất bổ sung.

## Tiêu chí rà soát

- UI giúp người không chuyên biết thao tác nào thất bại và có thể làm gì tiếp; không bịa nguyên nhân, hứa thử lại sẽ thành công hoặc khẳng định thao tác đã hoàn tác an toàn khi chưa có bằng chứng.
- Các lỗi có cách xử lý khác nhau cần giữ được sự phân biệt qua những lớp liên quan. Thông báo xác thực/bảo mật cố ý dùng chung có thể cần thiết để tránh dò tài khoản; ghi rõ lý do và đánh giá khả năng chẩn đoán nội bộ riêng.
- Chẩn đoán nội bộ giữ được thông tin ngoại lệ gốc hữu ích và ngữ cảnh an toàn. Không đưa nguyên văn lỗi provider, stack trace, SQL, bí mật, thông tin đăng nhập, token hoặc dữ liệu cá nhân lên UI hay vào bằng chứng được commit.
- Mô tả mã lỗi/status/payload hiện tại từ mã nguồn và hợp đồng. Không mặc định `ProblemDetails` đã được duyệt: [hướng dẫn hợp đồng API](../../API_CONTRACT_GUIDE.md#error-response) chỉ ghi đây là phương án ứng viên.
- Đề xuất đổi cấu trúc phản hồi, mã lỗi/status, trường truy vết, DB/schema, lưu giữ log hoặc hành vi nghiệp vụ phải được xem xét rõ về hợp đồng/phạm vi; không tự trở thành tiêu chí triển khai đã duyệt.

## Đầu ra và cấu trúc phát hiện

Giữ danh mục phạm vi và phát hiện trong hồ sơ song ngữ này; tách thành `COVERAGE.md` và `FINDINGS.md` khi bắt đầu rà soát. Lưu bằng chứng runtime cần thiết đã che dữ liệu nhạy cảm tại `artifacts/reports/error-audit-2026-10-29/`; việc lập phiếu này không tạo hoặc công bố các artifact đó.

Mỗi dòng phạm vi ghi module/bề mặt, vai trò, nguồn phát sinh lỗi, handler/nơi sử dụng, đích UI/log, tình huống đã kiểm tra, mức bằng chứng (đọc mã/mock/runtime local/live), trạng thái và phần loại trừ/bị chặn. Ghi ranh giới tìm kiếm và số lượng để đánh giá được chữ “tất cả”; chỉ tìm theo mẫu chưa chứng minh bao phủ đầy đủ.

Mỗi phát hiện ghi:

- ID ổn định, nhóm, mức độ và lý do; module/lớp cùng symbol/đường dẫn chính xác tại snapshot đã rà soát.
- Điều kiện kích hoạt và các nguyên nhân khác nhau; câu UI cùng đầu ra chẩn đoán hiện tại, có che dữ liệu khi cần.
- Hành vi mong đợi so với quan sát; tác động tới người dùng hoặc test/debug/truy vết.
- Bằng chứng/cách tái hiện và phân biệt đã tái hiện với giả thuyết từ đọc mã; phát hiện trùng liên quan.
- Câu UI và/hoặc cải thiện chẩn đoán đề xuất, nơi sử dụng bị ảnh hưởng, tác động hợp đồng/bảo mật, cách kiểm chứng và thứ tự sửa đề nghị.

Lập bản đồ lỗi dùng chung và các nơi sử dụng để không đếm một lỗi helper thành hàng chục lỗi độc lập. Tách sửa câu chữ đơn giản khỏi sửa luồng truyền lỗi hoặc hợp đồng; phạm vi sửa cuối cùng theo kết quả người dùng xem xét.

## Trình tự và tiêu chí nghiệm thu

- [x] Mở phiếu giao việc song ngữ phản ánh ba mục tiêu và ranh giới rõ ràng.
- [x] Xác định snapshot rà soát thực tế, danh mục module/route/handler và ranh giới mã dự án.
- [ ] Đọc đầy đủ đơn vị mã và phụ thuộc liên quan; lần theo luồng lỗi thay vì chỉ đọc chuỗi thông báo riêng lẻ.
- [ ] Phân loại tất cả bề mặt/tình huống trong danh mục; ghi rõ phần chưa kiểm tra hoặc bị chặn.
- [ ] Tái hiện an toàn các lỗi đại diện có tác động cao và đối chiếu UI, network, log. Bao gồm validation, xác thực/quyền, mất kết nối/máy chủ, lỗi provider, timeout và phản hồi bất thường khi phù hợp; không tạo trạng thái nghiệp vụ mới.
- [x] Lập phát hiện có bằng chứng và ưu tiên, câu chữ/chẩn đoán đề xuất, nhóm sửa dùng chung và khuyến nghị kiểm chứng.
- [x] Tự rà soát độ bao phủ, bảo mật dữ liệu, tính đúng hợp đồng và đồng bộ AI/VI; ghi riêng review độc lập nếu có.
- [x] Trình kết quả rà soát và đề xuất sửa cụ thể để xem xét. Mở task không có nghĩa các tiêu chí rà soát này đã hoàn tất.

Dùng `Verified`, `Failed`, `Not run`, `Blocked` cho kiểm tra thực tế. Tình huống runtime bị chặn vẫn là thiếu hụt bao phủ; đọc mã hoặc mock không chứng minh hành vi live. Không tuyên bố hoàn tất toàn bộ rà soát khi độ bao phủ bắt buộc chưa được giải quyết.

## Snapshot, trách nhiệm và vùng được phép

- Workspace: `D:/TinHoc/FormAuto_Hub`; branch: `ui/compact-refinement-20261028`.
- HEAD lúc mở task: `606de1eccd9ac21fc91c5d8933d7b9bde8821623`; Git tracked/untracked sạch trước khi tạo các file này. Không lập danh mục hay sửa bằng chứng ignored.
- Người viết: root; model/effort thực tế: `gpt-6.1-sol` / medium. Không dispatch subagent; chưa có review độc lập. Phiếu này không cấp quyền giao việc cho agent con. Agent con được phép sau này phải tuân catalog hiện hành và trần chỉ dùng Sol tại [AGENTS](../../../../AGENTS.md).
- Vùng ghi ở bước mở task: `docs/ai/tasks/FAH-ERR-001/` và hồ sơ cùng đường dẫn tương đối bên `docs/vi/`. Không sửa mã sản phẩm.
- Giữ nguyên artifact ignored, DB, tiến trình và tab trình duyệt trước đó. Không nhận tài nguyên tiến trình/cổng/DB/trình duyệt; không cài dependency, commit, push, merge, deploy hay dọn dẹp.
- Kiểm tra danh tính/quyền sở hữu đích thực tế trước khi chạy runtime về sau. Closeout UI trước ghi việc khôi phục API bị chặn do migration DB lệch mã nguồn; đây là bằng chứng lịch sử, không phải kiểm tra runtime mới hoặc quyền sửa DB.

## Kiểm chứng và bước tiếp theo

Kiểm chứng khi mở task đã kiểm tra liên kết Markdown, UTF-8, phạm vi/cam kết hai bản và ranh giới file thay đổi. Lúc mở task, kiểm tra ứng dụng, phát hiện và kiểm chứng runtime đều **Not run**; checkpoint dưới đây cập nhật tiến độ đó.

## Checkpoint — kiểm kê ban đầu và xử lý dùng chung (lịch sử, được mốc sau thay thế)

Người dùng yêu cầu “Next step”, cho phép thực hiện danh mục và bằng chứng rà soát đã nêu. HEAD rà soát mới: `a19f7a2f3dc1bc54ff645d662d94fc614439256a`; Git đầu bước chỉ có hồ sơ task song ngữ này chưa tracked. Giữ commit mới từ bên ngoài; không reset về HEAD lúc mở task.

- [Coverage](COVERAGE.md): 304 file mã/test/script được chọn, 29 mẫu trang, 25 controller; đã đọc 20 file đầy đủ và đơn vị liên quan ở 2 file, 282 file đang chờ. Ghi rõ bộ lọc phạm vi và thiếu hụt khám phá.
- [Danh mục mã](SOURCE_INVENTORY.md): số khớp tìm kiếm và trạng thái đọc từng file; hash mã trong bằng chứng task local.
- [Phát hiện](FINDINGS.md): năm phát hiện P2; tái hiện năm quan sát bằng giả lập cô lập, cùng một phát hiện phân tích/lịch sử lần theo mã. Số quan sát và phát hiện không tương ứng một-một.
- Verified: probe helper thật 5/5 và `npm run test:auth` hiện có 9/9. Xác nhận hành vi đã ghi/hồi quy phiên, không phải đã sửa hoặc tích hợp live. Không sửa mã sản phẩm.
- Not run: tái hiện trình duyệt/API/DB/provider, build/lint, kiểm tra mới điều kiện runtime và review độc lập. Các tiêu chí toàn bộ vẫn chưa đánh dấu đạt. Không nhận tài nguyên tiến trình/DB/trình duyệt; không dispatch/commit/push/deploy/cleanup.
- Chỉ tự rà soát: phân biệt bằng chứng đọc mã/mock/runtime, giữ bảo vệ thông tin đăng nhập chung, không mặc định hợp đồng lỗi đã duyệt, đồng bộ cam kết AI/VI. Chạy kiểm tra tài liệu trước bàn giao.

Bước tiếp theo: tiếp tục lần theo controller/service thanh toán/credit/submission, rồi NCKH và nơi sử dụng; mở rộng khám phá launcher gốc/cấu hình runtime liên quan. Kiểm tra điều kiện runtime/schema thực tế theo chế độ chỉ đọc trước khi tái hiện; tự migration lúc startup không phải chỉ đọc. **Deferred:** sửa sản phẩm, hợp đồng lỗi/kiến trúc truy vết mới, sửa lệch migration DB, thao tác phát sinh phí provider và phát hành.

## Checkpoint — lượt rà toàn bộ 2026-10-29

Người dùng yêu cầu “Rà xoát hết 1 lượt đi”, cho phép tiếp tục toàn bộ module và cập nhật hồ sơ/bằng chứng. HEAD vẫn `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Phạm vi ghi mở rộng gồm `artifacts/reports/error-audit-2026-10-29/`; không sửa sản phẩm.

- [Báo cáo tổng hợp ERR-006–020](FULL_PASS_FINDINGS.md), cùng [ERR-001–005](FINDINGS.md): **20 nhóm, 2 P1 / 17 P2 / 1 P3**. P1 là thiếu dấu vết khi thao tác ngoài gián đoạn và log toàn bộ payload AI; chưa khẳng định sự cố production.
- [Coverage](COVERAGE.md) và [danh mục nguồn](SOURCE_INVENTORY.md) hiện thay mốc 304 file: **321 file được sàng lọc tự động toàn văn**, 105 file có 701 dòng tín hiệu, 216 không khớp mẫu; đã rà ứng viên và đọc sâu luồng quan trọng xuyên lớp. Không gán 321 file là đã đọc tay/kiểm thử hết mọi nhánh.
- [Kiểm chứng](VALIDATION.md): backend 158/158, auth 9/9, probe UI/helper 11/11 và 4 assertion cấu trúc backend. Test/probe xanh xác nhận bằng chứng hiện trạng, không phải đã sửa lỗi.
- Đã có kết quả lượt rà tĩnh cho tất cả nhóm module, thứ tự đề xuất sửa và bản đồ nhóm sửa chung. Đã self-review; kiểm tra UTF-8/link/hash/parity ghi tại artifact. Review độc lập Not run; không dispatch subagent.
- Runtime/browser/API/SQL/provider Not run; không thấy listener các cổng local đã kiểm tra. API startup tự migrate, cần xác minh target/schema trước khi chạy. Không tự khắc phục mismatch DB cũ hoặc gọi provider trả phí/gửi form.

Các checkbox ban đầu còn mở vì yêu cầu kiểm chứng runtime đầy đủ chưa đạt; không đóng toàn bộ audit như đã kiểm chứng hệ thống. Lượt rà tĩnh này đã được bàn giao, không còn “module kế tiếp” trong lượt hiện tại. Bước đề xuất tiếp theo: duyệt nhóm sửa theo ưu tiên ở báo cáo, rồi thiết kế/test và sửa từng nhóm trong phạm vi được duyệt. **Deferred:** mọi sửa sản phẩm/hợp đồng/schema/retention/khôi phục và release. Không commit/push/deploy/cleanup; root gpt-6.1-sol / medium, không nhận tài nguyên runtime.
