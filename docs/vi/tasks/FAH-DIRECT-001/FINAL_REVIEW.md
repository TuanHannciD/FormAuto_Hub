# FAH-DIRECT-001 — Review độc lập cuối

Ngày: 2026-11-02. Reviewer: `/root/direct_rules_final_review`, `gpt-6.1-sol`, reasoning `high`; độc lập với tác giả source/test, không agent con. Base và HEAD: `297ee2143f7a37ca02739157d75e3db06ab4be17`; branch `feat/direct-rule-submission`, snapshot working dirty/untracked đã đóng băng, chưa commit.

## Summary

**Kết luận spec/code review: Passed. Không phát hiện finding Critical/Important chưa giải quyết.** Backend B1 và frontend F1–F4 đã được giải quyết trong snapshot review. **Runtime acceptance là gate riêng:** runtime owner vẫn đang tạo bằng chứng browser/API/SQL cuối khi viết báo cáo này. Review này không tuyên bố local Done, tích hợp hoặc release.

## Findings và xác minh bản sửa

- **B1 đã giải quyết:** admission direct bị từ chối kết thúc/rollback transaction trước khi clear tracking và ghi một usage Failed, zero-credit cho owner đã xác thực. Exception của runner và replay chỉ đọc nằm ngoài handler. Assertion SQL kiểm rollback generation/debit/reservation cùng failure audit bền vững, quyền riêng tư owner và replay không ghi usage mới.
- **F2 đã giải quyết:** POST 400/409 nay gọi route GET job theo owner hiện có bằng command ID. User của session được kiểm trước và sau probe; chỉ áp dụng job hợp lệ và khớp command/project. GET 404 cùng user chỉ xóa command đang lưu khớp. Read lỗi, malformed, sai identity hoặc đổi session giữ command; HTTP chưa giải quyết khác cũng giữ command. Không thêm discriminator API hoặc contract.
- **Test F2 có ý nghĩa:** năm ca thêm mới phân biệt 400→GET 200 và 400→GET 404, đồng thời kiểm 409→GET 503, sai identity job và đổi session. Assertion kiểm identity/số request và storage/trạng thái action giữ hoặc xóa. Fixture 200 là job Completed đã xác định nên xóa command đã giải quyết là đúng. Các ca uncertain-terminal, tài khoản/tab/Web Locks, compare-before-clear, partial-credit/mixed-outcome và xác nhận AI vẫn còn.
- **F1/F3/F4 được giữ:** log chưa xác định ngăn clear command terminal, storage theo user có serialize creation và compare-before-clear, total đã tạo tách khỏi số gửi thành công/thất bại.
- Đã sửa hai câu cũ trong FRONTEND AI/VI: status HTTP đơn lẻ không mở khóa command; route GET job hiện có đối soát command được nhận vì command ID bằng job ID. Đây là sửa báo cáo, không thay đổi hành vi đã duyệt.

## Scope alignment

Đã review toàn bộ diff task cùng unit direct service/admission/test mới và các consumer generation, credit, runner, controller/DI, API client/session, state/render form và test bị ảnh hưởng. Đối chiếu baseline API/architecture AI/VI và báo cáo task với INDEX đã duyệt.

- Đúng route/request trực tiếp `{commandId,count}` và `SubmissionJobResponse` hiện có; giữ count 1..100, quyền owner, subset theo credit x1 và ledger qua credit service.
- Admission SQL theo project dùng chung cho common/direct bao generation/debit/reservation. Replay kiểm owner/project và chỉ đọc; provider nằm ngoài transaction và EF retry delegate.
- Runner tuần tự theo batch tối đa 10, ghi attempt fence trước provider và outcome đã biết trước lần gọi tiếp; common send từ chối mọi response đã có log. Acknowledgement hủy và conditional update giữ ranh giới fail-closed đã duyệt.
- Option 1 có một **Tạo và gửi ngay**, không preview/checkbox/xác nhận thứ hai; AI Option 2/3 giữ preview và xác nhận rõ qua common route.
- Không phát hiện entity/migration, lifecycle mới, tự resend unknown, mở rộng provider/refund hoặc cam kết phase. Các thay đổi baseline AI/VI tương đương về cam kết.

## Files changed

Reviewer chỉ sửa paired `FINAL_REVIEW.md`, trạng thái/evidence F2 trong paired `FRONTEND_REVIEW.md` và hai câu báo cáo trong paired `FRONTEND.md`. Không sửa production/test, dependency, config, process, SQL, provider, lịch sử Git hoặc deployment.

## Validation performed

- **Verified bởi reviewer cuối:** review source/test/contract như trên; 24 hash frozen khớp trước/sau; `git diff --check` tại `D:/TinHoc/FormAuto_Hub` exit 0. Còn warning LF→CRLF hiện có ở README và error spec.
- **Evidence writer, reviewer cuối không chạy lại:** [BACKEND](BACKEND.md) ghi focused 58/58, không skip, gồm 20 ca SQL thật trên DB cô lập có guard; full backend trước đó 315 pass/12 SQL method skip và Release build pass có giới hạn snapshot đã nêu. [BACKEND_REVIEW](BACKEND_REVIEW.md) đã review độc lập bản sửa B1 và pass.
- **Evidence writer, không chạy lại:** [FRONTEND](FRONTEND.md) ghi Playwright gộp bị ảnh hưởng 30/30 trước F2 vòng 2, sau đó direct-spec 17/17 sau vòng 2; lint/build cuối pass với warning ngoài scope cũ và detector `[]`. Reviewer cuối đã đọc các ca bao phủ và hash cuối thay vì lặp suite.
- **Evidence runtime owner, không chạy lại:** [RUNTIME](RUNTIME.md) ghi SQL concurrency ban đầu 8/8 và HTTP có auth/API/SQL/loopback an toàn; B1 rerun xác nhận mỗi rejection 400 phù hợp ghi một usage Failed zero-credit bền vững, không thêm job/debit/generated/send, sai owner 404 không có effect và replay cùng command không gọi lại receiver.
- Đã kiểm link báo cáo, UTF-8 và nghĩa AI/VI. Hash source/test/baseline dưới đây khớp freeze được giao; ledger runtime/task đang cập nhật không được mô tả là source bất biến.

| File | SHA256 trước = sau review cuối |
| --- | --- |
| `src/FormAutoHub.Api/Contracts/Phase3Dtos.cs` | `485D077EA317F5ECC778DEE2B24D04252859493D2B1A7BE9070B03DB78D5AD3E` |
| `src/FormAutoHub.Api/Controllers/SubmissionsController.cs` | `B6A50703D49DEC5802CBFDA7A96516A730FD02F36C6AB8F502AB9F03D4794D26` |
| `src/FormAutoHub.Api/Program.cs` | `18DB551D19CD5935EF0D0419F37F8A8E9852EF84D3E8F1F524E84F1EB47864CD` |
| `src/FormAutoHub.Api/Services/AnswerRuleService.cs` | `6C695C91B153316674F1E943962285049756BD732E005C04B8FA4DC5634B2AF8` |
| `src/FormAutoHub.Api/Services/DirectRuleSubmissionService.cs` | `CEB334225F2F7213B5BF64CAC7B5289A39189028924462A202C8DE1A4A58EF3D` |
| `src/FormAutoHub.Api/Services/ResponseGenerationService.cs` | `F72B87FFC378809EACE2BF58BAFAED966C372CBEE5BB63F75232159ABA8A56AD` |
| `src/FormAutoHub.Api/Services/SubmissionAdmission.cs` | `520E8DEDD00B103FB02D6427CA1FF59856D27E2E10360ED5125617B11D0E4E80` |
| `src/FormAutoHub.Api/Services/SubmissionService.cs` | `61AA49943794F08E43D2ECB83B20D0F749F0848548CA7E361F89A79A27F52DDA` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionServiceTests.cs` | `946E2B9B51003C2E255E92FC7FC35B8B35301C6E0D4CABBDD122A9EBCF71044E` |
| `tests/FormAutoHub.Tests/DirectRuleSubmissionSqlServerTests.cs` | `757BC5B9E1751D5C8B223700C007A70360FA1C98142B50D7A615E4B58EDEA895` |
| `apps/web/app/dashboard/forms/_components/WorkflowSummary.tsx` | `DC06270A30984ACE01D7E5C904FA152BEC12136835A3A4009844D47AE6A45CCA` |
| `apps/web/app/dashboard/forms/_constants.ts` | `0511F34B5F93F5E66F7DC85FC9D77FC82F1DC63DD22AA1091D93E532E6ED7C3C` |
| `apps/web/app/dashboard/forms/_helpers.ts` | `C0CF496065859B5283E89C349062BDBB4B7AFFF98419BA2E1D5FF72F8BB10B64` |
| `apps/web/app/dashboard/forms/_types.ts` | `D9FA10765B8DC0D0C5973814EB7B63747914A6510C3E3F3D80632659184FE0E7` |
| `apps/web/app/dashboard/forms/page.tsx` | `51AF7F64AE72AA5000CB51461D7D8308A682C577A983666A1282A7834B0127E0` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `D41A2D599B391F7895743C13D269967FDEE6DD70B38361A583C803BC519E2A9A` |
| `apps/web/tests/form-automation.spec.ts` | `7F172164E02FDB9E6EBE9265EBE08F21E2E94584D445B91CA9DD069901807F5A` |
| `apps/web/tests/fah-err-forms-errors.spec.ts` | `7F47BFB681666F697B14E71EBDB7B8A1C6CE03621D9516F71508921C7268C446` |
| `AGENTS.md` | `F14B5AA14509FEBE92EB39A6B2BE49083E0D320FB54C21C7DDA30B6ACE73EC8E` |
| `README.md` | `984ECCD8501F50D4FD38B97ADA40DDD7B655A549AF99E72DAC56C43D0E2B66DA` |
| `docs/ai/API_CONTRACT_GUIDE.md` | `BA1D54FC02B05FD2F78E68B2E0942137A0FEF9BAC7F08F0BC307FCE013206373` |
| `docs/vi/API_CONTRACT_GUIDE.md` | `F6664AD8B0A71BC23F95A97A47FBA7B885894C2A1D70EBC1DC0457F8D63CD635` |
| `docs/ai/ARCHITECTURE_BOUNDARIES.md` | `967343AB23AF83CA1880407F355C02081F1FA51E9C424F1FF1DB5EE99E04E9D0` |
| `docs/vi/ARCHITECTURE_BOUNDARIES.md` | `E4D9E4FDC5695EE1BA25BB0D498F2C1C7A3DC1584FA1F83E1B7B32C937346A84` |

## Validation not performed

**Not run bởi reviewer cuối:** chạy build, lint, unit/SQL/Playwright, tương tác browser, request API mới, restart process hoặc provider thật. Runtime owner sở hữu tài nguyên; không có lỗi mới biện minh việc lặp check nặng. GET malformed và Web Locks request reject đã được đọc source; chưa có ca chạy thêm riêng được cung cấp ở đây.

**Gate chờ root:** browser smoke cuối trên snapshot web/API thuộc sở hữu đã restart, auth/session thực, chunk/hydration và log giới hạn, SQL outcome độc lập cùng xác minh giải phóng tài nguyên sở hữu. Root phải đánh giá báo cáo runtime cuối trước local Done. Kết luận code review không biến gate đang chờ thành pass.

## Risks/Deferred items

Giữ giới hạn không schema đã duyệt: hard crash/commit chưa xác định có thể để reservation active cần đối soát thủ công; hủy runner đã thoát ở Paused có thể giữ Cancelled với FinishedAt null và chặn admission. Không duyệt tự takeover, resend hoặc refund. Đây là quyết định đã ghi, không phải finding mở lại.

## Next recommended step

Root tổng hợp review spec/code độc lập đã pass với runtime acceptance cuối và cập nhật ledger AI/VI. Review này không yêu cầu sửa production/test thêm; tích hợp/release vẫn cần quyền riêng.
