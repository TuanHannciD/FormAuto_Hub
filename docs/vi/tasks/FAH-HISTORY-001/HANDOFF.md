# Bàn giao Task6

> Giao nhận mới nhất: đã merge vào main local, gỡ nhánh/đăng ký worktree tính năng. Xem [MERGE_CLOSEOUT](MERGE_CLOSEOUT.md); hướng dẫn giữ worktree cũ bên dưới là lịch sử.

> Trạng thái hiện tại: **Done theo xác nhận người dùng**. Được phép dọn tài nguyên/commit local; xem [CLOSEOUT](CLOSEOUT.md). Các ghi chú review/tài nguyên cũ bên dưới là lịch sử.

## Phạm vi đã đóng băng

Runtime, SQL và browser evidence Task6 đã thu thập trong phạm vi local được duyệt và sẵn sàng independent review. Không provider production, deploy, commit, merge hay cleanup. Source/test mới chỉ gồm SQL rehearsal Task6, strict direct-SQL opt-in và browser harness runtime; toàn bộ Task2–5 được giữ nguyên.

## Tài nguyên giữ lại

- API PID 14444, `127.0.0.1:5305`, `task6-api-owner.json`, log `task6-api-5305.log` và `.err.log`.
- Web PID 9668, `localhost:3305`, `task6-web-owner.json`, log `task6-web3305.log` và `.err.log`.
- Browser tab `tab_1_6f94ae41-270e-4168-b9a1-6e0f9bbc9735` (Task5 giữ lại) và `tab_2_6f94ae41-270e-4168-b9a1-6e0f9bbc9735` (Task6 owner). Không đóng hoặc dùng tab đầu nếu chưa chuyển giao.
- Hai DB Safety/Baseline giữ nguyên theo `VALIDATION.md`; không drop/reset/EnsureDeleted.

## Route review

Root thực hiện fresh independent whole-branch review từ inventory đóng băng và xem riêng file Task6, tập trung vào strict direct-SQL adapter, production send fail-closed và phân biệt v2 settlement synthetic với legacy tooling Deferred. Nếu review sửa gì thì chạy lại gate liên quan. Không suy ra release từ evidence local.

I1 R1 cô lập harness đã sửa trong snapshot mới: Playwright mặc định ignore spec runtime thật; chạy runtime riêng cần `FAH_HISTORY_RUNTIME_OPT_IN=1`, config riêng và origin owned3305. `--list` an toàn khi thiếu fixture; không bật execution opt-in chỉ để discovery. Giữ evidence runtime, không lặp grant/generation. Chờ fresh scoped R2 review.

## Nghiệm thu cuối của root — 2026-11-06

Task6 R2 và review độc lập toàn nhánh riêng PASS cho phạm vi local đã duyệt; không có Critical/Important mới. Xem `artifacts/reports/fah-history-001/final-review.md`. Giữ worktree/nhánh và toàn bộ code/bằng chứng chưa commit; chưa chọn tích hợp/release/dọn. Gửi production vẫn Blocked bởi cổng receipt/reconciliation thật. Root cuối xác nhận393 .NET pass/49opt-in skip và13 Node focused pass; SQL sở hữu bắt buộc thực56+2+1 được giữ. API14444/web9668 giữ như hồ sơ; xác minh quyền sở hữu chính xác trước dùng/dừng.
