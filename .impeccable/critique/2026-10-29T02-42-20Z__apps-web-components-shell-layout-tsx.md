---
target: UI vẫn to và cồng kềnh — structural density review
total_score: 23
max_score: 36
na_heuristics: 3
p0_count: 0
p1_count: 1
timestamp: 2026-10-29T02-42-20Z
slug: apps-web-components-shell-layout-tsx
---
Latest scope correction: follow-up is homepage only; broad proposals below are historical assessment and are not approved for implementation.

Method: dual-agent (A: /root/density_design_a · B: /root/density_evidence_b)

UI vẫn cồng kềnh do cách phân bổ diện tích và nhiều tầng trình bày. Vòng trước đã giải quyết overflow/reachability, nhưng tiêu chí đó chưa đủ chứng minh sự tinh gọn người dùng mong muốn. Mở lại visual acceptance; không sửa source trong lượt đánh giá này.

AssessmentA độc lập:23/36 theo9 heuristic quan sát được, control/freedom n/a. B detector một lần exit0,0findings trên7source targets; không phát hiện cơ học không chứng nhận density tốt. A hoàn tất trước root đọc detector B. Nguồn live sidebar244px,header60px,h128px,metrics171px ở1280; body14/control40 đã phù hợp. Populated views dùng ảnh User/Admin thật trong manifest của bản bàn giao. Live hiện là error state do API stopped, không gán dữ liệu lịch sử thành fresh successful smoke.

Ưu tiên:

1. P1: dashboard4metrics vẫn2hàng laptop,4hàng mobile; gộp thành4cột desktop/2×2mobile với metric thấp72–80px, icon32 và value20–22.
2. P2: shell244 +gutter48 và greeting/breadcrumb/h1 lặp; đề xuất sidebar220–228,header52–56,gutter24–28,h124. Cần kiểm tên nav tiếng Việt trước chốt.
3. P2: top-up card gói khoảng150px và lựa chọn lặp card/select/summary. Dùng option row/tile thấp90–104px và summary rõ một lần; giữ chi phí/confirmation/CTA.
4. P2: forms stepper5ô +preview chưa có +summary nhiều dòng và card lồng; một vùng tác vụ chính, trạng thái tương lai gọn, đầy đủ preview/confirm khi đến bước. Mobile record cần phân cấp dữ liệu trước khi thay disclosure.
5. P2: auth input54/CTA56 là scale riêng; đề xuất44–48,heading28–30,giảm khối mở đầu mobile.

Giữ palette navy/tím, body14px, font phụ12–13 không thu tiếp, mobile hit-area≥44. Không global zoom. Mục tiêu vòng sau: giảm20–30% diện tích chrome/summary tại3mẫu đại diện, giữ thông tin đọc được; đây là proposal, chưa phải kết quả đã đo sau sửa.

Giữ: CTA rõ, trạng thái có text, thứ tự preview/confirmation/cost. Rủi ro persona: người vận hành phải cuộn qua chrome; người mới thấy quá nhiều bước chưa cần; người dùng mobile/zoom sẽ thiệt nếu chỉ giảm chữ/control.

Đề xuất làm3mẫu shell/dashboard,top-up,forms để người dùng chốt tỷ lệ trước khi lan ra toàn bộ page. Các alternative: chỉ giảm token nhanh nhưng còn hộp lặp; sửa cấu trúc3mẫu (recommended); redesign toàn bộ identity không cần thiết cho mục tiêu này.

Files changed: artifacts đánh giá và paired progress; không product code. Verified: ảnh/source/computed geometry và detector. Not run: interaction regression/build/auth/200%zoom/WCAG toàn diện. Blocked: API restoration do DB có migration thiếu source; startup tự migrate nên runtime giữ DB nguyên trạng. Không overlay injection/live-server thêm do runtime ownership; không claim overlay. Snapshot images có provenance trong manifest và reviewerreports.

Next: chọn hướng density và scope3mẫu; nếu được chấp nhận, implementer sửa rồi fresh independent review trên actual desktop/mobile trước mở rộng. Chưa commit/push/deploy.
