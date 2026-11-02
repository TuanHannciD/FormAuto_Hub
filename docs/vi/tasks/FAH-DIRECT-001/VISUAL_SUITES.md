# FAH-DIRECT-001 - Bằng chứng visual suites

Ngày: 2026-11-02 08:13 +07. Trạng thái: `Verified` cho artifacts local được giữ lại; lượt kiểm chứng này không sửa source/test.

## Phạm vi

Bằng chứng ba flow gồm direct rules, lỗi/khôi phục và form automation. Các nhóm contract được rà là validation/credit, replay, concurrency, rollback, cancel, unknown-result fence và xác nhận AI. Gửi Google thật, gọi AI có phí, deploy và rebuild `.next` nằm ngoài phạm vi.

## Kết quả

| Suite | Kết quả | Số lượng | Artifact |
|---|---|---:|---|
| Backend full solution | `Verified` | 335 pass / 0 fail / 6 skip; 341 phát hiện | `artifacts/reports/direct-rules-visual-20261102/suites/backend-full.trx` |
| Backend direct service | `Verified` | 24 pass / 0 fail | Nằm trong TRX |
| Backend direct SQL | `Verified` | 20 pass / 0 fail | Nằm trong TRX; DB opt-in chính xác |
| Playwright combined | `Verified` | 35 expected / 35 pass / 0 unexpected / 0 skip | `artifacts/reports/direct-rules-visual-20261102/suites/playwright-combined.json` |

Sáu skip backend là các case normalization hiện có của `TopupEvidenceSqlServerTests`, không thuộc direct-rule. TRX hoàn chỉnh: namespace XML là `http://microsoft.com/schemas/VisualStudio/TeamTest/2010`, `ResultSummary` là `Completed`, và có 341 node `UnitTestResult`.

Phân nhóm direct-test theo tên (các nhóm có thể chồng lấn, không cộng thành tổng): validation/credit 44, replay 8, concurrency 5, rollback 10, cancel 7, unknown-result fence 1, AI/common confirmation 22. Các số đã tính cả dòng parameterized; đây chỉ là tóm tắt điều hướng, không tạo contract mới.

## Phân rã Playwright

- `direct-rule-submission.spec.ts`: 17/17.
- `fah-err-forms-errors.spec.ts`: 13/13.
- `form-automation.spec.ts`: 5/5.
- Direct flow giữ một action không preview/checkbox; unknown transport và 400 recovery dùng lại cùng command; AI Option 2/3 vẫn có preview và confirmation.

## Lệnh và môi trường

- Artifact backend tương ứng `dotnet test FormAutoHub.sln -c Release`; TRX không chứa command line gốc. Bắt đầu `2026-11-02T08:12:34.5892184+07:00`, kết thúc `2026-11-02T08:12:44.0437002+07:00`, cwd `D:\TinHoc\FormAuto_Hub`.
- Artifact Playwright là lượt chạy harness combined local; JSON ghi start `2026-11-02T01:11:39.467Z`, duration `29365.958 ms` (08:11:39.467 +07, khoảng 29 giây). JSON không chứa command wrapper gốc. Không chạy lại.
- Identity SQL của evidence backend là `FORMAUTO_DIRECT_SQL_SERVER=.` và `FORMAUTO_DIRECT_SQL_DATABASE=FormAutoHub_DirectRule_Safety_20261101`; không chạm DB ứng dụng.

## Hash

- `backend-full.trx`: `A7AEC710ED138068B45377EB88EBB71E90E2721368B1A09CE775FB1C61C00B62`.
- `playwright-combined.json`: `4300FCF89C6143C1E8CDA70CA539D6501FA91CCEA69D12B8CE727F8A75E7B922`.
- `playwright-combined.junit.xml`: `BAB1415CAC2382DF32CB72174C51CB51D0D1672376266BEBCCA25DCB6E6882BB`.

## Giới hạn

Không gọi Google thật hoặc AI provider có phí. Không acquire process runtime, không build `.next`, không ghi đè artifacts hiện có. Sáu case normalization vẫn là `Not run`, không nâng thành pass.
