# FAH-DIRECT-001 — Bàn giao triển khai backend

Ngày: 2026-11-01. Writer: `/root/direct_rules_backend`, `gpt-6.1-sol`, reasoning `high`; không agent lồng nhau. Scope và quyết định root nằm tại [INDEX](INDEX.md).

## Summary

Đã triển khai gửi rules trực tiếp với command/job reservation bền vững, replay chỉ đọc, khóa admission SQL chung và runner tuần tự hiện có. Không schema/migration, trạng thái lifecycle mới, recovery tự động, quy tắc refund hoặc đổi AI provider.

## Files changed

- `src/FormAutoHub.Api/Contracts/Phase3Dtos.cs`: `DirectRuleSubmissionRequest(Guid CommandId, int Count)`.
- `src/FormAutoHub.Api/Controllers/SubmissionsController.cs`: route direct có auth; phản hồi job hiện có, null→404, admission sai→400.
- `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs`: `IDirectRuleSubmissionService.SendAsync`, reservation/replay kiểm owner, generation trong admission và gọi runner ngoài delegate retry.
- `src/FormAutoHub.Api/Services/SubmissionAdmission.cs`: khóa row project dùng chung send/direct, predicate active, reservation job, retry giới hạn khi xung đột RowVersion, context mới đọc job đã commit sau khi mất acknowledgement.
- `src/FormAutoHub.Api/Services/SubmissionService.cs`: runner internal chung, từ chối response đã có log, hủy fail-closed, cập nhật SQL pause/cancel/finalization có điều kiện, giữ nguyên nhân aggregate khi lỗi diagnostic.
- `src/FormAutoHub.Api/Services/ResponseGenerationService.cs`: core generation chung có đường direct nội bộ, credit tham chiếu job, evidence usage cho partial generation.
- `src/FormAutoHub.Api/Services/AnswerRuleService.cs`: chuyển validation hiện có sang internal để tái sử dụng.
- `src/FormAutoHub.Api/Program.cs`: đăng ký runner concrete một lần mỗi scope, interface send chung trỏ cùng instance, đăng ký service direct.
- `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs`: 24 ca hành vi InMemory.
- `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs`: sáu phương thức SQL opt-in, tám ca khi mở rộng theory; SQL thật, chỉ giả lập ranh giới Google.
- Cặp task `INDEX.md` và `BACKEND.md` này.

Writer không đổi frontend, entity, EF mapping/migration, phiên bản dependency hoặc cấu hình ứng dụng.

## Scope alignment

Rules count 1..100 tạo/gửi phần đủ credit với x1. Send chung vẫn bắt xác nhận. Replay direct chỉ đọc job/log đã lưu, kể cả Failed/Running/Cancelled. Sai owner/project trả null trước khi lộ dữ liệu. Runner giữ batch tuần tự 10, fence attempt trước provider và lưu kết quả xác nhận trước lượt tiếp theo. Response đã attempt bị chặn gửi chung bằng log hiện có; response chưa gửi/chưa có log vẫn có thể xem rồi xác nhận gửi thủ công.

Quyết định không schema của root khả thi với giới hạn crash cứng cần đối soát thủ công và fail-closed. `SubmissionJob.Total` báo số đủ credit được nhận; phản hồi dùng contract hiện có, không wrapper đã loại.

## Validation performed

Mọi lệnh chạy tại `D:/TinHoc/FormAuto_Hub`, cấu hình Release; writer không gọi provider thật/runtime.

| Kiểm tra | Kết quả |
| --- | --- |
| Regression an toàn hiện có ban đầu | RED: 3 failed vì preview đã log bị gửi lại và cancel đặt FinishedAt ngay |
| Ca direct mới trước khi có service | RED: 20 failed do thiếu workflow direct; thay discovery tạm bằng lời gọi typed sau triển khai |
| Hủy rồi provider lỗi | RED: Failed ghi đè Cancelled đã lưu; GREEN sau sửa đúng scope |
| Ca direct tập trung | Verified: 24 passed |
| Direct + regression persistence hiện có, sau chỉnh diagnostic cuối | Verified: 38 passed, 0 failed; `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter 'DirectRuleSubmissionServiceTests\|FahErrSubmissionPersistenceTests' --no-restore -v minimal` |
| Direct + persistence + Phase3 trước chỉnh diagnostic cuối | Verified: 65 passed |
| Build solution Release | Verified: exit 0; `dotnet build FormAutoHub.sln -c Release --no-restore -v minimal` |
| Full backend trước chỉnh nhỏ diagnostic cuối | Verified cho ca đã chạy: 315 passed, 12 phương thức SQL skipped, 0 failed; `dotnet test FormAutoHub.sln -c Release --no-restore -v minimal` |
| Whitespace | Verified: `git diff --check`, exit 0 |

Warning NU1603 có trước resolve `Google.Apis.Forms.v1` 1.69.0 thành 1.69.0.3673. Không sửa dependency. Lượt `--no-restore` đầu trả về mà không có output test khi assets chưa sẵn sàng; không tính là evidence. Lượt chạy test thông thường sau đó dùng dependency sẵn có và cho kết quả RED/GREEN trên.

## Validation not performed bởi writer

- SQL ở bàn giao đầu: writer Not run thời điểm đó; runtime owner sau đó báo 8/8. Bản sửa B1 nay có SQL thật do writer chạy ở dưới. Riêng InMemory không bảo đảm khóa/transaction SQL.
- HTTP/auth/browser smoke, restart API/web và xem log: runtime agent/root sở hữu; writer Not run.
- Review code độc lập: bắt buộc, chờ root phân công.
- Frontend lint/build/browser: evidence writer/runtime riêng.
- Google thật hoặc provider trả phí: Not run, ngoài scope.

SQL opt-in đòi đúng `FORMAUTO_DIRECT_SQL_SERVER=.` hoặc `localhost` và `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`. Fixture kiểm identity machine/database thực, không tạo, drop, reset hoặc dọn DB; chỉ seed dữ liệu giả GUID ngẫu nhiên. Giữ evidence test. SQL tests bao phủ admission cùng/khác command và route chung theo hai chiều, tranh chấp RowVersion cùng account khác project, hủy tại cập nhật cuối, acknowledgement commit mơ hồ và rollback transaction sau generation/debit.

## Risks/Deferred items

- Crash cứng hoặc mất acknowledgement commit có thể để Running không có runner; replay không takeover. Cần đối soát thủ công.
- Cancelled với FinishedAt null chặn admission tới khi xác nhận dừng. Paused hiện có không phân biệt bền vững đã ack; hủy sau khi runner paused đã thoát có thể cần đối soát thủ công, đúng lựa chọn root.
- SQL checks và runtime phải pass trước local Done. Không tuyên bố tích hợp/phát hành.
- Không retry tự động kết quả provider chưa biết; không thêm lease, membership schema, trạng thái hoặc refund semantics.

## Next recommended step

Runtime owner chạy SQL suite đóng băng và HTTP/browser có auth an toàn trên process bị ảnh hưởng do mình sở hữu. Root lấy review độc lập base `297ee2143f7a37ca02739157d75e3db06ab4be17` cộng toàn bộ snapshot source dirty/untracked, sửa finding rồi ghi checks. Backend writer chưa commit, push, deploy, khởi động/dừng API/web hoặc đổi DB/config.

## Sửa B1 — 2026-11-01

Review độc lập [B1](BACKEND_REVIEW.md) xác định admission direct bị từ chối thiếu evidence usage thất bại bền vững: log generation bên trong bị rollback cùng admission, còn lỗi request/active job không có log. Đã tái hiện trên SQL thật trước sửa production: filter mới cho rejection/privacy/replay có 10 failed, 2 passed; tám ca từ chối không có usage row và hai request sai owner với input sai ném validation trước kiểm quyền.

Sửa nhỏ nhất: vòng này production chỉ đổi `DirectRuleSubmissionService`. Service kiểm owner trước validation request, chỉ bắt `InvalidOperationException` trong admission cục bộ sau khi transaction dispose, xóa state tracked đã rollback, kiểm lại owner, rồi lưu một usage row `SubmitResponses` Failed với 0 credit và ném lại lỗi. Runner provider và đường trả thành công/replay nằm ngoài handler đó. Vòng này không đổi `SubmissionAdmission`, credit/generation, runner, DTO/controller/DI hoặc frontend.

Sửa test trong hai file direct hiện có. Assertion SQL thật bao phủ rules thiếu/sai, 0 credit, count 0/101, command rỗng, active conflict và lỗi chèn sau generation/debit nhưng trước persistence reservation. Mỗi ca kiểm đúng một usage row Failed bền vững, balance giữ nguyên, không debit, không job mới, chỉ còn preview seed, 0 provider call và không lọt usage thành công. Ca SQL thêm chứng minh request sai owner có input đúng/sai trả null mà không phát sinh usage/credit/job cho project; replay command hiện có không tạo usage mới.

Verified: `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --filter 'DirectRuleSubmission|FahErrSubmissionPersistenceTests' --no-restore -p:BaseOutputPath=D:\TinHoc\FormAuto_Hub\.codex-tmp\direct-b1-bin\ -v minimal`, đặt `FORMAUTO_DIRECT_SQL_SERVER=.` và đúng `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`: 58 passed, 0 failed, 0 skipped (24 direct InMemory, 20 SQL thật, 14 regression persistence). Chỉ build thư mục output riêng; giữ nguyên process API/web/receiver runtime và binary mặc định. Warning dependency có trước vẫn còn. `git diff --check -- src/FormAutoHub.Api tests/FormAutoHub.Tests` exit 0.

Not run cho B1: lặp full suite (thay đổi nhỏ đã có regression tập trung), HTTP smoke nhánh từ chối mới sau restart API sở hữu, review độc lập lại. Root/runtime sở hữu hai gate cuối. Source đã đóng băng để review; không commit/push/deploy/config/schema.

SHA256 source/test đã đổi:

| File | SHA256 |
| --- | --- |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `946E2B9B51003C2E255E92FC7FC35B8B35301C6E0D4CABBDD122A9EBCF71044E` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `757BC5B9E1751D5C8B223700C007A70360FA1C98142B50D7A615E4B58EDEA895` |
