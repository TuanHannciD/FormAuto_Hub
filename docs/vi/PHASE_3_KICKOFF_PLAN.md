# PHASE_3_KICKOFF_PLAN

## Mục đích

Định nghĩa plan thực thi Phase 3 Form automation MVP trước khi bắt đầu production implementation.

File này là planning baseline cho Phase 3 sau Phase 2 closeout.

## Mục tiêu Phase 3

Xây nền backend/API cho MVP tự động hóa Google Form có kiểm soát:

1. Analyze Google Form URL.
2. Detect câu hỏi được hỗ trợ và entry ID khi có thể.
3. Lưu metadata form project và câu hỏi.
4. Cấu hình answer rules.
5. Generate preview responses.
6. Bắt buộc user review và confirm trước khi submission.
7. Chỉ submit các preview responses đã được confirm.
8. Ghi usage logs và submission logs.

## Scope đã chốt

Phase 3 bao gồm:

- Google Form URL analysis cho simple public forms.
- Question detection cho MVP question types được hỗ trợ.
- Entry ID detection khi available.
- Answer rules.
- Response preview generation.
- Controlled submission từ generated previews.
- Usage logging.
- Submission logging.
- Giới hạn MVP 1 đến 100 generated responses mỗi action, với submission xử lý tuần tự theo batch 10.

MVP question types được hỗ trợ:

- short text
- paragraph text
- multiple choice
- checkbox
- dropdown
- linear scale
- rating
- multiple choice grid
- checkbox grid
- date
- time

Deferred:

- file upload, vì Google yêu cầu đăng nhập với form upload file

MVP answer-generation modes được hỗ trợ:

- random equally
- random by percentage
- random by quantity
- sample text lines cho text answers
- khoảng ngày tuần tự cho câu hỏi ngày
- khoảng giờ tuần tự cho câu hỏi giờ

## Ngoài scope

Deferred:

- Google OAuth
- official Google Forms API integration
- AI answer generation
- AI mapping
- payment gateway behavior
- production background job framework
- webhook behavior
- refund behavior sau failed submission
- captcha bypass
- proxy rotation
- fake account behavior
- unauthorized form submission

## Quy tắc credit

Quy tắc credit Phase 3 đã duyệt:

- Credit chỉ bị trừ khi preview generation thành công.
- Cost là 1 credit cho mỗi preview response generate thành công.
- Form analysis không trừ credit.
- Submission không trừ thêm credit.
- Preview generation failed không trừ credit.
- Partial preview generation chỉ trừ credit theo số preview responses generate thành công.
- Mọi credit deduction phải đi qua `CreditManagement`.
- Mọi credit deduction phải ghi ledger entry trong `CreditTransactions`.
- Mọi tool action phải ghi `UsageLogs`.
- Tool action failed phải ghi `UsageLogs` với `CreditsUsed = 0`.

## Flow mặc định

```text
User gửi Google Form URL
-> analyze form URL
-> validate supported public/simple form
-> create hoặc update FormProject
-> lưu FormQuestions
-> user cấu hình AnswerRules
-> generate 1 đến 100 preview responses
-> trừ credits cho preview generate thành công
-> ghi UsageLogs và CreditTransactions
-> lưu GeneratedResponses
-> user review preview
-> user confirm submission
-> submit confirmed preview responses
-> tạo SubmissionJob
-> ghi SubmissionLogs
-> trả submission summary
```

## Module ownership

| Module | Sở hữu trong Phase 3 | Không được sở hữu |
|---|---|---|
| FormProjects | analyzed form project metadata | submission execution |
| FormQuestions | detected question metadata | answer rule behavior |
| AnswerRules | answer-generation configuration | submission execution |
| ResponseGeneration | preview response generation và MVP answer modes | auto-submit behavior |
| GeneratedResponses | stored preview payloads | credit ledger behavior |
| Submissions | controlled send workflow và submission jobs | bypass, proxy, fake-account, unauthorized submission behavior |
| SubmissionLogs | per-response submission result | refund policy |
| UsageLogs | tool action audit trail | submission payload storage |
| CreditManagement | preview-generation credit deduction | Google Forms calls |
| CreditTransactions | immutable credit ledger entries | mutable balance state |
| Integrations.GoogleForms | public form analysis và controlled form submission boundary | account hoặc credit business logic |

## API surface đề xuất

Các API area dưới đây vẫn cần contract review trước khi implementation:

- `POST /api/forms/analyze`
- `GET /api/forms/{projectId}/questions`
- `POST /api/projects/{projectId}/answer-rules`
- `PUT /api/projects/{projectId}/answer-rules/{ruleId}`
- `POST /api/projects/{projectId}/responses/generate`
- `GET /api/projects/{projectId}/responses`
- `POST /api/projects/{projectId}/submissions/send`
- `GET /api/projects/{projectId}/submissions/jobs/{jobId}`
- `POST /api/projects/{projectId}/submissions/jobs/{jobId}/cancel`

Assumption: `ProblemDetails` vẫn là candidate error shape cho đến khi final API error contract được duyệt.

## Status values cần duyệt

Không implement Phase 3 status values cho đến khi được duyệt.

Cần duyệt cho:

- `FormProject.Status`
- `GeneratedResponse.Status`
- `SubmissionJob.Status`
- `SubmissionLog.Status`

Đề xuất tối thiểu an toàn:

- `FormProject.Status`: `Analyzed`, `Unsupported`, `Failed`
- `GeneratedResponse.Status`: `Previewed`, `Submitted`, `Failed`
- `SubmissionJob.Status`: `Pending`, `Running`, `Completed`, `Failed`, `Cancelled`
- `SubmissionLog.Status`: `Success`, `Failed`

## Implementation passes

### Pass 3.0 - Phase gate và closeout

Mục tiêu:

- Xác nhận Phase 2 closeout.
- Chỉ cập nhật paired docs sau khi được duyệt.
- Giữ Deferred items là Deferred.

Output:

- Phase 2 closeout docs nếu chưa có.
- Chỉ cập nhật current phase trong roadmap sau approval rõ.

### Pass 3.1 - Contract và DB review

Mục tiêu:

- Review API contracts, DTOs, entities, status values và transaction boundaries.
- Xác nhận thời điểm trừ credit và ledger behavior.

Output:

- Approved Phase 3 contract package.
- Approved DB/entity/migration direction.
- Worker-ready implementation prompts.

### Pass 3.2 - Form analyze

Mục tiêu:

- Implement safe public form URL analysis.
- Lưu form project và detected questions.

Validation:

- Valid public form succeeds.
- Invalid URL fails safely.
- Unsupported form shape fails safely.
- Không trừ credit trong analysis.
- Usage log được ghi.

### Pass 3.3 - Answer rules

Mục tiêu:

- Implement create/update answer-rule behavior cho supported question types và modes.

Validation:

- Unsupported mode bị reject.
- Unsupported question type bị reject hoặc marked unsupported.
- Rule config validation khớp mode và question type.

### Pass 3.4 - Preview generation

Mục tiêu:

- Generate và lưu 1 đến 100 preview responses.
- Chỉ trừ credit cho preview responses generate thành công.

Validation:

- Count nhỏ hơn 1 hoặc lớn hơn 5 bị reject.
- Successful generation ghi `GeneratedResponses`, `UsageLogs`, và `CreditTransactions`.
- Failed generation ghi `UsageLogs` với `CreditsUsed = 0`.
- Không có auto-submit.

### Pass 3.5 - Controlled submission

Mục tiêu:

- Chỉ submit generated preview responses đã được confirm.
- Ghi submission job và per-response submission logs.

Validation:

- Submission không có preview bị reject.
- Submission không có confirmation bị reject.
- Successful và failed response sends đều ghi `SubmissionLogs`.
- Không trừ thêm credit trong submission.
- Không thêm retry, refund, proxy, captcha, hoặc fake-account behavior.

### Pass 3.6 - Validation và review

Mục tiêu:

- Chạy build, tests, migration validation khi áp dụng, và focused review.

Validation:

- Backend build.
- Test project build.
- Unit tests cho answer-generation modes.
- Integration tests cho persistence, ledger, usage logs, và submission logs.
- Anti-abuse tests cho count limits và không submit nếu thiếu preview/confirmation.

## Stop conditions

Dừng trước implementation nếu task sẽ:

- approve Deferred item khi chưa có approval rõ
- finalize status values khi chưa duyệt
- thêm undocumented endpoints
- tạo frontend work trong Phase 3 khi chưa duyệt
- thêm Google OAuth hoặc official Google Forms API behavior
- thêm AI answer generation hoặc AI mapping
- thêm payment, webhook, retry, refund, proxy, captcha, hoặc fake-account behavior
- làm yếu preview-before-submit hoặc confirmation requirements

## Next recommended step

Chạy Pass 3.1 trước:

- contract guard cho API/DTO/status values
- DB architecture planning cho entities và migrations
- DB risk review trước implementation
- delivery planner để tạo worker-ready prompts
