# Auth callback final follow-up — runtime

Owner `/root/runtime_resume`, `gpt-6.1-sol/high`, không agent con. Root-authorized final independent review phát hiện ERR001/003/018 còn caller `/auth/callback?id_token=...` dò409/401/password trong message đã được shared client làm an toàn. Tác giả sửa một production file theo typed ApiError http+POST+exact `/api/auth/google`, giữ guidance401/409 và generic fallback khác. Runtime không sửa production.

| Check | Actual result | Evidence |
| --- | --- | --- |
| First Node fixture | Failed3 trước assertions, VM thiếu exports; không valid RED | `red/test.log` |
| Corrected RED |3 executed/3 assertion fail/0skip, production trước fix hash3929CDE... ổn định | `red-r2/test.log`, `red-snapshot.json` |
| GREEN Node |27/27 pass/0skip: callback3+C shared15+auth9 | `green/node.log` |
| Fresh lint | exit0,2 existing-in-current-wave ref-cleanup warnings profile39/security80 | `green/lint.log`, `lint-result.json` |
| Fresh full web build | exit0; compiled,typecheck,prerender/routes hoàn tất sau sourcefix | `green/build.log`, `build-result.json` |
| Owned web restart + browser first |10 executed: C5+authsession2 pass; callback3 strict alert fixture fail app+empty Next announcer trước downstream assertions | `../auth-callback-final-browser/playwright.json`, `browser-first-classification.json` |
| Callback browser fixture-r1 |3/3 pass, exact app alert409/401/503; đúng POST caller/synthetic token, back-to-login link, no storedsession/privatebody log/pageerror/chunkfailure | `../auth-callback-final-browser-r2/playwright.json` |
| Source/writer freeze | source4F4058CC...; Node60A393...; browserDC210339...;3manifest hashes match | `writer-hash-checks.json` |

Không live Google/OAuth/provider call; `id_token` chỉ là chuỗi synthetic. Browser intercept `/api/auth/google`; actual MVC/JWT/SQL bằng chứng trước vẫn là phạm vi riêng. Backend source unchanged nên không rerun291/SQL9/API25/AI6. Build không được gọi pass từ Node; fresh build exit0 lưu riêng ở đây. Không cộng overlapping tests thành unique total.

Release: commandline+parent identities19436→11384→5520 được đọc/check ngay trước stop; `release.json` ghi không listener3137/3138/5248. T3 list[]; không acquire/close tab khác. Browser helper contexts được Playwright đóng. Caches `.next` và own freshdist giữ nguyên, không cleanup.

Reviewer xác định hai generated config deltas ngoài owned source. Provenance đã chốt bằng exact initial371hash trong `runtime/baseline-source.json`: tsconfig5BB0AC... là CRLF626bytes, nội dung giống laterC706...LF599bytes; next-envF4E897... dùng `.next/types/routes.d.ts`, current generated dùng owned freshdist. `generated-config-restoration-plan.json`/archives giữ bằng chứng; semantic guard so mọi key và include-set trừ đúng own include, candidate hash phải trùng initial371 trước write. Sau stop đã restore exact initial bytes: tsconfig `5BB0AC200C1934A273D74E52785F4C36FA62C082D766CAB15CDC8484FF39BF15`, next-env `F4E8976C19FC926644D72610BF1058BD6BF52ADD97E46A02BC0B912A751625C0`. `generated-config-restoration.json` xác minh; git diff hai file rỗng. Các proof C706 trước đây chính xác cho later pre-wave LF checkpoint, không phải initial371 bytes; thông tin này thay thế diễn giải baseline ban đầu.

Authoritative final source/test/helper manifest343files: `../final-verification-source-manifest.json`, SHA256 `7183A21734FE3094A8AA040A56CA10274D285F2E1A6B8A16FC816E4F952D9FA0`. Inventory = earlier341+two new callback tests; existing callback source đã nằm trong341. Excludes active docs và generated configs, có config proof riêng. Earlier341 manifest giữ tại `manifest-before-auth-fix-341.json`; không đổi inventory baseline371/DB-sync preservation evidence. Final independent review/acceptance do root, chưa claim all24 Done/release.
