# FAH-HOME-001 — Hiệu năng cuộn và thu gọn homepage

## Phạm vi và phê duyệt

- 2026-11-02: người dùng báo homepage https://formautohub.servertun.pp.ua/ giật khi cuộn trên PC/mobile, duyệt đề xuất sửa render và tinh gọn hai lần bằng “Approved”.
- Base: `e380abf08c031fe2e4e7d305f9933370fe830398`; tracked workspace ban đầu sạch, nhánh `main`. Đã tích hợp triển khai local vào `main` bằng commit `019493a8c3238e5ab25daaca995921a3051a8989`. Giữ tài nguyên ignored có sẵn.
- Phạm vi duyệt: homepage, CSS global giới hạn riêng homepage, test/config hồi quy và bằng chứng song ngữ. Không đổi API, DB, thanh toán, auth, hành vi gửi, release hoặc remote.
- Root giữ quyền ghi, build, runtime/browser. Reviewer độc lập chỉ đọc: `homepage_review`, `gpt-6.1-sol`, reasoning `medium`, đã kiểm live catalog. Reviewer không dispatch con. Không dùng Astra.

## Đã triển khai

- Giữ Server Component, metadata, JSON-LD, giá và route/anchor hiện có.
- Override `.landing-page` riêng homepage: một gradient cuộn bình thường, không sinh pseudo-element phủ toàn trang. Consumer aura khác giữ CSS hiện có.
- Bỏ blur tại section lớn, giữ blur header sticky. Giảm biên độ float desktop, tắt float mobile; kiểm tra reduced-motion đạt.
- Gộp phần lợi ích/kiểm soát riêng vào nội dung dịch vụ/CTA hiện có. Đưa cách hoạt động lên trước dịch vụ/bảng giá. Giảm minh họa, tiêu đề, khoảng cách và chiều cao tối thiểu card; gọn dòng quy đổi credit. Giữ đủ năm FAQ.
- File: `apps/web/app/page.tsx`, `apps/web/app/globals.css`, `apps/web/playwright.homepage.config.ts`, `apps/web/tests/homepage-compact.spec.ts`, hồ sơ task song ngữ và bằng chứng `artifacts/reports/homepage-compact/`.

## Kiểm chứng — 2026-11-02

Lệnh chạy từ `apps/web` trừ khi ghi rõ khác.

- Verified: regression baseline thất bại đúng yêu cầu chiều cao: desktop 1280px cao 5.466px; mobile 390px cao 8.670px; mobile 320px cao 9.177px. Lượt mobile đầu còn sai locator nhắm span sr-only; đã sửa sang summary native và xác nhận 390px chỉ thất bại ở chiều cao (`red-confirm/`).
- Verified: `npm run build` exit 0, homepage static 166 B, First Load JS 106 kB. `npm run lint` exit 0. Còn warning ref cleanup có sẵn ở account-profile/security, dữ liệu Browserslist cũ và deprecation Next lint; ngoài phạm vi.
- Verified: production server local mới do root sở hữu: `node node_modules/next/dist/bin/next start -p 3035`, exec session `32794`; trước đó không có web listener trên 3035. Wrapper npm ban đầu nuốt `-p` rồi thoát, chưa tạo server; Next CLI trực tiếp chạy được.
- Verified: `npx playwright test -c playwright.homepage.config.ts --output=../../artifacts/reports/homepage-compact/green-final`: 3/3. Bao phủ 1280/390/320, CTA nằm trong viewport/target 44px, giá/section còn đủ, tương tác FAQ, menu mobile, không tràn ngang, không lỗi trang/chunk, guard repaint và animation mobile/reduced-motion.
- Failed do cấu hình lượt SEO đầu: suite kỳ vọng canonical production nhưng build local dùng cấu hình ignored sẵn có `http://localhost:3020`: 8 fail, 18 pass (`seo/`). Không sửa source SEO để chiều test.
- Verified sau khi đặt đúng origin local: `$env:SEO_TEST_BASE_URL='http://localhost:3035'; $env:SEO_EXPECTED_ORIGIN='http://localhost:3020'; npx playwright test -c playwright.seo.config.ts --output=../../artifacts/reports/homepage-compact/seo-local-origin`: 26/26, gồm metadata, JSON-LD, nội dung không JS, hydration/chunk, discovery và HTML noindex utility/private. Đây là kiểm chứng cấu hình local, chưa phải SEO release production.
- Verified: đã xem screenshot T3 browser hero và phần dưới desktop/mobile; nội dung đọc được, giữ giá và điều hướng. `node .agents/skills/impeccable/scripts/detect.mjs --json apps/web/app/page.tsx apps/web/app/globals.css` từ root: `[]`, exit 0. `git diff --check`: không lỗi sau sửa dòng trống EOF.
- Verified: review code tĩnh độc lập không có lỗi production cần chặn. Đã thêm và chạy đạt các guard render/animation được reviewer đề nghị. Review này không phải review visual/runtime độc lập.

## Số đo hành vi

T3 Chromium, cuộn rAF chuẩn hóa toàn trang trong 3 giây sau khi font sẵn sàng, không throttle CPU. Viewport mobile giả lập không phải điện thoại thật.

- Desktop 1280×800: 5.466 → 3.367px, ngắn hơn 38,4%. Baseline khoảng khung trung bình 86,7ms/p95 150ms; local trung bình 16,8ms/p95 16,8ms, không khung nào vượt 34ms ở lượt cuối.
- Mobile viewport 390×844: 8.670 → 6.014px, ngắn hơn 30,6%. Baseline trung bình 31,4ms/p95 50ms; local trung bình 16,7ms/p95 16,7ms, không khung nào vượt 34ms.
- Đối chứng nguyên nhân trên cùng layout desktop đã gọn: tạm bật lại nền fixed nhiều gradient/lớp phủ cũ và blur section khiến khoảng khung tăng thành trung bình 81,1ms/p95 166,7ms; bỏ override trở lại trung bình 16,8ms/p95 16,8ms. Đã gỡ override sau đo. Cách này kiểm soát ảnh hưởng của quãng cuộn ngắn hơn.
- Số đo gốc: `artifacts/reports/homepage-compact/scroll-measurements.json`. Probe chỉ thay đổi tab kiểm tra, không deploy. Cách nói “60 FPS khi tắt hai nhóm nền” ở điều tra trước chưa đủ: biến thể đó còn tắt blur section/header.

## Giới hạn, tài nguyên và bước tiếp theo

- Not run: thiết bị PC/mobile thật, Safari/Firefox, GPU yếu/throttle, Core Web Vitals thực tế và toàn bộ suite authenticated/API; thay đổi chỉ thuộc trình bày public.
- Verified: commit triển khai local. Not run: push, deploy hoặc smoke sau deploy; người dùng tự push/deploy. Production chưa đổi. Không cam kết 60 FPS trên mọi máy hoặc đã sẵn sàng release.
- Copy homepage chung về preview cho Option 1 có từ trước diff; không đổi hành vi nghiệp vụ. Audit copy/contract rộng hơn là Deferred.
- Verified cleanup: đã dừng server sở hữu ban đầu PID 39728 và server build cuối PID 38728 sau kiểm danh tính; không còn listener 3035 hoặc process server tương ứng. Không khởi động API/DB. Giữ tab browser người dùng đang điều khiển cùng tài nguyên unrelated/ignored.
- Tiếp theo: người dùng tự push/deploy khi sẵn sàng, build bằng môi trường production, rồi kiểm chứng chunk/SEO public cùng cuộn trên PC/mobile thật.

## Đóng task local

- Trạng thái: **Đã đóng local — triển khai, review và tích hợp; release do người dùng thực hiện.** Người dùng yêu cầu đóng sạch hoàn toàn và merge local, tự giữ quyền push/deploy.
- Vì thay đổi đã nằm trên `main`, tích hợp bằng commit local đúng phạm vi, không tạo merge nhánh giả. Không pull/push/deploy hoặc dọn nhánh/worktree ngoài task.
- Closeout mới: lint exit 0; build exit 0; sau khởi động lại build mới, homepage 3/3 và SEO 26/26 đạt (`postbuild-homepage/`, `postbuild-seo/`). Giữ nguyên các warning có sẵn và giới hạn thiết bị thật/cross-browser/field test nêu trên.
- Commit code/test/bằng chứng: `019493a8c3238e5ab25daaca995921a3051a8989`; tài liệu đóng task song ngữ commit riêng. Không đổi sản phẩm sau các test đó.
- Track `validation.json`, số đo và probe chẩn đoán đã chọn lọc. Thư mục raw Playwright còn được giữ local và ignore bằng `.gitignore` riêng task; không xóa bằng chứng lỗi. Không phát hiện credential trong bằng chứng văn bản đã quét.
- Kiểm tra Git working tree sạch sau commit tài liệu và báo kết quả trong hội thoại. Đóng phạm vi local, không khẳng định đã release production.
