# NCKH_REQUIREMENT_PACKAGE

## Mục đích

Chuẩn hóa yêu cầu cho NCKH Survey Platform — module mới trong hệ sinh thái FormAuto Hub.

## Yêu cầu đã chuẩn hóa

Xây dựng nền tảng giúp nhà nghiên cứu khoa học (NCKH) chuyển đổi quy trình khảo sát thủ công thành quy trình có cấu trúc:

```
Google Form → Mô hình NCKH → Biến nghiên cứu → Map câu hỏi → Thu dữ liệu → Chuẩn hóa → Export SPSS/Excel
```

## Tác nhân (Actors)

| Tác nhân | Vai trò | Tương tác |
|---|---|---|
| Nhà nghiên cứu (Researcher) | Tạo model, biến, quan hệ; thu thập & export dữ liệu | Người dùng chính, đã đăng nhập |
| Người khảo sát (Respondent) | Điền Google Form | Bên ngoài, không tương tác với app |
| Quản trị viên (Admin) | Quản lý người dùng, xem thống kê | Tái sử dụng vai trò hiện có |

## Bối cảnh nghiệp vụ

Nhà nghiên cứu hiện tại làm thủ công: tạo Google Form → thu responses → copy-paste vào Excel → map cột → tính toán → import SPSS. App này tự động hóa pipeline đó, giữ lại Google Form làm kênh thu thập, và tập trung vào:

- **Mapping:** Câu hỏi Google Form nào thuộc biến nghiên cứu nào?
- **Chuẩn hóa:** Chuyển dữ liệu thô thành dataset có cấu trúc theo biến
- **Export:** Xuất ra định dạng SPSS-ready

## Quy tắc đã xác nhận

- Mỗi ResearchModel gắn với 1 GoogleForm (MVP: 1:1)
- Mỗi Variable thuộc 1 ResearchModel, có: tên, mã, loại (Độc lập/Phụ thuộc/Trung gian/Điều tiết/Kiểm soát), thang đo (Likert/Định danh/Thứ bậc/Liên tục), điểm thang đo, giá trị nhỏ nhất, giá trị lớn nhất
- ObservedQuestionMapping nối formQuestionId → variableId với mã quan sát (VD: TH1, TH2)
- ModelRelation có: biến gốc, biến đích, mã giả thuyết (tự sinh: H1, H2...), hướng (Tích cực/Tiêu cực)
- Nội dung giả thuyết tự sinh từ biến: "{biến gốc} có ảnh hưởng {hướng} đến {biến đích}"
- App có thể tạo mới Google Form từ biến hoặc cập nhật form có sẵn
- Chuẩn hóa dữ liệu: map câu trả lời → mã biến, tính trung bình cho biến Likert (trung bình cộng đơn giản)
- Dữ liệu thiếu: đánh dấu null, nhà nghiên cứu tự xử lý
- Export tối thiểu: dataset.csv + codebook.xlsx; nâng cao: .sps SPSS syntax
- Canvas lưu tọa độ node để khôi phục bố cục
- Kéo dữ liệu thủ công — không real-time, không lập lịch cho MVP
- Sửa biến khi đã có dữ liệu: cho phép + cảnh báo
- NCKH MVP không tính credit (mô hình credit Deferred)

## Tiêu chí chấp nhận

1. Nhà nghiên cứu đăng nhập và liên kết Google Account (OAuth)
2. Nhập link Google Form → app đọc và hiển thị danh sách câu hỏi
3. Tạo ResearchModel với tên, mô tả, gắn form
4. Thêm Variable + map câu hỏi form vào biến
5. Vẽ quan hệ biến trên canvas và lưu ModelRelation + Hypothesis
6. Tạo mới hoặc cập nhật Google Form từ model
7. App đọc responses từ Google Forms/Sheets API (kéo thủ công)
8. App chuẩn hóa dữ liệu theo mapping, tính trung bình Likert
9. Export dataset.csv + codebook.xlsx
10. Export .sps SPSS syntax (nâng cao)

## Ngoài phạm vi

- Chạy phân tích thống kê (Cronbach Alpha, EFA, hồi quy, T-test, ANOVA) trong app
- Đồng bộ dữ liệu real-time (Google Cloud Pub/Sub)
- Tự động kéo dữ liệu theo lịch
- Cộng tác nhiều nhà nghiên cứu
- Giao diện quản lý người dùng cho NCKH
- Spam, vượt captcha, xoay proxy, tài khoản giả, gửi form trái phép

## Giả định (Assumption)

- Nhà nghiên cứu là chủ sở hữu Google Form, không phải form của bên thứ ba
- Canvas UI dùng React Flow để vẽ quan hệ biến
- Likert mặc định 5 điểm, hỗ trợ mở rộng 7 điểm
- Công thức trung bình: (mục1 + mục2 + ... + mụcN) / N — trung bình cộng
- NCKH module tách biệt khỏi FormAutomation module, không kế thừa FormProjects/FormQuestions hiện có
- NCKH module dùng chung Auth, Users, và UserExternalLogins với FormAuto Hub

## Đã duyệt / đã implement với evidence repo (Phase 1)

- Google OAuth link cho Forms read scope của NCKH
- Official Google Forms API đọc/import cấu trúc form
- Lưu `ResearchForm` và `ResearchFormQuestion` đã import
- Dashboard/callback shell NCKH cho luồng liên kết Google và import/list form

Validation note: Phase 1 có evidence implementation trong code, migration, frontend routes, và tests. Task sync tài liệu này chưa chạy lại runtime/live Google OAuth và Forms API validation hiện tại.

## Tạm hoãn (Deferred)

- Google Forms API tạo/cập nhật form (Phase 4)
- Google Sheets API (đọc dữ liệu thô)
- Google Forms watches / Cloud Pub/Sub (thông báo real-time)
- Cronbach Alpha, EFA, hồi quy, T-test, ANOVA trong app
- Đồng bộ dữ liệu real-time
- Cộng tác nhiều nhà nghiên cứu
- Mô hình credit/giá cho NCKH
- Tự động kéo dữ liệu theo lịch
- Background job framework

## Ranh giới chống lạm dụng

NCKH module có rủi ro lạm dụng thấp hơn FormAuto Hub vì chủ yếu là đọc dữ liệu:

- OAuth scope kiểm soát quyền đọc/ghi Google Forms — app chỉ truy cập form đã được cấp quyền
- Không tự động gửi Google Form
- Phân quyền model theo người dùng — nhà nghiên cứu chỉ thấy model của mình

## Xác thực dự kiến

- Build: dotnet build + npm build
- Unit/integration test: theo từng phase
- Xác thực migration: dotnet ef database update
- API smoke: HTTP requests với JWT auth
- Browser smoke: full flow qua frontend với Google Form thật
- Auth/role smoke: vai trò researcher + admin
- Google OAuth smoke: liên kết/hủy liên kết Google Account
