# FAH-DIRECT-001 — Sửa copy cho luồng quy tắc trực tiếp

Ngày: 2026-11-02. Trạng thái: `Verified` trong phạm vi copy frontend và runtime trình duyệt dùng API mock của task. Báo cáo này không tuyên bố đã commit, tích hợp, triển khai, phát hành, gửi Google thật hoặc gọi AI trả phí.

## Tóm tắt và phạm vi

- Nguyên nhân gốc: hành vi của luồng Rules đã chuyển sang tạo và gửi trực tiếp, nhưng toast sau phân tích, metadata luồng và helper text của editor quy tắc vẫn mô tả bước xem trước và xác nhận.
- Rules nay hiển thị **Cài đặt → Tạo và gửi ngay** và hướng dẫn người dùng kiểm tra cách trả lời trước khi tạo và gửi.
- AI Option 2/3 vẫn hiển thị **Cài đặt → Xem trước → Xác nhận** và giữ nguyên hành vi xem trước/xác nhận.
- Không thay đổi API, DTO, backend, database, credit, submission, state machine, dependency, bố cục hoặc hành vi.

## File và hash đóng băng

| File | SHA-256 |
| --- | --- |
| `apps/web/app/dashboard/forms/page.tsx` | `5B6ADDF23E30BF3F32880D7C09E8652B9391BE528C86DAACC65265D5FC8B5CB3` |
| `apps/web/app/dashboard/forms/_components/RuleEditor.tsx` | `0AE4E80AEC4A479602CD2B8262513052CBDD07CC01B49B907333ECABF2695115` |
| `apps/web/tests/direct-rule-submission.spec.ts` | `32FB42555903C41F1A95B231D3313FC6274773F277DDC2FC4AEC2AB05218FD8E` |
| `artifacts/reports/direct-rules-copy-fix-20261102/harness/capture-copy.mjs` | `9E1854F27DE3E6E2947841373E1960D89D977EB825D6D44D869735B8E97F40EC` |
| `artifacts/reports/direct-rules-copy-fix-20261102/browser-evidence.json` | `C00D3E15A3A79F0224614D0F01E1490F877C1EEE020400855BE4AED97E431BC2` |

Ledger agent: writer `gpt-5.6-sol`, reasoning `medium`; không có agent con lồng nhau và không dùng Astra.

## Validation đã thực hiện

- `RED`: `npx playwright test tests/direct-rule-submission.spec.ts --grep "rules uses one direct action" --reporter=line` — 1 test fail vì toast Rules chưa có `trước khi tạo và gửi`.
- `GREEN`: `npx playwright test tests/direct-rule-submission.spec.ts --grep "rules uses one direct action|AI Option" --reporter=line` — 3/3 pass, bao phủ Rules và nhãn AI Option2/Option3.
- `Verified`: `npx playwright test tests/direct-rule-submission.spec.ts tests/fah-err-forms-errors.spec.ts tests/form-automation.spec.ts --reporter=line` — 35/35 pass.
- `Verified`: `npm run lint` — exit 0; chỉ còn hai warning `react-hooks/exhaustive-deps` có sẵn ở các account panel.
- `Verified`: `npm run build` — exit 0; color check, compile, type check và 33 trang tĩnh hoàn tất; vẫn chỉ có hai warning ngoài phạm vi nêu trên.
- `Verified`: Impeccable detector trên hai UI target đã đổi trả về `[]`.
- `Verified`: `git diff --check` trên ba file source/test — exit 0.

## Runtime trình duyệt mới

Production build được phục vụ bởi process Next do task sở hữu tại `http://127.0.0.1:3021`. Trình duyệt dùng session local tổng hợp và response mock cho `/api/**`; không gọi Google, AI trả phí, backend hoặc database.

- Nhãn Rules và toast sau phân tích hiển thị đúng; kết quả gửi trực tiếp của Rules render thành công.
- AI mặc định giữ nhãn xem trước/xác nhận.
- Ghi nhận 32 Next static chunk, tất cả HTTP 200.
- Số lỗi `pageerror`/console của trình duyệt: 0.
- Số listener còn lại trên cổng 3021 sau khi dừng process: 0.

Ảnh chụp:

| Artifact | SHA-256 |
| --- | --- |
| `artifacts/reports/direct-rules-copy-fix-20261102/screenshots/rules-copy-mobile.png` | `62CDDE0B178EEE979BA95F69FE2DD66CF41F6DE14C508415DBDD36294683DEC3` |
| `artifacts/reports/direct-rules-copy-fix-20261102/screenshots/rules-result-mobile.png` | `D164E2A2E34BD483D7498229FD2FF1B3CCD1E732DB6145C7146E9333B65A2EA3` |
| `artifacts/reports/direct-rules-copy-fix-20261102/screenshots/ai-copy-mobile.png` | `C1BE6997C7C76D26A688F685218BE5676D2FFA008D8770D1113DE11DEE4CB04F` |

## Validation chưa thực hiện và bước tiếp theo

- `Not run`: backend test, runtime API/SQL, Google thật, AI trả phí, deploy, commit, push, tích hợp hoặc phát hành. Contract/source backend không đổi; bằng chứng backend đã lưu trước đó vẫn là lớp bằng chứng riêng.
- Cần review đóng task độc lập trước khi root cập nhật `INDEX.md`/`CLOSEOUT.md` hoặc quyết định đóng task.
