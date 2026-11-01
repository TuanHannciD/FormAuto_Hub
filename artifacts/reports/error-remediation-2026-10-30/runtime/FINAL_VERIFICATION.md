# FAH-ERR-001 — Final runtime wave

## Latest auth callback follow-up — supersedes final snapshot/config checkpoint below

Final independent review tìm thêm core auth callback substring consumer. Sau scoped typed-source fix: Node27/27 (callback3+C15+auth9), fresh lint/build exit0, postrestart firstbrowser10=7pass3strictfixturefail rồi callback fixture-r1 targeted3/3pass. Source `4F4058CC...`, browser fixture `DC210339...`. [Exact follow-up report](auth-callback-final/REPORT.md) giữ RED/failure/provenance/limits. Final manifest bây giờ343files SHA256 `7183A21734FE3094A8AA040A56CA10274D285F2E1A6B8A16FC816E4F952D9FA0`, excludes active docs/generated configs. All owned processes released/portsfree/T3list[]. Hai generated configs được restore exact initial371 bytes: tsconfig5BB0AC... CRLF và next-envF4E897... `.next` reference; earlier C706 là later LF checkpoint, không initial371 bytes. Không backend/source/SQL/provider delta, không repeat unchanged backend.

Owner `/root/runtime_resume`, actual `gpt-6.1-sol/high`, không delegation. Root giữ independent review và quyết định acceptance. Không commit/push/deploy, dependency install, paid provider, real payment/form submission, main DB DML hoặc schema.

## Kết quả đã có

| Kiểm tra | Kết quả | Artifact |
| --- | --- | --- |
| F Node sau receipt fix-r1 | Verified22/22,0skip; trước patch RED1 đúng assertion confirmed request ID | `account-approve-fix-r1-{red,green22}/test.log` |
| H Node | Verified42/42,0skip sau RED42=39pass3fontabortfail; JS/CSS abort, font404/reset vẫn critical | `legacy-fix-r1-{red42,green42}/test.log` |
| C/E/F browser đầu | C5/E4 Verified; F21pass2fail chỉ tổng GET tuyệt đối | `final-browser-cef/playwright.json` |
| D browser | D13=10pass3locatorfail; sau fix locator targeted ERR0243 + formURL regression1 đều Verified4/4 | `final-browser-d13/`, `final-browser-d-fixture-r1/` |
| Browser hồi quy ban đầu | 69pass14fail/83; evidence giữ nguyên, không gọi full83 GREEN | `final-browser-regressions/{playwright,failures}.json` |
| F/browser admin sau fix | Verified28/28 gồm F23+admin5; receipt4fields, GET-only retry, heading | `final-browser-f-fix-r1/playwright.json` |
| Reduced motion | Verified2/2 ca gốc+profile sau thêm scoped CSS; không giảm assertion | `final-browser-f-motion/`; nguyên nhân trước sửa: `account-motion-diagnostic.json` |
| NCKH hiện hữu | Verified55/55 gồm delete final-check, typed callback400/409, canvas exact relation payload và export | `final-browser-nckh-fixture-r1/playwright.json` |
| Sau restart web | Verified5/5 motion/profile/approval/callback400/409 | `final-browser-post-restart/playwright.json` |
| H actual ESM | Final3/3 entrypoints exit0, fresh browser được helper đóng, mock API chỉ login POST/read GET | `legacy-esm-final/results.json`, `legacy-esm-http.jsonl` |
| Backend Release | Verified build exit0,3 baseline NU1603 warnings; test297=291pass0fail6SQLmigrationSkipped | `final-backend/{build,test}.log`, `all-tests.trx` |
| SQL durability | Verified9/9 trên exact accepted cloneid8, pending0/modelPendingfalse, fresh contexts theo per-run IDs | `sql-durability-harness/verification.json`, `progress.json`, `fresh-guard.json` |
| Actual Program | Verified25HTTP + independent SQL: real User/Admin login, JWT/refresh, MVC400/auth401/role403/privacy404/blob200, invalid package/rules/analyze400 | `sql-durability-harness/api-verification.json`, `api-identity.json`, `api-bounded.log` |
| Web lint | Verified exit0;2 warnings ref cleanup profile39/security80, chưa gọi warnings baseline | `final-web/lint.log` |
| Web build | Failed lần đầu TS nckh/page.tsx289 narrowedtrue so false; sửa đúng nhánh không thể tới, lần2 Verified exit0, typecheck/prerender/routes đầy đủ | `final-web/build.log`, `build-r2.log`, `build-r2-result.json` |
| NCKH sau buildfix/restart | Verified4/4 unknown list/read retry, unlinked guidance, linked import và linked table | `final-browser-e-build-r2/playwright.json` |
| AI/credit SQL bổ sung | Verified6 executions/5 scenarios: success→continuation, limited partial, malformed, timeout, invalid output; actual services/controller DTO, ledger/history đọc context độc lập | `sql-durability-harness/ai-sql-verification.json` |

H initial actual third entrypoint Failed do WOFF2 net::ERR_ABORTED đã được xác định bằng instrumented actual ESM. Fix chỉ bỏ qua font cancellation đúng loại; HTTPfont404/reset và JS/CSS cancellation vẫn fail trong42tests. Một cold root-admin attempt sau restart còn Failed final-health mà không có diagnostic gắn tại lần đó; evidence giữ ở `legacy-esm-green`. Instrumented root sau đó pass, chỉ canceled fonts, rồi cả3 originalentrypoints chạy tuần tự đều pass. Không quy nguyên nhân cold attempt khi chưa có bằng chứng.

SQL harness đầu tiên dừng trước writes vì DB_ID trả Int16; runtime-only cast được sửa và failure giữ ở `guard-first-failure.json`/`guard-first-run.log`. GREEN9 và API25 là lần chạy sau, không xóa dấu vết RED. Harness không gọi Migrate/EnsureCreated/Delete/schema. Actual Program có Migrate startup; fresh guard pending0 ngay trước start chứng minh no-op được duyệt. Clone fixtures synthetic được giữ nguyên; main không được kết nối để ghi. Secrets/signing/password/token chỉ ở memory, artifact không chứa credentials. API bounded log có HTTPS-port warning ở loopbackHTTP và safe AnalysisException metadata, không body/token.

## Ownership, source và release

- `final-verification-source-manifest.json` và result là checkpoint source/test341files sau buildfix. `final-writer-manifest-checks.json` xác nhận10 latest writer hashes; buildfix hash có trong `nckh-ui/fix-build/hashes.json`. Baseline→current drift đúng4 production sửa được duyệt: profile motion, manual receipt, callback typed mapper và NCKH dead branch; backend không drift.
- Actual API childPID22008 được dừng sau request, exited và5248free trong `sql-durability-harness/api-release.json`. Web restart chain25672→18612→22124 và mock API28520 được kiểm lại commandline/parent trước stop; `final-owned-process-release.json` ghi không listener3137/3138/5248. T3 statusfalse/list[] khi release; tab cũ không còn tồn tại, không claim runner đã close một tab absent.
- Next-generated tsconfig archive/diff giữ nguyên. Semantic guard so mọi key và include như tập hợp, trừ duy nhất owned dist include, rồi restore exact baseline SHA256 `C706793C44F83261B467440674BD653490054A9F1CA653E4FB407AC8FE09DC00`; proof `tsconfig-restoration-final.json`. Old `.next`, own freshdist, logs/DB/fixtures đều giữ, không cleanup.
- Sau buildfix, web được khởi động lại chain3004→5540→26864 để chạy4ca cuối, rồi kiểm lại commandline/parent và stop. `e-build-r2-release.json` xác nhận không listener3137/3138/5248; `tsconfig-restoration-e-build-r2.json` phục hồi cùng exact baseline hash. T3 list[] ở lần release cuối.
- [Coverage24](per-id-runtime-coverage.md) phân biệt source/unit/mock browser/directSQL/actualProgram. Không cộng số suite overlapping thành unique total.

AI SQL bổ sung dùng actual AiGenerationService, CreditService, AiResponsesController và AiAnalyticsController với fake adapter/secret protector trong harness riêng. Synthetic provider row có ID riêng và không sửa cấu hình đã có; tất cả credit được tạo/trừ qua CreditService, không gán trực tiếp balance. Fresh context đối chiếu run/count/status, UsageLogs, đúng một debit cho mỗi run thành công, balance/TotalUsed, preview IDs không trùng khi continuation và serialized safe error/history DTO. Đây là direct controller result/serialization, không HTTP host với fake provider. Fake raw marker chỉ xuất hiện ở raw persistence theo contract hiện hữu; không có trong response/history DTO artifacts. Own fixture rows giữ nguyên.

## Còn lại

Independent review final source/snapshot do root điều phối. Sáu SQL schema tests Skipped; real Google/OAuth/paidAI/PayOS/payment/submission/deployment Not run và ngoài phạm vi. Các kiểm tra này không được suy thành pass từ disclosure. Chưa kết luận toàn bộ24 Done.
