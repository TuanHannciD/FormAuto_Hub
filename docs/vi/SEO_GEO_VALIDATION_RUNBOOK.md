# SEO_GEO_VALIDATION_RUNBOOK

## Phạm vi và trạng thái

- Ngày: 09/10/2026. Tài liệu đi kèm: [SEO_GEO_IMPLEMENTATION_PLAN.md](SEO_GEO_IMPLEMENTATION_PLAN.md).
- Đây là checklist thực thi kèm mốc quan sát và phạm vi kiểm thử local. Không phải báo cáo hiệu quả sau phát hành.
- Verified: truy cập URL-prefix property có quyền, sáu kiểm tra URL đã lưu, danh sách sitemap đã gửi trống và tổng Hiệu suất Web 28 ngày trên UI. Live test, báo cáo Page indexing chi tiết, xuất Performance và so sánh kỳ trước là Not run.
- Dùng Verified, Not run, Blocked cho bằng chứng; không thay giá trị quan sát bằng giả định.
- Không lưu cookie, tài khoản/mật khẩu, định danh chủ property, token hoặc URL riêng tư không liên quan trong bằng chứng commit.

## P0: Mốc ban đầu Search Console

1. Chọn property hiện có bao phủ `https://formautohub.servertun.pp.ua/`; ghi loại property và tên miền public, không ghi chi tiết tài khoản. Không tạo property hoặc đổi chủ sở hữu.
2. Dùng URL Inspection kiểm tra sáu URL trong kế hoạch. Tách trạng thái chỉ mục đã lưu khỏi Live Test. Live Test thành công không chứng minh Google đã index.
3. Ghi lần crawl cuối, trạng thái fetch, quyền crawl/index, canonical khai báo và Google chọn, nguồn phát hiện/sitemap và lý do loại chính xác nếu có. Giá trị không có để Unknown.
4. Xem Page indexing và Sitemaps; ghi URL đã gửi, trạng thái xử lý, số URL phát hiện và lỗi. Gửi sitemap thành công không phải số trang đã index.
5. Xuất Performance cho 28 ngày hoàn chỉnh gần nhất và 28 ngày trước đó, thống nhất bộ lọc Web search/quốc gia/thiết bị. Gồm impression, click, CTR, vị trí trung bình theo query/page; thiếu dữ liệu hoặc lượng thấp ghi chưa có.
6. Phân loại lý do loại theo bằng chứng: phát hiện, fetch/render, noindex, canonical/trùng lặp, đã crawl chưa index hoặc lý do khác hiển thị. Có lý do không có nghĩa được phép viết lại nội dung công khai.

### Mốc từng URL đã quan sát — 09/10/2026

| URL path | Chỉ mục đã lưu? | Crawl cuối theo UI | Live fetch | Quyền crawl/index | Canonical khai báo / Google chọn | Lý do chính xác | Bước tiếp | Ngày/trạng thái bằng chứng |
|---|---|---|---|---|---|---|---|---|
| `/` | Có | 29/08/2026 05:45:35 | Not run | Có / Có | Trang chủ / URL đang kiểm tra | Đã index | Kiểm tra lại sau phát hành | 09/10/2026 Verified |
| `/google-forms/sample-data` | Không | Không áp dụng | Not run | Không áp dụng | Không áp dụng | Google chưa biết URL | Gửi sitemap/kiểm tra sau phát hành | 09/10/2026 Verified |
| `/google-forms/student-report` | Không | Không áp dụng | Not run | Không áp dụng | Không áp dụng | Google chưa biết URL | Gửi sitemap/kiểm tra sau phát hành | 09/10/2026 Verified |
| `/google-forms/survey-demo` | Không | Không áp dụng | Not run | Không áp dụng | Không áp dụng | Google chưa biết URL | Gửi sitemap/kiểm tra sau phát hành | 09/10/2026 Verified |
| `/google-forms/sheets-report` | Không | Không áp dụng | Not run | Không áp dụng | Không áp dụng | Google chưa biết URL | Gửi sitemap/kiểm tra sau phát hành | 09/10/2026 Verified |
| `/anti-abuse` | Không | Không áp dụng | Not run | Không áp dụng | Không áp dụng | Google chưa biết URL | Gửi sitemap/kiểm tra sau phát hành | 09/10/2026 Verified |

Thời gian crawl giữ theo UI; chưa xác minh múi giờ nên không gắn nhãn UTC. Cả sáu chưa có sitemap giới thiệu; bảng sitemap đã gửi có 0 hàng. Hiệu suất trên UI chọn 28 ngày hiển thị 09/09–06/10/2026: 0 nhấp/hiển thị và không có hàng truy vấn. Đây là kỳ hiển thị trên UI, không phải so sánh file xuất kỳ hiện tại/kỳ trước. Google chưa biết URL không phải kết luận nội dung kém. Trường đầy đủ đã lọc thông tin tài khoản nằm trong JSON baseline được liên kết.

Nếu chưa truy cập tài khoản được, ghi Blocked cho GSC và nhờ chủ property cung cấp đúng dữ liệu sáu URL/Performance cần thiết. Tiếp tục triển khai kỹ thuật độc lập; không tuyên bố biết lý do Google loại.

## P1/P2: Kiểm tra triển khai có ý nghĩa

- Ghi Git status và UI desktop/mobile đã chấp nhận trước sửa. Bảo toàn công việc ngoài phạm vi.
- Trang công khai: một canonical có hiệu lực, đúng tên miền cấu hình, không noindex hoặc X-Robots-Tag xung đột, giữ title/description/H1 và nội dung hiển thị.
- Trang tiện ích/nội bộ: noindex có trong HTML ban đầu thật, gồm route lồng đại diện. Không mặc định metadata cha luôn thắng mọi metadata con. Request chưa đăng nhập không lộ dữ liệu riêng; hành vi phiên/quyền không đổi.
- Sitemap: XML hợp lệ, sáu URL canonical được duyệt không trùng, không URL nội bộ/tiện ích; bỏ lastmod chưa biết và ngày có căn cứ giữ ổn định khi build lại không sửa nội dung.
- llms.txt: response text/plain thật, đúng tên miền/URL công khai dùng chung, không xung đột file static/route và không nội dung riêng tư. Kiểm tra tên miền local khác và output cấu hình production.
- JSON-LD: đọc script đã render, kiểm tra tham chiếu nhận diện ổn định, serialization an toàn và dữ kiện khớp nội dung hiển thị. Không bịa review/đơn vị vận hành/giá. Chỉ kiểm tra tính năng được hỗ trợ; không phát hiện FAQ rich result không phải lỗi.
- Khả năng đọc khi tắt JS: kiểm tra opacity/visibility tích lũy của H1 và thân bài, không chỉ chữ có trong HTML. Nếu sửa animation, kiểm tra hành vi khi bật JS và chế độ giảm chuyển động.
- Thêm kiểm tra runtime tập trung vào các bất biến hành vi trên; tránh test sao chép helper hoặc khóa toàn bộ JSON snapshot.

## P3: Điều kiện kiểm tra runtime local

Tại `apps/web`, chạy `npm.cmd run build`. Ghi kết quả thật; build của triển khai đã phê duyệt đạt, được ghi trong kế hoạch và JSON validation.

Sau build, khởi động lại process Next production-preview do mình sở hữu ở port trống bằng `npm.cmd run start -- -p <owned-port>`. Playwright config hiện chạy dev trên 3000; dùng config riêng hoặc harness rõ ràng cho production-preview, không nhầm dev smoke với production smoke.

Gửi HTTP thật kiểm tra:

- Sáu route công khai, robots.txt, sitemap.xml, llms.txt.
- `/login`, `/register`, `/auth/callback`, payment return/cancel, dashboard/admin và route lồng đại diện; không request thanh toán/gửi form/ghi dữ liệu rủi ro.
- Một đường dẫn không tồn tại trả 404 thật.
- Canonical và robots trong HTML ban đầu cùng response header.

Browser: sáu trang công khai hydrate, tải JS/CSS chunk cần thiết, không page/console error mới, chữ chính đọc được khi tắt JS. So sánh trước/sau desktop 1440 và mobile 390, kiểm tra tràn ngang 320px; không hồi quy UI/CTA/nav. Thử điều hướng/đăng nhập hiện có mà không gửi form hoặc đổi số dư.

Đọc output server sau smoke. Nếu sửa ScrollReveal toàn cục, kiểm tra nơi dùng hiện có đại diện ngoài trang SEO. Chỉ dừng process do lượt kiểm tra sở hữu.

Lưu bản ghi đã lọc thông tin nhạy cảm và ảnh nếu cần tại `artifacts/reports/seo-geo/<date>/`; không tạo ảnh trước giả hoặc ghi đè báo cáo HTML cũ. Ảnh tái dựng phải ghi rõ.

## P4: Phát hành public và kiểm tra Google

Deploy/commit/push là hành động riêng; tài liệu chuẩn bị không thực thi chúng. Theo DEPLOYMENT_GUIDE hiện có, ghi định danh release và xác minh process bị ảnh hưởng được restart.

Sau deploy được phép:

1. Lặp lại HTTP/header/canonical/JSON-LD/browser/chunk trên tên miền thật, đọc log release liên quan.
2. Xác nhận sitemap GSC hiện có đúng; gửi/gửi lại chỉ khi cần. Chạy Live Test cho URL công khai đã sửa.
3. Yêu cầu index URL công khai đã sửa nếu phù hợp và có chức năng; không dùng Google Indexing API cho trang app thông thường hoặc gửi lặp để tăng hạng.
4. Ghi việc hệ thống nhận yêu cầu riêng với trạng thái đã index quan sát sau đó.
5. Chỉ đọc log crawler giới hạn, không sửa server. Tên user-agent không chứng minh bot thật; xác minh theo phương thức/dải IP nhà cung cấp công bố trước khi quy kết.

## P5: Theo dõi từ khóa và AI

Truy vấn Google ban đầu (đã quan sát trước đó, chưa thấy App trang đầu trừ tra tên miền):

| Truy vấn | Đối tượng / mục đích |
|---|---|
| `FormAuto Hub` và biến thể có ngoặc kép chính xác | Làm rõ thương hiệu |
| `tạo dữ liệu mẫu Google Forms` | Dữ liệu mẫu/kiểm thử |
| `kiểm thử Google Forms` | Kiểm thử kỹ thuật; quan sát thấy bị hiểu lẫn tạo bài kiểm tra |
| `điền Google Form tự động` | Nhóm sản phẩm; so sánh cạnh tranh |
| `dữ liệu mẫu Google Forms cho sinh viên` | Demo cho sinh viên |
| `khảo sát nghiên cứu khoa học sinh viên` | So sánh nhóm người dùng rộng |
| `công cụ quản lý khảo sát Google Forms nghiên cứu khoa học` | Quy trình nghiên cứu |

Theo dõi riêng các nhu cầu sát hơn được đề xuất: `tạo dữ liệu mẫu Google Forms để kiểm thử`, `dữ liệu demo Google Forms cho sinh viên`, `kiểm tra Google Forms trước khi phát hành khảo sát`. Chưa có lượng tìm kiếm hoặc mốc thứ hạng đo được cho chúng.

Tại ngày deploy public D và D+7/14/28, giữ thống nhất ngôn ngữ/quốc gia/thiết bị, cá nhân hóa và câu truy vấn. Ghi URL kết quả, vị trí chỉ khi thực sự đếm, AI overview và nguồn dẫn. Không thấy trang đầu không có nghĩa vị trí 11 hoặc chưa index.

Kiểm tra AI Google và, khi truy cập được, ChatGPT có tìm web và Perplexity bằng câu hỏi như:

- Công cụ nào giúp tạo dữ liệu mẫu Google Forms để kiểm thử trước khi gửi khảo sát?
- Sinh viên có thể kiểm tra dữ liệu demo Google Forms và Google Sheets bằng công cụ nào?
- FormAuto Hub là gì và có yêu cầu xem trước trước khi gửi phản hồi không?
- Công cụ nào hỗ trợ quản lý mô hình, biến và ánh xạ câu hỏi cho khảo sát nghiên cứu?

Thực hiện 3–5 lần độc lập cho mỗi câu hỏi/nền tảng/ngày nếu có quyền truy cập. Ghi nền tảng/chế độ search, thời gian, cỡ mẫu, URL nguồn và mô tả thương hiệu. Tách được truy xuất, được trích dẫn, được nhắc tên và được đề xuất. Một câu trả lời AI là một mẫu, không phải tỷ lệ cả nền tảng. Không tự truy vấn tài khoản production riêng hoặc mua công cụ.

## Nghiệm thu và so sánh hiệu quả

| Lớp | Tiêu chí / so sánh | Căn cứ bằng chứng |
|---|---|---|
| Kỹ thuật | Qua mọi điều kiện route/metadata/khả năng đọc/UI liên quan | HTTP/browser/log local và public |
| Chỉ mục Google | Biết trạng thái sáu URL kiểm tra; giải thích rõ phần bị loại còn lại | URL Inspection đã lưu và Page indexing |
| Traffic tìm kiếm | So sánh impression/click/CTR/vị trí theo cùng query/page/bộ lọc/kỳ | GSC Performance; không dự báo tăng trưởng |
| Thương hiệu | Quan sát còn sửa tên hoặc mô tả nhầm không | Mẫu search/AI theo ngày |
| Phát hiện bởi AI | Phân biệt được phép truy cập với fetch thật xác minh được | robots/HTTP so với log đã xác minh |
| Trích dẫn AI | Số lần được dẫn / số lần hợp lệ, URL nguồn và cách mô tả | Mẫu nền tảng có n và ngày |

Không hứa index 6/6, top, tăng traffic hoặc ngưỡng trích dẫn. Hoàn thành kỹ thuật có thể xảy ra trước hoặc không dẫn tới cải thiện search/AI. Nếu lỗi nội dung mỏng/ý định tìm kiếm còn tồn tại sau sửa kỹ thuật, đề xuất nội dung hiển thị riêng.

Closeout phải ghi tóm tắt, file sửa, phạm vi, kiểm tra đã/chưa chạy, rủi ro/Deferred và bước tiếp. Ghi thật phần bên ngoài chưa biết; build thành công không hoàn tất điều kiện runtime public hoặc hiệu quả tìm kiếm.

## Chạy lại bộ kiểm thử SEO local đã phê duyệt

Phạm vi tự động thực tế: 6 kiểm tra HTTP/trình duyệt/metadata/schema công khai + 6 kiểm tra khả năng đọc không JS + 12 kiểm tra noindex trong HTML ban đầu chưa đăng nhập + 1 kiểm tra sitemap/llms nhất quán + 1 kiểm tra robots/404 = 26. So sánh ảnh là bằng chứng riêng. Bộ kiểm thử bắt page error và response HTTP lỗi của static chunk; không kiểm tra mọi console message hoặc xác nhận độc lập mọi sự kiện hydrate. Luồng tài khoản/admin/thanh toán có đăng nhập, kiểm tra giảm chuyển động, công cụ rich-result bên ngoài và traffic crawler AI thật là Not run; chỉ xem source không phải bằng chứng runtime cho các hành vi này.

Review trước commit chạy lại build origin production không đổi trên server sở hữu vừa khởi động: 26/26 đạt (11,4 giây), output server không có lỗi mới. Log: [pre-commit-tests.txt](../../artifacts/reports/seo-geo/2026-10-09/pre-commit-tests.txt). Lượt review chỉ sửa doc này không build lại hoặc sửa code production; kiểm tra lại build đã xác minh hiện có.

Từ `apps/web`, build với origin public dự kiến (ghi đè biến của process, không sửa .env), rồi mở server production do mình sở hữu:

```powershell
$env:NEXT_PUBLIC_SITE_URL='https://formautohub.servertun.pp.ua'
npm.cmd run build
node node_modules/next/dist/bin/next start -p 3034
```

Trong terminal thứ hai tại `apps/web`:

```powershell
$env:SEO_TEST_BASE_URL='http://localhost:3034'
$env:SEO_EXPECTED_ORIGIN='https://formautohub.servertun.pp.ua'
npx.cmd playwright test --config playwright.seo.config.ts
```

Origin kỳ vọng phải khớp cấu hình lúc build; URL server kiểm thử có thể khác. Kiểm tra chủ sở hữu cổng trước khi bật/tắt và khởi động lại sau build. Ngày 09/10/2026, lần chạy đầu gặp process cũ trước sửa và origin kỳ vọng sai; lần đó thất bại, không dùng làm bằng chứng đạt. Sau khi thay đúng process sở hữu, 26/26 đạt với build origin local và 26/26 đạt với build origin public. Chưa deploy public. D+7/14/28 tính từ phát hành public đã xác minh, không tính từ ngày build local.

Mốc đã bỏ thông tin tài khoản: [gsc-baseline.json](../../artifacts/reports/seo-geo/2026-10-09/gsc-baseline.json). Bằng chứng UI: [visual-comparison.json](../../artifacts/reports/seo-geo/2026-10-09/visual-comparison.json), ảnh trước/sau cùng thư mục. Báo cáo HTML độc lập hiện có là lịch sử, không phải phép đo sau phát hành. Cấu hình Playwright dev mặc định loại bộ production riêng này để tránh lẫn origin hoặc kiểm thử nhầm server dev cũ.

## Nguồn chính thức

- [URL Inspection](https://support.google.com/webmasters/answer/9012289).
- [Giới hạn toán tử tìm kiếm Google](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site).
- [Hướng dẫn sitemap Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Yêu cầu crawl lại](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
- [Tính năng AI Google](https://developers.google.com/search/docs/appearance/ai-features).
- [Vai trò crawler OpenAI](https://developers.openai.com/api/docs/bots).
