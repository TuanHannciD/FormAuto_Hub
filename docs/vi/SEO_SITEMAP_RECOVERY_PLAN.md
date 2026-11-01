# SEO_SITEMAP_RECOVERY_PLAN

## Trạng thái và mục tiêu

- Ngày: 10/10/2026 (Asia/Saigon).
- Thẩm quyền: người dùng yêu cầu kế hoạch chi tiết tiếp tục xử lý sitemap. Lượt này chuẩn bị tài liệu và kiểm tra public chỉ đọc; không phê duyệt sẵn bản sửa chưa xác định, thay đổi production, gửi lại sitemap, commit hoặc deploy.
- Mục tiêu: Google tải và xử lý thành công sitemap hiện có tại `https://formautohub.servertun.pp.ua/sitemap.xml`, đọc đủ sáu URL công khai. Tách riêng việc phát hiện URL, thu thập dữ liệu và đã lập chỉ mục.
- Follow-up SEO/GEO hiện có; không chọn phase mới. Giữ UI, nội dung, route, CTA, chính sách bot huấn luyện và toàn bộ nghiệp vụ.
- Liên quan: [kế hoạch SEO/GEO](SEO_GEO_IMPLEMENTATION_PLAN.md), [runbook](SEO_GEO_VALIDATION_RUNBOOK.md), [deploy guide](DEPLOYMENT_GUIDE.md).
- Assumption: tên miền production tiếp tục như hiện tại. Quyền quản lý Cloudflare/tunnel và nơi lưu log edge chưa xác minh.

## Bằng chứng và khoảng thiếu

| Bằng chứng | Trạng thái | Giới hạn |
|---|---|---|
| GET sitemap mới ngày 10/10 theo giờ Việt Nam | Verified | 200, application/xml; XML parser đọc urlset đúng namespace, 6 URL duy nhất |
| GET robots mới | Verified | 200, Googlebot được phép, Sitemap trỏ đúng HTTPS |
| Source sitemap.ts và inventory | Verified | Sinh sáu route từ origin cấu hình, không lastmod giả; chưa thấy lý do cần viết lại |
| Header và DNS public | Verified | Có Cloudflare; A và AAAA trả địa chỉ edge; không chứng minh đường origin hay IPv6 hoạt động toàn tuyến |
| GSC lần cuối 09/10 | Verified tại mốc cũ | Nhận gửi sitemap nhưng báo Không thể tìm nạp, loại không xác định, 0 URL phát hiện |
| Google Live Test 09/10 | Verified tại mốc cũ | Tải sitemap thành công, cho phép crawl; không chứng minh bộ xử lý Sitemaps đã đọc |
| Năm yêu cầu index 09/10 | Verified tại mốc cũ | Đã nhận vào hàng đợi; chưa chứng minh đã index |
| GSC hôm nay, nguyên nhân, log fetch thật | Not run | Không kết luận lỗi vẫn còn hôm nay hoặc mặc định là Cloudflare |

DEPLOYMENT_GUIDE mô tả nginx/reverse proxy trên VPS; header mới chứng minh Cloudflare ở phía public. Hai thông tin chưa đủ xác định origin. Trước sửa cấu hình phải xác minh topology và chủ sở hữu thực tế; không mặc định có nginx hoặc đường /var/log/nginx.

## Thứ tự thực thi

### S0 — Làm mới trạng thái GSC và giữ mốc so sánh

Vai trò: người kiểm tra có quyền property.

1. Chọn đúng URL-prefix property HTTPS hiện có; không tạo property/đổi tài khoản sở hữu.
2. Mở hàng /sitemap.xml và chi tiết lỗi. Ghi status, loại, ngày gửi, lần đọc cuối, URL chính xác, số URL phát hiện; ghi N/A khi trống.
3. Nếu có phần lỗi mở rộng, ghi nguyên văn mã/lý do. Kiểm tra báo cáo hình phạt thủ công nếu fetch vẫn lỗi.
4. Lưu ảnh và JSON đã bỏ định danh tài khoản. Không gửi lại hoặc xóa sitemap trong bước này.
5. Nếu đã Success và đọc đúng sáu URL: bỏ nhánh sửa, chuyển S5. Nếu Success nhưng số URL khác: đối chiếu bản đã đọc và thời gian cập nhật.

Đầu ra: snapshot GSC mới; lỗi còn tồn tại được Verified hoặc đã hết được Verified. Không dùng ảnh hôm qua như trạng thái hôm nay.

### S1 — Khoanh vùng public, mạng và dữ liệu XML

Vai trò: HTTP tester; GET giới hạn, không load test.

1. GET chính xác URL đã gửi, ghi status/header, redirect nếu có, content-type, độ dài/hash body, thời gian trả về và lỗi kết nối.
2. Parse XML thật: UTF-8, urlset/namespace chuẩn, sáu loc tuyệt đối đúng HTTPS/host, không trùng, không URL tiện ích/nội bộ/query, không HTML trang challenge hoặc thông báo lỗi.
3. Đối chiếu sáu loc với publicPagePaths, canonical và sitemap trong robots. HEAD chỉ là bổ trợ; GET là bằng chứng tải file.
4. Chạy Google Live URL Inspection cho chính file sitemap; ghi Crawl allowed và Page fetch. Không yêu cầu index file XML.
5. Nếu cần phân biệt lỗi theo mạng: một lượt GET từ máy hiện tại và một lượt từ VPS; IPv4/IPv6 chỉ khi máy kiểm tra có kết nối phù hợp. Lỗi IPv6 phía máy kiểm tra không đủ kết luận origin/DNS sai.
6. Có thể dùng user-agent Googlebot như kiểm tra phân biệt response, nhưng ghi rõ đây là request mô phỏng từ IP máy kiểm tra, không phải Googlebot thật.

Đầu ra: ma trận GSC fetch / public GET / origin GET / XML. Hoàn tất trước khi đề xuất bản sửa.

### S2 — Xác minh tầng gây lỗi khi S0 vẫn thất bại

Vai trò: server debugger và người vận hành edge, chỉ đọc.

1. Xác định đường public → Cloudflare → tunnel/reverse proxy → Next.js bằng cấu hình routing liên quan và process đang chạy; tránh dump env, token, khóa tunnel.
2. Đối chiếu GET origin nội bộ với public; kiểm tra release SHA và thời điểm restart. Đọc log web/proxy/tunnel giới hạn quanh khoảng lỗi, thống nhất UTC với giờ GSC trước khi tương quan.
3. Nếu có quyền Cloudflare, xem sự kiện bảo mật/analytics của đúng hostname và đường /sitemap.xml hoặc /robots.txt: block/challenge/rate limit, lỗi upstream, cache và rule liên quan. Log không giữ đủ thời gian phải ghi thiếu bằng chứng.
4. Xác minh request Google bằng IP/dải công bố hoặc reverse DNS rồi forward DNS theo hướng dẫn chính thức; phân biệt Googlebot với công cụ Inspection. Tên user-agent không đủ.
5. Nếu không có request origin tương ứng, kiểm tra edge/tunnel/DNS; không quy lỗi ứng dụng. Nếu thiếu cả log edge, ghi nguyên nhân chưa xác định và đầu vào còn thiếu.
6. Nếu fetch/parse đều thành công nhưng báo cáo còn lỗi: kiểm tra timestamp lần đọc, hình phạt thủ công và khả năng Google chưa thử lại; đây là giả thuyết, chưa phải kết luận nội dung kém.

Đầu ra bắt buộc: vấn đề tái hiện, tầng chịu trách nhiệm, bằng chứng trước sửa, thay đổi nhỏ nhất đề xuất và cách rollback.

## Nhánh quyết định và phạm vi sửa có điều kiện

| Kết quả | Xử lý dự kiến | Điều kiện |
|---|---|---|
| GSC đã Success, sáu URL | Không sửa; chuyển theo dõi index | Lưu snapshot mới |
| URL gửi sai, 404 hoặc redirect | Dùng URL cuối đúng; sửa tham chiếu nếu sai | Chứng minh URL hiện gửi khác URL tải được |
| Origin lỗi, public lỗi | Sửa đúng route/build/routing hoặc khôi phục process theo nguyên nhân | Có lỗi HTTP/log tái hiện; thao tác production được duyệt |
| Origin XML tốt, edge 403/429/challenge/5xx | Sửa rule/tunnel/upstream cụ thể | Có rule/event/request đối chiếu; không tắt bảo vệ toàn domain |
| 200 nhưng body HTML/XML hỏng | Sửa middleware/rewrite/serialization hoặc cache gây body sai | Có body tái hiện; chỉ sửa tầng tạo lỗi |
| robots chặn sitemap | Sửa đúng rule xung đột | Bằng chứng Google đọc rule chặn; giữ chính sách training |
| GET và Live Test tốt, chưa có fetch mới trong GSC | Giữ sitemap; kiểm tra lại theo mốc, chưa sửa code | Không coi loại Unknown là XML sai |
| Không có quyền/log edge hoặc không tái hiện | Ghi Blocked cho chẩn đoán nguyên nhân, tiếp tục phần độc lập | Nêu dữ liệu/quyền cần từ đúng người vận hành |

Không thêm sitemap index cho sáu trang, đổi URL để né báo cáo, gắn lastmod theo thời gian hiện tại, xóa AAAA không có bằng chứng hoặc tạo nội dung riêng cho bot. Không tăng quyền/public port, tắt xác thực/TLS hay bỏ cơ chế chống abuse để chữa sitemap.

### S3 — Chuẩn bị và triển khai bản sửa nhỏ nhất nếu có căn cứ

- Vùng code cho phép đề xuất: apps/web/app/sitemap.ts, apps/web/app/robots.ts, apps/web/lib/public-page-inventory.ts, apps/web/lib/site.ts và test SEO; chỉ chọn file thực sự gây lỗi.
- next.config.mjs, Dockerfile/workflow/compose hoặc rule edge chỉ đưa vào phạm vi sau khi xác định lỗi và giải thích ảnh hưởng.
- Cấm mở rộng sang component UI, auth/payment/credit/API/DB hoặc thay chiến lược SEO/content trong task này.
- Giữ mọi diff/tài liệu/ảnh chưa commit hiện có; không reset/clean. Chuẩn bị diff có thể review trước khi xin phép thay đổi production.
- Nếu đổi code: build, restart server local sở hữu, chạy 26 test SEO và kiểm tra bổ sung nhắm đúng lỗi mới; không viết test chỉ sao chép helper.
- Reviewer kiểm tra XML, discovery, robots, canonical, mức độ hẹp của rule và khả năng rollback. Đồng bộ tài liệu Anh–Việt.
- Rollback: hoàn tác đúng patch hoặc rule cụ thể; release trước nếu cần. Không rollback DB. Giữ bằng chứng trước/sau; không hứa Google cập nhật ngay.
- Phân biệt phê duyệt implement, commit và deploy; yêu cầu lập kế hoạch này chưa thực thi các bước đó.

### S4 — Xác minh public và gửi lại có kiểm soát

1. Sau bản sửa được phép deploy, xác minh SHA mới, process restart, GET XML/public và log; chạy lại bộ 26 test trên tên miền thật.
2. Google Live Test phải fetch thành công và cho phép crawl; sáu URL giữ canonical và index policy đúng.
3. Gửi lại sitemap một lần khi đã khắc phục nguyên nhân hoặc có căn cứ cần một lượt fetch mới. Giữ URL sitemap hiện tại; không xóa bản cũ để làm mất bằng chứng.
4. Lưu xác nhận nhận yêu cầu riêng với status processing; kiểm tra lại sau 24 giờ, tiếp theo 48–72 giờ nếu chưa có lần đọc mới. Đây là lịch thao tác đề xuất, không phải SLA của Google.
5. Không gửi lại năm yêu cầu index đã nhận chỉ để tăng ưu tiên. Không dùng Indexing API cho trang app thông thường.
6. Nếu lỗi lặp sau sửa, quay lại S2 với timestamp/rule/release mới; không gửi lặp thay cho chẩn đoán.

### S5 — Nghiệm thu và theo dõi hiệu quả

| Lớp | Điều kiện đạt |
|---|---|
| App/public | XML hợp lệ, sáu URL HTTPS đúng, robots nhất quán; HTTP/browser/log liên quan đạt |
| Google tải/xử lý sitemap | GSC Success, nhận diện sitemap và số URL đã đọc phù hợp sáu URL; nếu số chưa cập nhật ghi pending |
| Index từng trang | Ghi trạng thái của sáu URL riêng, lý do chưa index và lần crawl/canonical có dữ liệu |
| Traffic/GEO | Đo riêng theo runbook; chưa có dữ liệu thì Not run, không suy từ sitemap |

Mốc D+7/14/28 giữ ngày release 09/10/2026: 16/10, 23/10, 06/11. Nếu sửa sitemap release mới, ghi thêm ngày khắc phục để phân biệt giai đoạn. Không tạo job theo dõi trong lượt kế hoạch.

## Tài liệu bàn giao và thời lượng

- Evidence mới: artifacts/reports/seo-geo/2026-10-10/ khi thực thi; gồm snapshot GSC, HTTP/XML, log đã lọc, ma trận chẩn đoán, diff/rule nếu có và kết quả nghiệm thu.
- Thời lượng thao tác dự kiến: S0 15–20 phút; S1 20–30 phút; S2 30–60 phút khi có đủ quyền/log. S3 phụ thuộc nguyên nhân; chưa ước lượng implement trước chẩn đoán. Chờ GSC tách khỏi thời gian thao tác.
- Điểm dừng review: cuối S2, bản đề xuất phải trả lời “lỗi ở đâu, bằng chứng nào, sửa gì, ảnh hưởng gì, hoàn tác thế nào”.
- Deferred: đổi domain, redesign, nội dung mới, paid audit, thay nền tảng hosting hoặc mở rộng policy bot.

## Nguồn đối chiếu

- [Google Sitemaps report / fetch troubleshooting](https://support.google.com/webmasters/answer/7451001): gửi, tải, xử lý và index là các kết quả khác nhau; Google có thể thử lại fetch thất bại vài ngày.
- [Verify Google requests](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests): xác minh bot/fetcher bằng phương pháp chính thức.
