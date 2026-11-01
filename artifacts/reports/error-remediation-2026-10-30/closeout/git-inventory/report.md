# FAH-ERR-001 — Git inventory và packet tích hợp

Ngày 2026-10-30. Owner `/root/closeout_git_inventory`; root xác minh catalog và dispatch explicit `gpt-6.1-sol/high`, không agent con. Skills áp dụng: finishing-a-development-branch và verification-before-completion; project override và quyền session quyết định Git/deploy, không dùng menu/cleanup của upstream để vượt quyền.

## Summary

**Verified:** snapshot local review có thể tích hợp bằng exact allowlists. ERR80, DB-sync17 và runner343 được rehash độc lập, mỗi nhóm 0 mismatch. Chưa có Git/index/ref mutation hoặc deploy. Root chọn stacked draft PR để diff không kéo bốn prerequisite commit workflow/UI vào phạm vi ERR. [Kế hoạch paired](../../../../../docs/ai/tasks/FAH-ERR-001/INTEGRATION_PLAN.md) ghi quyền, nhóm commit và đường đi cụ thể.

## Git và rủi ro workflow

- Cwd `D:/TinHoc/FormAuto_Hub`, normal repo `.git == common .git`; nhánh `ui/compact-refinement-20261028`, HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a`, không upstream. Index rỗng tại capture; inventory JSON lưu exact trạng thái, không lấy tổng dirty count làm implementation delta.
- Remote sanitized: origin `github.com/TuanHannciD/FormAuto_Hub.git`, không embedded credentials. Read-only `git ls-remote` xác nhận main `8a4f18ee77453857c550ff7be0279c5cc9e415f1`; remote docs baseline `be3c65b`; chưa có current UI branch. Không fetch hoặc sửa refs.
- Merge-base main..HEAD đúng `8a4f18e`; bốn prerequisite commit là `be3c65b`, `0698ecc`, `606de1e`, `a19f7a2`. Commit đầu bao gồm workflow/skills/docs khoảng669files; UI commit53files. PR thẳng main sẽ mang cả phạm vi đó, nên root chọn base review snapshot.
- CI: PR target main hoặc push main. Deploy: workflow_run sau CI success/original push/head_branch main hoặc manual workflow_dispatch; release build/push GHCR rồi production SSH chạy script. `scripts/deploy-production.sh` fetch main, đổi compose, pull/up containers và health checks. Push/merge main có thể deploy tự động; không làm trong closeout. Environment protection thực tế chưa được kiểm; không giả định tên production là approval gate.
- Chỉ push ref mới `review/fah-err-baseline-a19f7a2`→a19 và `fix/fah-err-001-closeout-20261030`→selected commits; draft PR head→review base. CI tự động **Not run** vì target không main; không thay YAML. Không merge, force-push, main mutation, workflow dispatch hoặc SSH.

## Files changed / exact allowlists

Agent này chỉ viết paired INTEGRATION_PLAN và thư mục packet này. Mọi source/runtime/DB được đọc, không sửa. Docs deploy do writer khác sở hữu và được inventory sau khi xuất hiện.

| Allowlist | Count | Ý nghĩa |
| --- | ---: | --- |
| `allowlist-db-source.txt` | 17 | Baseline DB-sync đã có trước ERR: probe9, migration2, tests/csproj6 |
| `allowlist-err-source.txt` | 80 |52product+22tests+2paired contractdocs+4tooling; không giao DB17 |
| `allowlist-db-docs.txt` | 4 | Hai cặp INDEX/VALIDATION DB-sync |
| `allowlist-err-docs.txt` | 30 | Toàn dossier actual15cặp, gồm audit history, runtime, integration và self-deploy handoff |
| `allowlist-portable-evidence.txt` | 162 | Recursive Markdown artifact refs + selected final verdict/build/test/browser/SQL/hash summaries và reviewer-requested detailed proof |
| `allowlist-packet.txt` | Xem file | Exact packet paths sau freeze; không glob/broad add |

97 source paths không phải97 file mới; tracked/untracked và hash manifest phân biệt rõ. Historical12docs/371baseline/343runner/80ownership khác universe; không trộn mẫu số. Fresh hash của tsconfig và next-env khớp exact original371 baseline. Current tracked dirty source được phân loại hết trong ERR80 hoặc DB17; generated `.next-fah-err-browser2-20261030` cache143path giữ ngoài publish.

`tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj` có ProjectReference mới tới DB probe; solution CI cần csproj/probe implementation/catalog resource, không thể publish csproj đơn lẻ. Migration/source DB-sync giữ commit riêng, không bị coi là ERR schema change. API startup có Database.Migrate; production migration apply là bước riêng của người tự deploy, dưới backup/preflight/guard, không được suy từ local acceptance.

## Scope alignment / commit grouping

1. DB source17: `fix(db): normalize topup evidence schema with guarded compatibility checks`.
2. ERR source80: `fix: preserve safe error context and confirmed operation results`.
3. Paired task docs34: `docs: record reviewed error remediation and integration handoff`.
4. Portable evidence162 + frozen packet exact: `test: archive scoped remediation verification evidence`.

Thứ tự groups làm dependency rõ; final PR snapshot chứa tất cả local Markdown link targets cần cho dossier. Khi agent writer khác sửa docs/closeout review report, refresh allowlists/manifests trước staging và final check. Không giữ old hash của docs đang viết làm khóa giả. Original branch pointer/worktree DB/backup/cache/evidence không bị dời/xóa.

## Portable evidence và confidentiality

Portable162 tổng3,143,033bytes tại capture:117file là recursive Markdown artifact-link closure;37 selected final outcome/source-review summaries;8file reviewer yêu cầu thêm gồm final backend TRX, callback node/lint/build logs và SQL harness3cs+csproj. Tất cả Markdown artifact references từ paired task docs và selected reports hiện 0 missing. Log ignored chỉ force-add exact allowlist path sau review. Exact closeout metadata bổ sung nằm ở allowlist-closeout-metadata.txt; hai source patch trùng source được giữ local ngoài publish packet theo root instruction.

Đây là curated evidence, không toàn bộ runtime archive hoặc reproducible environment. Backtick/prose paths trong report không được tự coi là link bắt buộc đưa Git; không đưa mọi failed trace/PNG/ZIP/DLL, NuGet config, raw provider payload hay DB fixture dump. Full local evidence, failed histories và ignored artifacts giữ nguyên. Một số báo cáo có SHA/path tới file local không publish; đó là provenance/giới hạn, không hứa file có trong PR.

Secret-pattern screen exact publish candidates kiểm private keys, GitHub/OpenAI tokens, JWT, credential URLs và SQL password literals; không in matched values. Ba path hits đã đọc và phân loại: hai SELF_DEPLOY_HANDOFF chỉ chứa environment-variable/password prompt, ApiSmoke.cs dùng RandomNumberGenerator tạo runtime synthetic password, không literal credential. JSON field-name semantic screen không tìm token/password/cookie/authorization/clientSecret/apiKey/connectionString scalar khả nghi trong portable candidates. Pattern/field screening không phải chứng nhận tuyệt đối không có dữ liệu nhạy cảm; independent reviewer kiểm curated scope/redaction trước GO.

Excluded mặc định: appsettings.Development/env files, secrets, raw cookies/tokens/passwords, .next/node_modules/bin/obj, ZIP/PNG/DLL/PDB/BAK/BACPAC, ignored logs ngoài exact list, unrelated audit/runtime evidence ngoài portable list và mọi path không có allowlist. Không cleanup bất kỳ file excluded nào.

## Validation performed

- **Verified:** read-only Git status/index/branch/refs/history/worktrees; sanitized remote URL và ls-remote; actual workflow/deploy script/dependency reads. Cả inventory command và packet builder exit0. `inventory.json`, `workflow-manifest.json`, `status-inventory.json` ghi target/ownership/paths.
- **Verified:** `verification.json`: fresh ERR80/DB17/runner343 đều0mismatch; original generated-config hashes khớp baseline; recursive Markdown local artifact links0missing. `manifest-*.json` ghi exact bytes/SHA256; `db-source.patch`/`err-source.patch` gồm tracked diffs và textual new files so HEAD.
- **Verified screen, có giới hạn:** `secret-pattern-scan.json` + `secret-screen-disposition.json`;3path false positives được phân loại như trên; không đưa raw matched values vào packet.
- Accepted local test/runtime gates được đọc từ final-overall-review và exact-hash artifacts:291pass/6SQLskip/0fail, SQL9, AI SQL6executions/5scenarios, actual Program25HTTP, callback Node27/build/lint/targeted browser3, broader split/failed-history limits giữ nguyên. Inventory không rerun hoặc nâng evidence level.

## Validation not performed / Risks / Deferred

**Not run:** test/build/browser/SQL reruns (không source drift, sole runtime owner đã có accepted evidence); Git mutations; remote protection/settings/current PR queries; server CI; release/deploy/live provider/payment/submission. Chưa có commit SHA mới hoặc PR URL trong packet này. Six skips/two lint warnings/NU1603/unexplained cold health failure vẫn là giới hạn đúng như final validation.

**Next recommended step:** independent reviewer chấp nhận packet; freeze/refresh exact docs/closeout manifests; root GO cho scoped commits và hai new-ref pushes/stacked draft PR. Quyền mới của user đã được root phân xử, không cần hỏi lặp. Nếu staged path/hash lệch allowlist, remote ref đã tồn tại khác SHA, hoặc YAML thay đổi, dừng mutation và điều tra. Main integration/deployment do người dùng quyết định riêng theo handoff; không claim integration/release tại snapshot inventory.
