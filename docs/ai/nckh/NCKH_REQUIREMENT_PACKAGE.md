# NCKH_REQUIREMENT_PACKAGE

## Purpose

Chuẩn hóa yêu cầu cho NCKH Survey Platform — module mới trong FormAuto Hub ecosystem.

## Restated Request

Xây dựng nền tảng giúp nhà nghiên cứu khoa học (NCKH) chuyển đổi quy trình khảo sát thủ công thành quy trình có cấu trúc:

```
Google Form → Mô hình NCKH → Biến nghiên cứu → Map câu hỏi → Thu dữ liệu → Chuẩn hóa → Export SPSS/Excel
```

## Actors

| Actor | Vai trò | Tương tác |
|---|---|---|
| Researcher | Tạo model, biến, quan hệ; thu thập & export dữ liệu | Primary user, authenticated |
| Survey Respondent | Điền Google Form | External, không tương tác với app |
| Admin | Quản lý user, xem thống kê (tái sử dụng Auth module hiện có) | Existing role |

## Business Context

Nhà nghiên cứu hiện tại làm thủ công: tạo Google Form → thu responses → copy-paste vào Excel → map cột → tính toán → import SPSS. App này tự động hóa pipeline đó, giữ lại Google Form làm kênh thu thập, và tập trung vào:

- **Mapping:** Câu hỏi Google Form nào thuộc biến nghiên cứu nào?
- **Normalization:** Chuẩn hóa dữ liệu thô thành dataset có cấu trúc theo biến
- **Export:** Xuất ra định dạng SPSS-ready

## Confirmed Rules

- Mỗi ResearchModel gắn với 1 GoogleForm (MVP: 1:1)
- Mỗi Variable thuộc 1 ResearchModel, có: name, code, type (Independent/Dependent/Mediator/Moderator/Control), scaleType (Likert/Nominal/Ordinal/Scale), scalePoint, minValue, maxValue
- ObservedQuestionMapping nối formQuestionId → variableId với observedCode (VD: TH1, TH2)
- ModelRelation có: fromVariableId, toVariableId, hypothesisCode (tự sinh: H1, H2...), direction (Positive/Negative)
- Hypothesis text tự sinh từ biến: "{fromVar} ảnh hưởng {directionText} đến {toVar}"
- App có thể tạo mới Google Form từ biến hoặc cập nhật form có sẵn
- Data normalization: map câu trả lời → mã biến, tính mean cho biến Likert (trung bình cộng đơn giản)
- Missing data: đánh dấu null, researcher tự xử lý
- Export tối thiểu: dataset.csv + codebook.xlsx; nâng cao: .sps SPSS syntax
- Canvas lưu tọa độ node để restore layout
- Pull data manual — không real-time, không scheduled cho MVP
- Sửa biến khi đã có data: cho phép + cảnh báo
- NCKH MVP không tính credit (credit model Deferred)

## Acceptance Criteria

1. Researcher có thể đăng nhập và liên kết Google Account (OAuth)
2. Researcher nhập link Google Form → app đọc và hiển thị danh sách câu hỏi
3. Researcher tạo ResearchModel với tên, mô tả, gắn form
4. Researcher thêm Variable + map câu hỏi form vào biến
5. Researcher vẽ quan hệ biến trên canvas và lưu ModelRelation + Hypothesis
6. Researcher có thể tạo mới hoặc cập nhật Google Form từ model
7. App đọc responses từ Google Forms/Sheets API (manual pull)
8. App chuẩn hóa dữ liệu theo mapping, tính mean Likert
9. Researcher export dataset.csv + codebook.xlsx
10. Researcher export .sps SPSS syntax (nâng cao)

## Out of Scope

- Chạy phân tích thống kê (Cronbach Alpha, EFA, hồi quy, T-test, ANOVA) trong app
- Real-time data sync (Google Cloud Pub/Sub)
- Scheduled auto-pull data
- Multi-researcher collaboration
- Admin user management UI cho NCKH
- Spam, captcha bypass, proxy rotation, fake accounts, unauthorized form submission

## Assumptions

- Researcher là owner của Google Form, không phải form của bên thứ 3
- Canvas UI dùng React Flow để vẽ quan hệ biến
- Likert mặc định 5-point, hỗ trợ mở rộng 7-point
- Công thức mean: (item1 + item2 + ... + itemN) / N — trung bình cộng
- NCKH module tách biệt khỏi FormAutomation module, không kế thừa FormProjects/FormQuestions hiện có
- NCKH module dùng chung Auth, Users, và UserExternalLogins với FormAuto Hub

## Approved (Phase 1)

- Google OAuth link for the NCKH Forms read scope (implemented with repo evidence)
- Official Google Forms API read/import for form structure (implemented with repo evidence)
- Persist imported `ResearchForm` and `ResearchFormQuestion` records (implemented with repo evidence)
- NCKH dashboard/callback shell for Google link and form import/list flow (implemented with repo evidence)

Validation note: Phase 1 implementation evidence exists in code, migration, frontend routes, and tests. Current runtime/live Google OAuth and Forms API validation was not re-run during the documentation sync task that reconciled this package.

## Deferred

- Google Sheets API (đọc raw data — cần cho Phase 5)
- Google Forms API create/update (Phase 4)
- Google Forms watches / Cloud Pub/Sub (real-time notification)
- Cronbach Alpha, EFA, hồi quy, T-test, ANOVA trong app
- Real-time data sync
- Multi-researcher collaboration
- Credit/pricing model cho NCKH
- Scheduled auto-pull data
- Background job framework

## Anti-Abuse Boundaries

NCKH module có rủi ro abuse thấp hơn FormAuto Hub vì chủ yếu là đọc dữ liệu. Tuy nhiên:

- OAuth scope kiểm soát quyền đọc/ghi Google Forms — app chỉ truy cập form user đã cấp quyền
- Không tự động submit Google Form
- Phân quyền model theo user — researcher chỉ thấy model của mình

## Validation Expected

- Build: dotnet build + npm build
- Unit/integration tests: per phase
- Migration validation: dotnet ef database update
- API smoke: HTTP requests với JWT auth
- Browser smoke: full flow qua frontend với Google Form thật
- Auth/role smoke: researcher role + admin role
- Google OAuth smoke: link/unlink Google Account
