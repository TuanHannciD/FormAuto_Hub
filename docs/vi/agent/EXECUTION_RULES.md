# Thực hiện task, quyền và bàn giao

Superpowers cung cấp phương pháp; tài liệu này sở hữu quyền project, ngữ cảnh task và tính liên tục. Chỉ chọn skill phù hợp từ [matrix](../../../SKILL_USAGE_MATRIX.md). [Quality gates](QUALITY_GATES.md) sở hữu kiểm chứng và Done.

## Một vòng làm việc

1. Bắt đầu/tiếp tục: đọc README → AGENTS → [authority](AUTHORITY_MAP.md) → task/handoff đã có → [routing](../AI_DOC_ROUTING_MATRIX.md). Kiểm workspace, approval trước đó, công việc dirty/untracked/ignored và next action.
2. Chuẩn bị: xác định kết quả, scope, acceptance, phase/follow-up, module/layer, tác động contract/DB, safety, kiểm chứng và vùng file được sửa. Dùng lại quyết định; chỉ làm rõ phần thiếu ảnh hưởng tính đúng hoặc quyền.
3. Lập kế hoạch và thực hiện: dùng brainstorming/writing-plans khi cần khám phá/lập kế hoạch, rồi executing-plans hoặc Agent con được phép. Task nhỏ, rõ dùng plan ngắn. Vai trò planning/review không âm thầm trở thành writer. Thay đổi nhỏ nhất đủ đúng, không redesign/refactor ngoài scope.
4. Kiểm chứng và review: chạy check phù hợp, đọc evidence/log, xử lý findings và chạy lại check ảnh hưởng. Debug phải tách bằng chứng tái hiện khỏi giả thuyết.
5. Bàn giao: kết quả, giới hạn, findings/tài nguyên còn lại và next action chính xác. Tích hợp/phát hành là sự kiện riêng theo quyền thật.

## Quyền thao tác

Tiếp tục implementation, test, sửa lỗi và tài liệu đã được phép, không hỏi lại từng bước. Chuẩn bị kết quả review được trước khi xin quyết định phát hành. Chỉ hỏi khi thiếu quyết định/quyền thực sự chặn tính đúng; tiếp tục phần độc lập đã được phép.

- Tài liệu vẫn proposal-first trừ khi edits đã được duyệt. Đợt chuyển đổi này đã được duyệt rõ; không duyệt nghiệp vụ sản phẩm mới.
- Không tự bịa nghiệp vụ, field, endpoint, status, event, lifecycle, hành vi auth/Google/payment/AI/refund hoặc kiến trúc. Không kích hoạt Deferred, vượt phase/follow-up đã duyệt, làm yếu safety hoặc âm thầm chốt contract/schema đề xuất. Phải có quyết định còn thiếu trước.
- Sửa/check local theo scope task. Cài dependency/skill/MCP, đổi cấu hình global, chi phí provider, hệ thống remote, lịch chạy định kỳ, commit/push/merge/deploy và cleanup phá hủy phải được quyền người dùng/phiên thật bao phủ; có tool không phải có quyền.
- Push main có thể kích hoạt workflow CI/release/deploy trong repo. Kiểm tác động này và environment gate trước hành động remote được phép. Sửa tài liệu không tự cấp quyền deploy.
- Dispatch Agent theo quyền phiên hiện tại. Tool có trong catalog không tự cấp quyền. Discovery provider/model/schema hiện hành; không hardcode catalog cũ. Với T3, giữ từng task ID, dùng status/cancel đúng task, tạo delegated task mới cho mỗi vòng review. Backing child thread không là vòng review mới.
- Writer đồng thời tách checkout và tài nguyên. Worktree mới không chứa thay đổi chưa commit của parent. Kiểm snapshot cần giao trước. Không ép workspace dirty sang worktree hoặc tự commit thay đổi người dùng.
- Giữ file dirty/untracked/ignored, evidence, tab người dùng và process không liên quan. Không reset/clean/ghi đè hoặc cleanup recursive khi chưa rõ ownership và chưa kiểm đường dẫn tuyệt đối.
- Không đưa secret, token/cookie thô, mật khẩu, payment key, provider key hoặc payload cá nhân vào Git/report/output. Chẩn đoán production vẫn chỉ đọc theo server specialist; khôi phục cấu hình dùng reference hẹp đã được cấp quyền rõ.

## Ngữ cảnh task bền vững

Task lớn giữ hồ sơ ngắn tại `docs/ai/tasks/<task-id>/` và cặp `docs/vi/tasks/<task-id>/`. INDEX gồm scope/approval, plan, quyết định, check và next action; chỉ tách file khi hữu ích. Task nhỏ có thể dùng [task brief](../../../templates/TASK_BRIEF.md) và [handoff](../../../templates/HANDOFF.md), không cần hồ sơ mới.

Trước khi sửa, ghi base SHA hoặc giới hạn snapshot trung thực, owner/writer/reviewer route, vùng được sửa, việc cần giữ và acceptance. Ghi ownership process/cổng/DB/browser/report trước khi acquire; xác nhận identity thật riêng. Không dừng process chỉ dựa cổng/PID hoặc reset DB đang có để test xanh.

Evidence thuộc task/run, không thuộc scratch disposable của skill. Giữ báo cáo cần thiết ngoài vùng cleanup. Chỉ release tài nguyên sở hữu và kiểm kết quả; không xóa evidence chỉ vì bị ignore. Checkpoint resume không chứng minh tự restart/crash recovery hoặc scheduler.

## Tài liệu và source

Đọc Markdown liên quan trước khi sửa. Cập nhật AI/VI cùng nhau, giữ scope/Deferred và UTF-8. Giữ tài liệu mới/đang sửa dưới 400 dòng; tách chủ đề độc lập hoặc dùng TOC chi tiết khi nội dung gắn chặt. File cũ quá dài không kéo theo retrofit toàn repo. Ưu tiên heading/symbol ổn định hơn địa chỉ dòng viết tay; [source rules](../SOURCE_STRUCTURE_AND_NAMING_RULES.md) sở hữu điều hướng code.

## Đóng task và tiếp tục

Báo cáo implementation cuối có Summary, Files changed, Scope alignment, Validation performed, Validation not performed, Risks/Deferred items và Next recommended step. Viết tiếng Việt rõ, mặc định ngắn; khi có mâu thuẫn nêu evidence và phần cần duyệt. Review đưa findings trước.

Dùng [HANDOFF](../../../templates/HANDOFF.md) cho ngữ cảnh mới: quyền, workspace/base/tip hoặc snapshot, việc xong/còn lại, command/result/artifact thật, phạm vi review, tài nguyên và next action. Tiếp tục đúng bước đó; không phân tích lại phần đã xong hoặc suy quyền từ plan lịch sử.
