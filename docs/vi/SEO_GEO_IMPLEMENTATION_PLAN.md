# SEO_GEO_IMPLEMENTATION_PLAN

## Trạng thái và thẩm quyền

- Ngày: 09/10/2026.
- Người dùng đồng ý ba ưu tiên, sau đó phê duyệt triển khai, rồi đồng bộ tài liệu hai ngôn ngữ và commit local có chọn lọc. Yêu cầu commit không cho phép push/deploy.
- Trạng thái: người dùng đã phê duyệt triển khai tiếp. Mốc GSC P0, code P1/P2 và kiểm tra local P3 là Verified; phát hành public P4 và đo hiệu quả P5 là Not run.
- Đây là follow-up sau closeout có phạm vi riêng, không mở global phase mới. Các closeout Phase 9 vẫn là căn cứ lịch sử.
- Giữ UI đã chấp nhận, URL, đích CTA và luồng nghiệp vụ. Bản sửa dropdown và báo cáo hiện có thuộc công việc riêng, phải bảo toàn.
- Hướng dẫn thực thi/ghi bằng chứng: [SEO_GEO_VALIDATION_RUNBOOK.md](SEO_GEO_VALIDATION_RUNBOOK.md).

## Vấn đề và mốc bằng chứng

Các quan sát dưới đây thực hiện trước đó trong cuộc trao đổi ngày 09/10/2026; là ảnh chụp trạng thái, không phải giám sát liên tục.

| Bằng chứng | Trạng thái | Ý nghĩa / giới hạn |
|---|---|---|
| Google `site:formautohub.servertun.pp.ua`, gồm lần tắt cá nhân hóa | Verified | Có trang chủ; ít nhất trang chủ được index và trả về |
| Google `site:formautohub.servertun.pp.ua/google-forms/` | Verified | Không có kết quả trong mẫu; không chứng minh mọi trang con chưa index |
| Sáu truy vấn nhu cầu trên trang đầu Google | Verified | Chưa thấy App; không phải vị trí đo được hoặc ước tính lượng tìm kiếm |
| Tìm thương hiệu không có dấu ngoặc kép | Verified | Google sửa thành Form Auto Hub; phần AI hiển thị nói về sản phẩm khác |
| Sáu trang công khai, sitemap và llms.txt | Verified | HTTP 200; robots index/follow; canonical tự trỏ; HTML có văn bản nội dung |
| robots.txt | Verified | Lần đầu timeout, thử lại 200; bot tìm kiếm được phép, chính sách huấn luyện tách riêng |
| Request mang tên Googlebot, OAI-SearchBot, PerplexityBot | Verified | 200 từ IP máy kiểm tra; không phải bằng chứng bot thật |
| Độ mờ tích lũy H1 sample-data khi tắt JS | Verified trong audit trước | 0 dù HTML có chữ; lỗi khả năng đọc công khai, chưa chứng minh là nguyên nhân không index |
| Truy cập property Search Console | Verified | Đã xem URL-prefix property hiện có bằng tài khoản có quyền; không đổi chủ sở hữu |
| Canonical Google chọn, lý do loại, lần crawl từng URL | Verified ở trường có dữ liệu | Đã ghi sáu lần kiểm tra đã lưu; năm URL chưa biết không có dữ liệu crawl/canonical |
| Hiệu suất Web chọn 28 ngày | Verified tổng trên UI | 0 hiển thị/nhấp, hiển thị 09/09–06/10/2026; không có hàng truy vấn; xuất file và so sánh kỳ trước là Not run |
| Tỷ lệ trích dẫn ChatGPT/Perplexity và hiệu quả Google sau phát hành | Not run | Chưa đo sau phát hành/trích dẫn |

Source trước sửa: metadata gốc cho phép index rộng; sitemap dùng `new Date()` cho mọi URL; llms.txt ghi cứng tên miền; trang chủ và template SEO định nghĩa SoftwareApplication riêng với Offer giá 0 chưa giải thích phạm vi. Bản triển khai bên dưới xử lý các vấn đề này; đây không phải án phạt xếp hạng đã được chứng minh.

## Ranh giới phạm vi

Bao gồm: metadata phía server, chính sách index theo route, nhất quán canonical/tên miền, dữ liệu có cấu trúc đúng sự thật, file phát hiện trang, sửa khả năng đọc công khai khi tắt JS nếu tái hiện, thu thập bằng chứng và kiểm tra.

Không đổi backend/API/DTO/database/phiên đăng nhập/thanh toán/luồng credit. Giữ kiểm soát quyền, preview và xác nhận, tối đa 100 phản hồi mỗi thao tác, gửi tuần tự theo lô 10; không spam, vượt CAPTCHA, xoay proxy, tài khoản giả hoặc gửi trái phép.

Deferred: thiết kế lại, thêm menu/footer, trang marketing NCKH mới, blog, section/nội dung hiển thị mới, đổi đích CTA, tạo trang hàng loạt, backlink/liên hệ bên ngoài, công cụ trả phí, đổi tên miền, AI mở rộng. Kiểm tra và giữ liên kết liên quan hiện có; cấm link/nội dung ẩn chỉ dành cho bot.

Assumption: `https://formautohub.servertun.pp.ua` tiếp tục là tên miền production; người dùng chưa yêu cầu chuyển tên miền. Tên miền local phụ thuộc cấu hình, không được đưa lên production làm canonical.

## Cấu trúc trang và từ khóa

Đợt đầu không cần đổi URL hoặc tạo phân cấp công khai mới.

| Route | Vai trò / nhu cầu chính | Chính sách index |
|---|---|---|
| `/` | Nhận diện chính thức FormAuto Hub và tổng quan sản phẩm | index, follow |
| `/google-forms/sample-data` | Dữ liệu phản hồi mẫu để kiểm thử được phép | index, follow |
| `/google-forms/student-report` | Demo/dữ liệu mẫu cho sinh viên, không giả dữ liệu nghiên cứu | index, follow |
| `/google-forms/survey-demo` | Minh họa quy trình khảo sát, ghi rõ dữ liệu demo | index, follow |
| `/google-forms/sheets-report` | Kiểm tra đầu ra Forms trong Sheets; không thêm Sheets API chưa duyệt | index, follow |
| `/anti-abuse` | Sử dụng hợp lệ và an toàn sản phẩm | index, follow |
| Login/register, auth callback, payment return/cancel | Trang tiện ích | noindex, follow; loại khỏi sitemap |
| `/dashboard/**`, `/admin/**` | Thao tác có đăng nhập | noindex, follow; loại khỏi sitemap; giữ kiểm soát đăng nhập |
| Đường dẫn không tồn tại | Trang thiếu | HTTP 404 thật; không trả marketing 200 thay thế |

Nhu cầu ứng viên, chưa đo lượng tìm kiếm hàng tháng: dữ liệu mẫu Google Forms để kiểm thử, dữ liệu demo Google Forms cho sinh viên, kiểm tra Google Forms trước khi phát hành khảo sát. Các từ khóa nghiên cứu rộng dùng để so sánh/theo dõi, không phải mục tiêu nội dung đầu tiên.

## Cấu trúc đã triển khai và file giữ nguyên

```text
apps/web/lib/site.ts                  tên miền theo môi trường hiện có
apps/web/lib/seo-pages.ts             nội dung/metadata từng trang hiện có
apps/web/lib/seo.ts                   helper thương hiệu/JSON-LD/noindex dùng chung
apps/web/lib/public-page-inventory.ts danh sách sáu route phát hiện trang
apps/web/app/layout.tsx               giữ metadata gốc; không thêm token xác minh
apps/web/app/page.tsx                 chỉ metadata và JSON-LD trang chủ
apps/web/components/seo-keyword-page.tsx template hiện có; chỉ JSON-LD/khả năng đọc
apps/web/app/sitemap.ts               danh sách -> sitemap công khai
apps/web/app/robots.ts                giữ chính sách tìm kiếm/huấn luyện
apps/web/app/llms.txt/route.ts         route văn bản theo môi trường, sinh lúc build
apps/web/public/llms.txt              đã xóa sau khi xác minh route thay thế
apps/web/app/*/layout.tsx             noindex: auth/login/register/payment/dashboard/admin
apps/web/tests/seo.spec.ts            26 kiểm thử HTTP/trình duyệt tập trung
apps/web/playwright.seo.config.ts     cấu hình kiểm thử production-preview rõ ràng
apps/web/playwright.config.ts         loại bộ SEO riêng khỏi bộ dev mặc định
```

Ưu tiên helper dùng chung nhỏ, không thêm framework/dependency SEO. Dùng lại cấu hình nội dung hiện có; không tạo kho nội dung trùng lặp. Danh sách phát hiện trang chỉ chứa route/thông tin phát hiện và ngày sửa xác thực nếu có.

### Thương hiệu và dữ liệu có cấu trúc

- Dùng đúng một tên: FormAuto Hub. Dùng `@id` tuyệt đối ổn định cho WebSite và SoftwareApplication; WebPage tham chiếu cùng website/application ở trang phù hợp.
- Mô tả phải khớp chức năng và an toàn đang hiển thị. Không thêm tuyên bố thống kê/SPSS/SmartPLS, pháp nhân, địa chỉ, giải thưởng, review, mạng xã hội hoặc URL `sameAs` tự bịa.
- Thêm nhận diện WebSite tối thiểu tại trang chủ. Organization chỉ dùng khi xác minh được thông tin đơn vị vận hành; không tạo cho đủ checklist.
- Đối chiếu Offer giá 0 với dùng thử 5 credit và các gói trả phí đang hiển thị. Ưu tiên đợt đầu: bỏ Offer mơ hồ ở nơi không mô tả chính xác phạm vi; mục tiêu là schema đúng nghĩa, không hứa kết quả tìm kiếm nâng cao cho ứng dụng.
- FAQ hiện có có thể giữ làm dữ liệu ngữ nghĩa khi khớp câu hỏi hiển thị; không hứa Google FAQ rich results hoặc mở rộng FAQ trong đợt này.
- Escape ký tự `<` khi xuất JSON-LD; xuất phía server, không phụ thuộc hydrate mới chèn dữ liệu.

### Phát hiện trang và kiểm soát chỉ mục

- Giữ index/follow và canonical tự trỏ ở trang công khai; đặt noindex rõ cho nhánh tiện ích/nội bộ bằng metadata server, không dùng effect phía client.
- Cho crawler đọc trang noindex để đọc chỉ thị; robots không thay kiểm soát đăng nhập/bảo mật.
- Sitemap chỉ có sáu URL công khai đã duyệt, không có tiện ích/nội bộ/query. Thay lastmod lúc build/request bằng ngày sửa nội dung đáng kể có căn cứ; nếu chưa biết thì bỏ lastmod, không đoán.
- llms.txt dùng cùng tên miền/danh sách với sitemap; là hỗ trợ phát hiện tùy chọn, không bảo đảm ranking/index. Không lộ trạng thái app riêng tư.
- Tách bot tìm kiếm được phép với bot huấn luyện bị chặn; không mở rộng chính sách crawler khi chưa có nhu cầu và nguồn xác minh.
- Người dùng đã xác minh GSC: không mặc định thêm thẻ xác minh. Chỉ dùng token thật do property cấp nếu chứng minh cần duy trì xác minh; không chèn token mẫu.
- Nếu tái hiện nội dung vô hình khi tắt JS, làm nội dung công khai hiện có đọc được, giữ bố cục/style khi hydrate và animation nếu khả thi, giới hạn sửa ở template công khai. Nếu cần đổi ScrollReveal/CSS dùng chung, phải kiểm tra mọi nơi dùng và hồi quy.

## Các lượt triển khai theo thứ tự

| Lượt | Vai trò phụ trách | Đầu ra | Phụ thuộc / điều kiện |
|---|---|---|---|
| P0 Bằng chứng | Analyst SEO + chủ property | Mốc GSC sáu URL và trạng thái public hiện tại | Đúng property/quyền; không bịa lý do loại |
| P1 Kỹ thuật | Worker frontend | Tên miền, danh sách, noindex, sitemap/llms và sửa khả năng đọc | Làm được khi chưa có GSC; chỉ chẩn đoán nguyên nhân GSC sau P0 |
| P2 Nhận diện | Worker frontend + reviewer | Metadata nhất quán và JSON-LD dùng chung đúng sự thật | Căn cứ nội dung đang hiển thị; không đổi thiết kế |
| P3 Kiểm tra local | Tester/reviewer | Build, restart, HTTP/browser smoke thật và so sánh UI | Đã làm P1/P2; cần bằng chứng |
| P4 Kiểm tra phát hành | Người vận hành + chủ property | Smoke release public đã duyệt, kiểm tra GSC/gửi sitemap | Deploy là hành động riêng, không thực hiện trong lượt kế hoạch |
| P5 Theo dõi hiệu quả | Analyst SEO | So sánh index, từ khóa và trích dẫn D+7/14/28 | D là ngày deploy public đã xác minh; không bảo đảm hạn |

P1/P2 đã được triển khai sau khi người dùng phê duyệt; xem kết quả theo ngày bên dưới. Tách kết quả code với hiệu quả chỉ mục public. Ghi Blocked cho kiểm tra ngoài hệ thống chưa truy cập được, tiếp tục phần local độc lập.

## Handoff dùng để bắt đầu worker

Đọc README, routing matrix, kế hoạch này, runbook, FRONTEND_STYLE_GUIDE, TESTING_STRATEGY và source liên quan. Kiểm tra Git status, bảo toàn diff searchable-dropdown và artifacts hiện có.

Chỉ triển khai P1/P2 trong vùng web SEO đề xuất, thêm metadata server tối thiểu cho trang tiện ích/nội bộ. Không viết lại nội dung/JSX layout, CTA/nav, nghiệp vụ, package hoặc cấu hình deploy. Ghi file thực tế sửa và lý do lệch kế hoạch; file đề xuất chưa tồn tại không cho phép tái cấu trúc app.

Dừng và báo nếu cần nội dung công khai mới, route mới ngoài file phát hiện/wrapper server, dữ kiện schema chưa xác minh, đổi contract auth, ghi đè file bẩn ngoài phạm vi hoặc chuyển tên miền. Nếu cần đổi animation/CSS toàn cục, trình bày ảnh hưởng nơi dùng trước khi mở rộng.

## Tiêu chí hoàn thành và hiệu quả dự kiến

Nghiệm thu kỹ thuật: trang công khai đọc được/cho phép index, trang tiện ích/nội bộ noindex, đúng canonical host, sitemap có căn cứ, file phát hiện nhất quán, JSON-LD đọc được/đúng sự thật, giữ UI đã chấp nhận, không có lỗi runtime mới.

Hiệu quả dự kiến: phát hiện trang nhất quán hơn và nhận diện thương hiệu/sản phẩm rõ hơn. Google quyết định crawl/index/rank; AI quyết định trích dẫn. Không hứa top, tăng traffic, hạn index hoặc AI giới thiệu.

Review riêng: triển khai local đã xác minh; release public đã xác minh; chỉ mục Google từng URL đã xác minh; trích dẫn AI đã đo. Không gộp bốn phần thành một nhãn Completed.

Rollback: chỉ hoàn tác metadata/helper/route thuộc đợt này và phát hành lại theo quy trình hiện có sau khi được phép. Không rollback database. Search có thể cập nhật chậm hơn rollback; giữ bằng chứng theo ngày.

## Nguồn đối chiếu ngày 09/10/2026

- [Giới hạn toán tử site của Google](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site).
- [Hướng dẫn sitemap Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Các tính năng AI Google](https://developers.google.com/search/docs/appearance/ai-features).
- [Vai trò crawler OpenAI](https://developers.openai.com/api/docs/bots).

Skill hướng dẫn cách làm; tài liệu chính thức và bằng chứng source/runtime quyết định kết luận. Vai trò liên quan: formauto-delivery-planner, formauto-controlled-doc-editor, seo-audit, ai-seo, site-architecture và schema.

## Kết quả triển khai — 09/10/2026

- Verified: metadata server `noindex, follow` cho login/register/auth/payment/dashboard/admin. Không sửa phân quyền/nghiệp vụ; noindex không phải kiểm soát truy cập.
- Verified: sitemap và llms.txt sinh dạng text/plain dùng chung origin hiện có và danh sách sáu URL công khai. Bỏ lastmod giả theo thời điểm build; bỏ ngày chưa biết chính xác. Không sửa file môi trường hoặc tên miền.
- Verified: ID WebSite/SoftwareApplication chung và tham chiếu từ trang công khai; bỏ Offer giá 0 dễ hiểu nhầm; giữ dữ kiện sản phẩm hiện có; xuất JSON-LD an toàn. Không khẳng định đủ điều kiện kết quả nâng cao phần mềm khi thiếu trường bắt buộc.
- Verified: tái hiện opacity tích lũy H1 trang mẫu bằng 0 khi tắt JavaScript; noscript giới hạn trong template SEO đưa về 1. Sáu trang công khai qua kiểm tra nội dung không JS; hydrate thật cũng đạt.
- Verified: build production, lint/kiểu và màu (100 file source). Khởi động lại server production sở hữu ở cổng 3034, 26 kiểm thử HTTP/trình duyệt đạt với origin local, rồi 26 kiểm thử đạt khi build dùng origin production; không có lỗi server mới sau smoke.
- Verified: sáu ảnh ổn định trang chủ/mẫu ở 1440/390/320px. Văn bản, liên kết và tọa độ H1 khớp cả sáu; năm PNG giống từng byte. Trang chủ320 lệch 14.087 pixel, y=130..254, tối đa 2/255 mỗi kênh màu; xem ảnh không thấy đổi bố cục/nội dung. Chỉ lúc chụp mới tắt chuyển động và đưa scroll-reveal về trạng thái hiển thị; kiểm thử riêng chạy hydrate thật.

URL Inspection đã lưu của GSC, trên URL-prefix property đúng do người dùng chọn: trang chủ đã index; cả năm URL công khai còn lại Google chưa biết và chưa index. Lần crawl trang chủ hiển thị 29/08/2026 05:45:35, Googlebot điện thoại, tìm nạp thành công, cho phép crawl/index và canonical khớp. Cả sáu chưa có sitemap giới thiệu; năm URL chưa biết chưa có lần crawl/canonical. Bảng sitemap đã gửi có 0 hàng.

Hiệu suất Web chọn 28 ngày, hiển thị 09/09–06/10/2026: 0 lượt nhấp, 0 lượt hiển thị, không có hàng truy vấn. Vị trí hiển thị 0 nghĩa là chưa có phép đo, không phải thứ hạng. Quan sát trước phát hành chưa đo được hiệu quả bản sửa local. Bằng chứng đã bỏ thông tin tài khoản và ảnh: `artifacts/reports/seo-geo/2026-10-09/`; kiểm thử/cấu hình: `apps/web/tests/seo.spec.ts`, `apps/web/playwright.seo.config.ts`.

Review: giữ phạm vi P1/P2; không sửa nội dung hiển thị/CTA/điều hướng, backend/API/database hoặc chính sách crawler. Giữ diff dropdown riêng và báo cáo HTML độc lập hiện có.

Not run: push/deploy, smoke public sau phát hành, GSC live test/yêu cầu crawl/gửi sitemap, báo cáo Page indexing chi tiết, xuất Performance/so sánh 28 ngày trước, luồng riêng tư có đăng nhập, kiểm tra trình duyệt với giảm chuyển động, xác minh log/trích dẫn AI và kết quả D+7/14/28. P0 gồm kiểm tra URL đã lưu, danh sách sitemap đã gửi và tổng Performance trên UI; chưa hoàn thành mọi bước điều tra/xuất dữ liệu trong runbook. Bước tiếp: phê duyệt deploy riêng, kiểm tra output public, gửi sitemap đã xác minh và kiểm tra/yêu cầu năm trang công khai. Google index và AI trích dẫn là kết quả bên ngoài, không được bảo đảm chỉ vì kỹ thuật local đạt.

Review tài liệu/commit: đồng bộ trạng thái GSC hiện tại, danh sách triển khai, phạm vi kiểm tra thực tế và các bước còn lại ở hai ngôn ngữ. Người dùng cho phép commit local chọn lọc code SEO, kiểm thử, tài liệu song ngữ và bằng chứng theo ngày đã lọc thông tin tài khoản. Diff UI dropdown và báo cáo HTML độc lập trước đó là việc riêng, giữ nguyên. JSON validation ghi mốc trước commit; xem định danh commit của phiên bản này trong lịch sử Git.
