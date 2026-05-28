# MODULE_MAP

## Mục đích

Định nghĩa module ownership chính thức cho FormAuto Hub.

## Bản đồ module

| Module | Sở hữu | Không sở hữu |
|---|---|---|
| Auth | đăng nhập, kiểm tra mật khẩu, boundary phân quyền | JWT claim structure cuối khi chưa duyệt |
| Users | thông tin user và profile cơ bản | credit accounting |
| UserCreditAccounts | balance hiện tại và tổng cộng | ledger history như nguồn chính |
| CreditManagement | trừ credit, cộng credit, invariant balance | Google Forms calls |
| Packages | credit package read model, follow-up admin tạo/cập nhật/bật tắt package đã duyệt | payment gateway behavior |
| TopupOrders | top-up order do user tạo | quyết định approve của admin |
| AdminTopupOrders | admin approve/reject workflow | package management UI khi chưa duyệt |
| CreditTransactions | ledger bất biến của credit | mutable balance state như source of truth |
| UsageLogs | audit trail cho tool action | lưu payload submission như source chính |
| Dashboard | summary cards, recent top-up orders, recent tool usage, dữ liệu navigation account | business workflow |
| Profile | đọc/sửa profile và đổi mật khẩu | admin user management |
| FormProjects | metadata của form đã analyze | thực thi submission |
| FormQuestions | metadata câu hỏi detect được | answer generation rules |
| AnswerRules | rule sinh câu trả lời | submission job execution |
| ResponseGeneration | sinh preview response và MVP answer modes | auto-submit không có confirmation |
| GeneratedResponses | lưu preview payload | credit ledger behavior |
| Submissions | controlled send workflow, submission jobs, submission logs | captcha bypass, proxy rotation, unauthorized submission |
| SubmissionLogs | kết quả từng response submission | refund policy khi chưa duyệt |
| AuditLogs | audit admin/security-sensitive | thay thế usage log thông thường |
| Integrations.GoogleForms | boundary analyze/submit Google Forms | account/credit logic |
| Integrations.Payment | payment provider boundary đang Deferred | MVP manual approval |
| Integrations.AI | boundary AI provider Phase 6, provider calls, provider response parsing | credit deduction, submission execution |
| AiProviderSettings | cấu hình AI provider cho admin | prompt behavior của normal user |
| AiPromptProfiles | cấu hình AI prompt cấp project | lưu generated preview |
| AiQuestionPrompts | cấu hình AI prompt theo từng câu hỏi | ownership metadata form đã detect |
| AiGenerationRuns | raw provider audit và AI generation run state | source of truth của credit ledger |
| AiGenerationRunItems | evidence validation output AI và mapping tới generated response | workflow sửa generated response |

## Quy tắc cross-module

- Credit deduction phải đi qua `CreditManagement`.
- Mọi credit change phải tạo `CreditTransactions`.
- Mọi tool action phải tạo `UsageLogs`.
- Mọi submission attempt phải tạo `SubmissionLogs`.
- Form submission phải có preview và user confirmation.
- Google Forms integration không được nằm trong account/credit modules.
- Deferred integration module chỉ là planning boundary, không phải production-complete claim.
- AI provider/model selection phải lấy từ admin settings phía server, không lấy từ input frontend của normal user.
- AI-generated previews vẫn phải được lưu dạng `GeneratedResponses` và read-only sau khi tạo.
- Credit deduction cho AI generation phải đi qua `CreditManagement` và ghi `CreditTransactions`.
- Raw AI provider payloads thuộc AI audit entities và không được expose cho normal users.

## MVP answer modes

Các answer-generation modes được hỗ trợ trong MVP:

- random equally
- random by percentage
- random by quantity
- sample text lines cho text answers
- khoảng ngày tuần tự cho câu hỏi ngày
- khoảng giờ tuần tự cho câu hỏi giờ
