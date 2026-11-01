# FAH-ERR-001 — Runtime coverage sau các sửa bổ sung

Runner `/root/runtime_resume`, `gpt-6.1-sol/high`, không agent con. Bảng này dẫn tới bằng chứng thực chạy; không thay independent review hoặc kết luận Done của root. Các số đếm trùng ca giữa suite không cộng thành tổng ca duy nhất.

| ID | Bằng chứng đã xác minh | Giới hạn |
| --- | --- | --- |
| 001 | C browser5; actual Program login401/refresh200/JWT profile200; final auth callback Node27 và browser3 sau restart giữ typed401/409 guidance | Login Google thật không chạy, callback token synthetic. |
| 002 | C Node15 trước đó; actual MVC missing login fields400, rule/package400 trong API25 | Metadata UI được kiểm bằng fixture; API không có envelope mới. |
| 003 | C browser5/Node15; E55 callback; F23; core auth callback final3 không render/log private body và không suy identity từ arbitrary message | Không gọi provider trả body thật. |
| 004 | C blob/auth Node; actual API User403/Admin blob200, owner200/other404, bytes/headers chính xác | Download provider Google/SPSS thật không chạy. |
| 005 | G boundary63/related87; actual invalid host/empty analyze400 và SQL2 FailedUsage/CreditsUsed0; D usage browser | Không phân tích form Google thật. |
| 006 | G boundary63 và PayOS regression trong backend291 | Stub outbound; không thanh toán/PayOS thật. |
| 007 | A14+related36; SQL9 submission job/count/zero-credit FailedUsage | SQL harness có lỗi mạng/hủy/lỗi save; paused/cancelled business states kiểm bằng unit suite. |
| 008 | SQL9: transport sau success, cancellation, initial/final save fault, collect throw/cancel, remote-create rồi questions false/throw/import null; context độc lập theo ID riêng | Không outer transaction, không schema, không Google thật; fixtures giữ nguyên. |
| 009 | AI48 và backend291 kiểm logger marker với fake provider | Không paid AI/provider logging thật. |
| 010 | G63+87; E55 callback400/409, auth Google/JWT fixture; postrestart callback2 qua | OAuth/provider thật không chạy. |
| 011 | AI48; D browser reason/runID và usage ID thuộc10 ca qua trong D13; AI SQL6 actual controller response/history safe cause/runIDs và persisted failed run/usage/zero debit | Direct controller serialization, không HTTP host với fake adapter; không AI có phí. |
| 012 | G63+87; actual HTTP rule invalid mode/JSON400, SQL không AnswerRule mới | Không thay validation contract. |
| 013 | Actual Admin create/update package400; User403/Admin200; SQL package giữ nguyên | Không tạo gói qua API; chỉ fixture clone riêng. |
| 014 | D13 có10 passed gồm failed/absent/pending prompt profile; Node8 | API browser bị intercept. |
| 015 | D continuation giữ run/count/cost/balance/IDs trong10 pass; Ffix Node22/F23+admin5=28 pass, postrestart approval pass; AI SQL success→continuation exact persisted IDs/debit/balance và limited partial | Không payment thật; số POST và GET retry kiểm trong fixture, SQL dùng service không browser→API end-to-end. |
| 016 | F23 HTTP503/transport khác404; actual order owner200/other404 | Browser503 dùng fixture. |
| 017 | E mới4 pass; E55 snapshot/delete/race/guards qua | Không dữ liệu nghiên cứu người dùng thật. |
| 018 | C5/E55 NCKH typed400/409, postrestart2; core auth callback Node3 typedhttp+POST+exactpath401/409/other và postrestart browser3 | Không suy luận chủ tài khoản/nguyên nhân raw; xem `auth-callback-final/REPORT.md`. |
| 019 | D reason/usage; E55 labels/callback; F23 provider/local-check/payment-return; H thông báo giới hạn | Các chuỗi chỉ kiểm trên đường dẫn có trong suite. |
| 020 | H Node42 pass sau RED39/3; actual3 ESM entrypoints final đều exit0 với web đã restart và mock API3138 | Cold attempt root admin từng fail final-health không có diagnostic; giữ nguyên evidence. Lần instrumented kế tiếp pass chỉ thấy canceled WOFF2. Không suy diễn nguyên nhân cold failure. |
| 021 | E mới4/E55 unknown/list/snapshot; F23 unknown profile/security/admin search; postrestart profile pass | Mock browser không thay API/SQL persistence. |
| 022 | F23 clipboard absent/reject/success, keyboard/repeat/manual fallback | Không đọc clipboard người dùng. |
| 023 | D13 có10 pass gồm unknown và ordinary/null/sensitive mixed4/1/3, ID/reason/counts và resend guard | Kết quả gửi hoàn toàn synthetic. |
| 024 | D fixture-r1 targeted3 pass sau locator fix; Node8; backend validation trong291 | Không gọi submission/provider. D13 ban đầu10pass3fail, không gọi đây là một full13 GREEN run. |

Các suite SQL migration6 vẫn Skipped khi full backend chạy; SQL9 durability và AI SQL6 không thay sáu kiểm tra schema đó. Build web lần đầu Failed ở TypeScript NCKH, build-r2 Verified exit0 và affected browser4pass sau restart. Xem `FINAL_VERIFICATION.md`.
