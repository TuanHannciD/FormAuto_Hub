# FAH-ERR-001 — Đánh giá lại và đưa toàn bộ stack vào main

Ngày kiểm: 2026-11-01 UTC/ICT. Owner `/root/main_merge_audit`, actual `gpt-6.1-sol/high`, không agent con; root điều phối `gpt-6.1-sol/medium`. Quyền mới của người dùng: đánh giá lại, nếu ổn thì merge vào main để người dùng tự deploy. Tài liệu này ghi Git facts và đường tích hợp; không tự kết luận source/runtime gates đã pass hoặc production đã được triển khai.

## Finding mới trong review prerequisite — canonical LF fix

[Independent P2](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/review/package-p2.md) xác nhận `formauto-server-debugger/agents/openai.yaml` source Git blob232bytes LF (`10cdfc20…`) khác mirror236bytes CRLF (`48529b56…`). `.gitattributes -text` giữ mismatch khi checkout sạch; valid RED dùng đúng checker báo mirror drift1. Local raw trước fix đều CRLF nên chỉ nhìn worktree có thể bỏ sót. Ba ignored Python bytecode gây checker fail tại workspace là giới hạn local riêng, không phải tracked candidate defect; giữ nguyên cache.

Root cho phép fix nhỏ đúng hai path source/mirror. Writer ghi cả hai bằng canonical UTF-8/noBOM/LF đúng original source Git bytes, SHA256 `0f10c2f4f2c5b3ac18b5c5065abc0a15d014f512704d4ad59e89ab94654981af`; nội dung YAML không đổi. Actual tracked diff chỉ mirror vì source Git vốn canonical. [Before/after proof](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/git-audit/canonical-lf-after.json). Independent source-level fix accepted; runtime owner đã kiểm full clean Git export **RED exit1 mirror drift1 → canonical override GREEN exit0, 24skills/280pins/293mirrored/0synced**, giữ cache local nguyên trạng: [RED](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/runtime/skills-clean-before-result.json), [GREEN](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/runtime/skills-clean-after-result.json).

Root GO stage đúng mirror YAML và paired MAIN_MERGE_PLAN, rồi lấy independent staged review trước commit/feature-only push. Không stage generated `tsconfig.json`/`next-env.d.ts` do sole runtime owner đang dùng hoặc paired runtime report còn đang viết. Chưa commit/push fix ở checkpoint chuẩn bị này; actual SHA sau commit thuộc artifact hậu kiểm để tránh tự tham chiếu. Mọi ref/count dưới đây là immutable snapshot3893 trước fix, không gán CI cũ cho candidate mới. Sau commit mới cần refresh actual head và PR CI; không đổi vendor pin/behavior hoặc xóa cache để làm xanh.

## Snapshot và phạm vi đầy đủ

Đọc mới bằng Git/API, không suy từ closeout cũ:

| Ref / comparison | Trạng thái tại audit |
| --- | --- |
| `main` local/remote | `8a4f18ee77453857c550ff7be0279c5cc9e415f1`, chưa thay đổi |
| Feature | `fix/fah-err-001-closeout-20261030` tại `3893d0c660890c94f32ebb432c79373f6fe091f7` |
| Review baseline | `review/fah-err-baseline-a19f7a2` tại `a19f7a2f3dc1bc54ff645d662d94fc614439256a` |
| Main → feature | 0 behind / 10 ahead, merge-base chính là main, **1.024 net changed paths** |
| Main → baseline | Bốn prerequisite commit, **719 net paths** |
| Baseline → feature | Sáu commit, **321 net paths**; 321 đường dẫn PR2 API paginate khớp local chính xác |

Hai tập prerequisite719 và stack321 có giao nhau nên không cộng thành 1.040 path. Git là nguồn đếm đầy đủ; GitHub compare API chỉ trả 300 file đầu. [Exact allowlists, per-commit paths và API đã lọc](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/git-audit/sanitized-audit.json) giữ scope có thể kiểm tra. Tracked tree/index sạch trước audit; nhiều untracked/ignored artifact/cache/backup vẫn giữ nguyên. Không reset, clean, stash, thay pointer main hoặc tác động worktree DB-sync.

## Những commit bắt buộc đi cùng

| Commit | Phạm vi phải được review khi vào main |
| --- | --- |
| `be3c65baa79e55799e2b17a3a0b0edd7bc5cfa94` | Workflow agent, skill source/mirror và approved UI plan; 669 paths trong commit |
| `0698eccfa448103329f9790954d057b1f3083dc6` | UI compact refinement, tests, paired review docs; 53 paths |
| `606de1eccd9ac21fc91c5d8933d7b9bde8821623` | UI closeout/retained resources, sáu paths |
| `a19f7a2f3dc1bc54ff645d662d94fc614439256a` | Cleanup/shutdown checkpoint, sáu paths |
| `56447d0e37ea3abbd22126750e7b75007733d1de` | DB17: guarded normalization migration, compatibility probe, dependencies và tests |
| `ef44f871a4124befe8deb5c05b4c98b43f7036cb` | ERR80: 24 scoped findings, contracts, tests, tooling |
| `fc6a9036f4f8691a27acf6e6f139f59591f9c3ca` | Paired task dossiers34 |
| `50b92f850dcdc26604a91bbfdd96e0acec64acbe` | Curated evidence190 |
| `b3d66d0d845df610c5e8ddd1ea6c14d63d4010eb` | Git closeout status docs |
| `3893d0c660890c94f32ebb432c79373f6fe091f7` | Published snapshot/self-deploy status docs |

Existing ERR/DB reviews không thay thế review bốn prerequisite. [UI closeout](../FAH-UI-002/CLOSEOUT.md) đã nói rõ closure không bằng all-gates Done/visual acceptance; homepage follow-up vẫn Deferred. Không ngầm kích hoạt follow-up đó, đổi business rules hoặc cherry-pick làm mất prerequisite. `tests` csproj phụ thuộc probe project/catalog/source trong DB17; không tách riêng reference.

## PR và CI hiện tại

[PR2](https://github.com/TuanHannciD/FormAuto_Hub/pull/2) còn open/draft, head3893 → review-basea19; API mergeable=true/clean chỉ nói về base đó. Sáu commit/321files, zero head checks/workflow runs tại audit trước promotion. Giữ PR2 nguyên trạng để lưu diff stack.

Root GO đã tạo **[draft promotion PR3](https://github.com/TuanHannciD/FormAuto_Hub/pull/3)**, cùng feature head3893 → main8a, API xác nhận10commits/1024files; chưa merge. [Exact body và read-back](../../../../artifacts/reports/error-remediation-2026-10-30/main-merge/git-audit/promotion-pr-created.json). Mở PR target main khớp CI `pull_request`; draft không bị YAML loại. CI này build/test API, lint/build web và build containers; không bao gồm auth/Playwright/docs/SQL runtime gates. Root theo dõi CI bằng runtime workflow tool; audit agent không polling watcher.

Workflow deploy có thể được tạo ở sự kiện `workflow_run` của CI PR nhưng release job chỉ chạy nếu original event `push` + head_branch `main` + success; PR CI không thỏa guard. Manual dispatch vẫn là triển khai thật. Không dispatch để làm xanh kiểm thử.

## Rào chắn để người dùng tự deploy

Actual GET API: main `protected=false`, protection endpoint404, effective branch rules `[]`, repository rulesets `[]`. Environment `production` có `protection_rules=[]`, `deployment_branch_policy=null`, admins bypass=true. Deploy workflow **293903479 active**, CI **332328090 active**. Git blobs CI/deploy trên remote main khớp HEAD; raw worktree chỉ khác CRLF/LF. Không có thay đổi pipeline trong mười commit.

Audit lấy đủ15/15 deploy runs: tất cả completed, không queued/in_progress/waiting/pending/requested. Last success là SHA main8a ngày2026-10-09; đây là workflow history, không chứng minh health production hiện tại. Main CI success sẽ tự build/push GHCR rồi SSH production nếu deploy workflow còn active. Vì vậy không merge khi chưa có rào chắn đã xác minh.

Root đã phân xử quyền “merge để tôi deploy” bao phủ việc tạm dừng có thể đảo ngược **chỉ deploy workflow**, giữ CI bật; agent audit chưa thực hiện. Đường đề xuất trước main mutation, phải đợi root GO cụ thể:

1. Recheck exact main/head/PR3, CI/review verdict và enumerate đủ mọi deploy run; yêu cầu zero non-completed. Nếu có run active, dừng và để root xử lý quyền; disable không tự hủy run đã chạy.
2. `PUT /repos/TuanHannciD/FormAuto_Hub/actions/workflows/293903479/disable`, chỉ workflow deploy. Yêu cầu HTTP204 rồi GET state `disabled_manually`; GET CI vẫn `active`, recheck deploy runs vẫn zero active. Repo API permissions hiện admin/maintain/push=true; đây không chứng minh token có Actions-write. Chỉ actual successful mutation/read-back mới xác minh được quyền đó. Nếu403/404/failure hoặc state không đúng: **không merge**.
3. Giữ deploy disabled trước/suốt main merge và sau CI push-main hoàn tất; không auto-enable trong finally/cleanup hoặc khi CI còn pending. Không tắt toàn repo Actions, sửa YAML, environment protection hay cancel run ngầm.
4. Sau merge người dùng nhận full merged SHA và CI result. Workflow vẫn disabled để người dùng tự enable khi sẵn sàng rồi manual dispatch đúng full SHA reachable main theo [self-deploy handoff](SELF_DEPLOY_HANDOFF.md). Re-enable không phải một bước tự động của agent; mọi CI rerun push-main sau enable có thể lại thỏa guard deploy.

## Các gate trước merge

- Independent reviewer đọc full main8a..candidate3893 và evidence, gồm prerequisite/workflow/UI, DB migration safety, auth/credit/submission contracts. Existing acceptance/old reports là bằng chứng có ngày và bytes, không phải fresh full-stack verdict.
- Sole runtime owner chạy relevant fresh checks cho immutable candidate và ghi target/code hashes/process/DB/browser ownership. Không dùng server/DB chưa biết danh tính hoặc restart process của người dùng. Build/test không thay thế required API/browser/SQL smoke phù hợp.
- PR3 CI phải success trên intended head/test-merge snapshot; xem actual checks/run SHA, job outcomes và merge tree. Main là ancestor candidate nên merge-result tree phải bằng candidate nếu main chưa thay đổi. Nếu main/head đổi, refresh comparison/scope/review và relevant checks; không dùng prior green cho bytes mới.
- Giữ sáu SQL migration skips, hai lint warnings, NU1603, broad-browser69/83 lịch sử + target reruns và cold-health failure cũ đúng disposition. Không gọi tất cả xanh hoặc biến provider/production Not run thành pass.
- Rào chắn deploy ở trên Verified, source/runtime/review blockers hết, root GO merge exact head. Không squash/cherry-pick loại prerequisite. Repo cho phép merge commit; dùng GitHub merge với expected `sha` head để tránh merge head mới ngoài review, recheck main ngay trước mutation vì expected-head không khóa base.

Sau merge, đọc lại actual merged SHA/parents/tree/main và checks, xác nhận đầy đủ prerequisite+ERR ancestor và tree đúng candidate, bảo đảm deployment workflow vẫn disabled/không active deploy run. CI push-main là check riêng, không tự kết luận pass từ PR CI. Giữ local branch/worktree/backup/evidence; không cleanup branch hoặc sửa production. PR2 có thể được đóng là superseded chỉ khi root cho phép sau khi main chứa stack; không cần đổi base PR2.

## Validation và bàn giao

**Verified tại audit:** fresh local/remote refs/ancestry/status, exact paths/per-commit scope, PR2 API files321 khớp, main branch/environment protections, active workflow identities, complete deploy-run inventory, remote workflow blob identity và PR3 creation/read-back theo root GO. Credentials chỉ qua helper trong memory, không lưu/log token/cookie.

**Not run bởi audit agent:** build/tests/browser/API/SQL runtime, workflow disable/enable/dispatch, main merge/push, production health/migration/provider/payment/submission. Fresh source/runtime/independent main review và PR3 CI do root owners khác đảm nhiệm; chưa được suy pass từ audit này.

**Files changed:** paired MAIN_MERGE_PLAN, scoped audit artifacts và canonical LF mirror fix nêu trên; không product/test/pipeline behavior edit. **Scope alignment:** chuẩn bị/đánh giá tích hợp main theo yêu cầu mới, deploy vẫn thuộc người dùng. **Risks/Deferred:** production schema/config/key/backup/health chưa biết; API startup auto-migrates, cần preflight riêng; không chạy DB-sync local lần nữa. **Next recommended step:** delta review/clean-export checker, root GO exact fix commit/feature push và refresh immutable head; sau complete-stack review/fresh runtime/PR3 CI, GO pause chỉ deploy workflow, verify barrier rồi mới GO merge accepted exact head và giữ deploy paused.
