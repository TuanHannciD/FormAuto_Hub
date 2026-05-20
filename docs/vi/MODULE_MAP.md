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
| Integrations.AI | AI mapping/suggestion boundary đang Deferred | MVP answer generation khi chưa duyệt |

## Quy tắc cross-module

- Credit deduction phải đi qua `CreditManagement`.
- Mọi credit change phải tạo `CreditTransactions`.
- Mọi tool action phải tạo `UsageLogs`.
- Mọi submission attempt phải tạo `SubmissionLogs`.
- Form submission phải có preview và user confirmation.
- Google Forms integration không được nằm trong account/credit modules.
- Deferred integration module chỉ là planning boundary, không phải production-complete claim.

## MVP answer modes

Các answer-generation modes được hỗ trợ trong MVP:

- random equally
- random by percentage
- random by quantity
- sample text lines cho text answers
- khoảng ngày tuần tự cho câu hỏi ngày
- khoảng giờ tuần tự cho câu hỏi giờ
