# NCKH_MODULE_MAP

## Mục đích

Định nghĩa quyền sở hữu module cho NCKH Survey Platform.

## Quyền sở hữu module

| Module | Sở hữu | Không được sở hữu |
|---|---|---|
| Auth | đăng nhập, JWT, liên kết Google OAuth (mở rộng Auth FormAuto Hub) | logic nghiệp vụ NCKH |
| Users | thông tin định danh người dùng | quy tắc sở hữu model NCKH |
| ResearchForms | import Google Form, metadata form, lưu câu hỏi | tạo/sửa form qua Google API |
| ResearchFormQuestions | metadata câu hỏi từ Google Forms API | sinh câu trả lời, chuẩn hóa |
| ResearchModels | CRUD model NCKH, vòng đời (Draft → Active → Archived) | gọi Google Forms API |
| ResearchVariables | CRUD biến, định nghĩa loại/thang đo | logic ánh xạ |
| ObservedQuestionMappings | ánh xạ câu hỏi → biến, mã quan sát | quy tắc vòng đời biến |
| ModelRelations | CRUD quan hệ, tự sinh giả thuyết | hiển thị canvas (frontend) |
| NodePositions | lưu tọa độ node canvas | logic quan hệ |
| SurveyResponses | dữ liệu phản hồi thô từ Google Sheets/Forms API | chuẩn hóa |
| DataCollection | kéo dữ liệu thủ công, chống trùng, nhật ký | tạo form, export |
| DataNormalization | map dữ liệu thô → mã chuẩn, tính trung bình Likert | phân tích thống kê |
| Export | sinh CSV, Excel codebook, SPSS syntax | vẽ biểu đồ, báo cáo phân tích |
| Integrations.Google.Forms | Google Forms API: đọc cấu trúc, tạo/sửa form | logic tài khoản/credit, chuẩn hóa |
| Integrations.Google.Sheets | Google Sheets API: đọc dữ liệu phản hồi | cấu trúc form, chuẩn hóa |
| Integrations.Google.Auth | Google OAuth: trao đổi token, làm mới, lưu mã hóa | quy trình nghiệp vụ |

## Quy tắc liên module

- Tích hợp Google Forms không được trộn vào dịch vụ model/biến/export.
- Chuẩn hóa dữ liệu phải thông qua DataNormalization.
- Thu thập dữ liệu phải ghi DataCollectionLogs.
- Nội dung giả thuyết phải tự sinh từ tên biến + hướng (không gọi AI).
- Xóa biến phải cascade xóa ObservedQuestionMappings và NodePositions.
- Lưu trữ model không xóa dữ liệu (responses/datasets được giữ lại).
- Token OAuth phải được mã hóa khi lưu.
- Rate limit Google API phải xử lý bằng exponential backoff retry.

## Ranh giới NCKH vs FormAuto Hub

| Khía cạnh | FormAuto Hub | NCKH Module |
|---|---|---|
| Sử dụng Google Forms | HTML scraping (không API chính thức) | Google Forms API chính thức |
| Mục đích | Tự động điền & gửi form | Phương pháp khảo sát & chuẩn bị phân tích |
| Entity | FormProjects, AnswerRules, GeneratedResponses | ResearchModels, ResearchVariables, ObservedQuestionMappings |
| Đầu ra | Gửi responses | Dataset CSV/Excel/SPSS |
| Credit | Có (trừ credit mỗi lần preview) | Không (credit Deferred) |
| Google OAuth | Deferred | Bắt buộc (Phase 1) |

NCKH module dùng chung: Auth, Users, UserExternalLogins từ FormAuto Hub.
NCKH module không dùng chung: FormProjects, FormQuestions, AnswerRules, GeneratedResponses, SubmissionJobs.
