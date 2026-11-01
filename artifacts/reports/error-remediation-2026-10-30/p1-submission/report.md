# FAH-ERR-001 P1 A — ERR-008 / ERR-007

2026-10-30 ICT. Writer `/root/p1_submission`, `gpt-6.1-sol / high`; không dispatch con. Base HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`; thay đổi chưa commit trong workspace chung có baseline DB-sync được bảo toàn. **Implemented; GREEN14 + regression36 Verified, đang chờ runtime và independent review; chưa Done.**

## Summary

- ERR-008: tạo và lưu SubmissionLog trước khi gọi Google; lưu từng kết quả đã trả về trước lần gửi kế tiếp. Khi provider throw/cancel, giữ original exception/stack, gắn ID nội bộ, lưu attempt có mô tả kết quả chưa xác định, dừng job bằng trạng thái Failed hiện có và lưu UsageLog với số kết quả xác nhận. Không tăng FailedCount nếu chưa có kết quả từ provider.
- Nếu bước ghi trước provider thất bại, log ghi rõ lượt gửi chưa thực hiện. Nếu bước lưu cuối thất bại, cập nhật một UsageLog đang tracked thay vì tạo hai dòng thành công/thất bại trái nhau. Khi lưu diagnostic cũng thất bại, AggregateException giữ cả lỗi gốc và lỗi persistence.
- Collection lưu DataCollectionLog trước OAuth/Google I/O; nhánh exception/cancel lưu Failed + CompletedAt với nội dung an toàn rồi rethrow lỗi gốc. Không copy provider exception text vào collection/submission message.
- Form generation ghi remoteFormId/modelId/stage vào AuditLog ngay khi CreateForm trả thành công, trước bước tạo câu hỏi/re-import. Nhánh null/false sau create nói rõ form đã tồn tại trên Google. Exception giữ remote/model ID nội bộ.
- ERR-007: mô tả UsageLog theo kết quả thành công/thất bại/một phần/tạm dừng/hủy và số lượng thực tế; không sửa lịch sử cũ.

## Files changed / snapshot

Chỉ thay bốn file dưới đây. `snapshot.json` chứa SHA256/bytes của đúng final freeze; `source/` giữ bản sao đầy đủ gồm test mới. `change.patch` chứa diff ba service so với HEAD; test mới chưa tracked được giữ nguyên trong snapshot.

| File | SHA256 |
| --- | --- |
| src/FormAutoHub.Api/Services/SubmissionService.cs | f35378a3d00985f9b8e941fd96b970695658cd32b51347fd92f38258f6b64488 |
| src/FormAutoHub.Api/Services/Nckh/ResearchDataService.cs | dfb972f9976dacd3c5981dd80300368194a622d7078c83ee4328d2d1209159b3 |
| src/FormAutoHub.Api/Services/Nckh/ResearchFormService.cs | 8fd2e1bf043871573cbef3a8e644f6c1062a23b4ba20295f2b41caeb7835b35d |
| tests/FormAutoHub.Tests/FahErrSubmissionPersistenceTests.cs | cb167f069beb508c204e9f60dde5132076b3b6e8d40fbc0c8858a4518c6a3293 |

Patch SHA256 `572d1f53cb019de0eceb5a2239aab2b95df273bad0497f116ad52bb1f6701353`.

## Causes / scope alignment

Root causes: submit cũ lưu theo batch nên success trước exception chưa durable, attempt chỉ được tạo sau khi provider trả về; payload JSON catch bỏ inner cause; collection log chỉ tracked trước I/O; remote create ID không được ghi trước follow-up; usage description hardcode thành công.

Root ruling trong lượt này: **chọn A**, dùng AuditLog hiện có để lưu remoteFormId/modelId/stage ngay khi remote create thành công; diagnostic-only, không tạo Draft ResearchForm trước hoàn tất, không thêm lifecycle/recovery và không khẳng định rollback. `GenerateForm` là action diagnostic tại AuditLogs, không thêm integration event/webhook.

Giữ nguyên DTO, route, schema và tập trạng thái hiện có; giữ confirmation, preview-only, tối đa100, sequential batches10, pause/cancel tại boundary; không gọi credit service, không ghi đè credit/ledgers. Không retry Submit/CreateForm hoặc gọi provider thật. Save diagnostic sau side effect/cancel dùng token riêng có hạn10giây. Các file csproj/migration/scripts/baseline DB-sync và dirty/untracked/ignored/evidence ngoài phạm vi được giữ nguyên.

## Validation performed

- **Verified RED:** runtime owner chạy filter `FullyQualifiedName~FahErrSubmissionPersistenceTests`, 12 executed /12 failed /0 compile errors trước sửa production. Thất bại đúng durability/inner cause/usage wording. Bằng chứng `../runtime/p1-submission-red/{runner-result.json,red-verification.json,*.trx}`. Một số assertion tại fake provider kiểm fresh context và dừng tại missing persisted rows; đây là thiếu durable evidence dự kiến, không phải compile error.
- **Verified RED2:** runtime owner chạy `FullyQualifiedName~FahErrSubmissionPersistenceTests.Send_PersistenceFault`, 2 executed /2 failed trước follow-up fix: duplicate UsageLogs và log unknown cho lượt chưa gọi provider. Bằng chứng `../runtime/p1-submission-red2/{runner-result.json,console.log,submission-red2.trx}`; exact RED2 test/source tại `red2-source/`.
- **Verified GREEN:** runtime owner chạy Release `FullyQualifiedName~FahErrSubmissionPersistenceTests`, 14/14 passed,0failed/0skipped,exit0. Đọc lại `../runtime/p1-submission-green/verification.json` và `submission-green14.trx`; hash cả4file ổn định qua runner.
- **Verified regression:** Release filter `FullyQualifiedName~Phase3FormAutomationTests|FullyQualifiedName~NckhPhase4FormGenerationServiceTests|FullyQualifiedName~NckhPhase5DataServiceTests`,36/36passed,0failed/0skipped,exit0. Bằng chứng `../runtime/p1-submission-regressions/{verification.json,submission-regressions.trx,console.log}`. Compile0errors, NU1603 baseline còn.
- **Verified static:** `git diff --check -- <3 service paths>` exit0; tự đọc diff và consumers. Đây là self-review, không phải independent review.
- **Verified snapshot:** kiểm lại SHA256 thực tế so với manifest và copied snapshot4/4; source không đổi sau freeze.
- Test doubles chỉ thay Google/HTTP/OAuth tại external boundary; service/EF thực thi thật, fresh context đọc persisted InMemory rows. Hai persistence-fault tests dùng EF SaveChangesInterceptor để chặn một lần save, không submit thật.

## Validation not performed

- **Not run:** full backend suite/build độc lập của implementer; owner runner thực hiện để tránh tranh chấp output/process. NU1603 Google.Forms cached-version warning có trong RED baseline, không bị suppress.
- **Not run:** SQL Server durability/transaction/fault behavior, API/JWT/browser smoke sau restart intended owned process, Google thật. InMemory không chứng minh SQL Server durability. Không acquire process/port/DB/browser resource từ agent này.
- **Not run:** independent review; root giao reviewer từ snapshot này sau GREEN. Submission-safety gate vẫn mở cho tới review và smoke phù hợp.

## Risks / Deferred items

- Không đảm bảo final diagnostic khi process crash/hard-kill hoặc SQL không sẵn sàng. Pre-I/O attempt/log và remote-created audit giảm mất dấu khi các save đã thành công; đây không phải crash recovery/outbox/idempotency/resume policy. Crash giữa remote create và save audit vẫn có thể để remote ID chỉ trong memory; thất bại save giữ ID trong exception.Data khi còn process.
- `SubmissionLog.Status=Failed` hiện có biểu thị local incomplete attempt khi ErrorMessage ghi rõ chưa xác định và SubmittedAt=null; không coi đó là bằng chứng Google chưa nhận. FailedCount chỉ đếm provider-returned failures. No new unknown status.
- Unknown attempt giữ GeneratedResponse ở Previewed; hệ thống không tự retry. Policy tự động ngăn manual resend/giải quyết uncertain outcome là Deferred, không tự thêm trạng thái hoặc khóa khác.
- UI forms consumer hiện chỉ đếm Success/Failed theo batch và chưa render errorMessage, đồng thời send catch có thể nói chung chung. Đã gửi root để worker UI cập nhật trong scope riêng; service packet này không sửa frontend. Không thể tuyên bố user đã nhìn thấy unknown wording trong browser.
- Audit diagnostic không tạo generated ResearchForm nên không đổi hasGeneratedForm/duplicate-create contract. Không tự động giải quyết form remote chưa import hoặc sửa/delete form remote.
- Catch giữ exception.Data IDs trong memory; standard logger không mặc nhiên serialize Data. Durable link chính là các SubmissionLog/DataCollectionLog/AuditLog đã save; không tuyên bố pipeline log đã hiển thị mọi context field.

## Next recommended step

Root giao independent reviewer đúng hash snapshot đã GREEN14/regression36. Nếu reviewer yêu cầu chỉnh sửa, tạo snapshot/check mới; runtime owner tiếp tục full backend/applicable API/SQL/browser smoke bằng fake outbound được phép. Không close ERR-008/007 toàn hệ thống hoặc release từ packet source/InMemory này.
