# FAH-ERR-001 — Kế hoạch tích hợp có phạm vi

Ngày: 2026-10-30. Owner `/root/closeout_git_inventory`, `gpt-6.1-sol/high`, không agent con. Tài liệu này đề xuất và chốt đường đi Git theo root; chưa phải bằng chứng đã commit/push/PR. Snapshot nguồn được review: HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` cộng các thay đổi local có allowlist. [Kết quả local](REMEDIATION_VALIDATION.md) vẫn tách biệt với tích hợp và release.

## Quyền và ranh giới

Root đã phân xử yêu cầu mới của người dùng “làm những việc còn lại” và “deploy chỉ hướng dẫn”: cho phép scoped local commits, push nhánh feature và draft PR; không merge/push main, không deploy, không chạy workflow_dispatch/SSH/container/provider. Điều này supersede giới hạn Git cũ trong phần lịch sử cho đúng bước closeout này. Agent inventory chỉ đọc Git và ghi packet/tài liệu; mọi mutation phải đợi independent review và root GO cho allowlist cụ thể.

Không reset, clean, stash toàn workspace, sửa/xóa DB, backup, cache, ignored evidence hay worktree. Nhánh gốc `ui/compact-refinement-20261028` và worktree DB-sync giữ nguyên pointer/tài nguyên. Giữ sáu SQL migration skips, hai lint warnings, NU1603 và các lịch sử Failed đã giải thích; không chạy lại toàn bộ tests chỉ để chốt Git khi source hash không đổi.

## Snapshot và phụ thuộc

- Local và remote `main` đều `8a4f18ee77453857c550ff7be0279c5cc9e415f1`, đã xác minh bằng read-only `git ls-remote --heads origin ...`; chưa fetch hoặc sửa remote-tracking refs.
- Branch hiện tại không upstream, HEAD `a19f7a2`; merge-base với main đúng `8a4f18e`. Có bốn commit prerequisite về workflow/UI/closeout sau main: `be3c65b`, `0698ecc`, `606de1e`, `a19f7a2`. Chúng không được ngầm tính là diff ERR mới.
- Index rỗng tại inventory. 80 file ERR =52 product+22 tests+2 contract docs+4 tooling; 17 file DB-sync là baseline có trước ERR, không giao nhau. Rehash độc lập ERR80, DB17 và runner343 đều 0 mismatch.
- `tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj` thêm ProjectReference tới `scripts/db-compatibility/DbCompatibilityProbe.csproj`. CI restore/build/test solution cần cả probe project, catalog resource và implementation/tests liên quan. Không commit csproj đơn lẻ hoặc bỏ DB baseline để làm diff gọn.
- DB-sync migration đã local-verified và được áp dụng ở DB local theo dossier riêng; commit source không tự chứng minh hoặc cho phép apply ở production. API `Program` hiện gọi `Database.Migrate()` khi startup; người tự deploy phải thực hiện preflight/backup/guard theo [handoff](SELF_DEPLOY_HANDOFF.md).

## Đường đi root đã chọn: stacked draft PR

Sau review/GO, tạo nhánh feature `fix/fah-err-001-closeout-20261030` từ exact HEAD `a19f7a2`, không di chuyển pointer nhánh gốc. Tạo remote base mới `review/fah-err-baseline-a19f7a2` trỏ đúng SHA đó. Push chỉ hai ref mới này, không force, rồi draft PR feature → review base. Nếu ref đã tồn tại với SHA khác, dừng mutation và điều tra; không ghi đè.

PR base là review snapshot, không phải nhánh release. Diff PR chỉ gồm DB-sync/ERR/docs/evidence có allowlist; bốn prerequisite commit trước baseline không nằm trong diff này. Việc đưa prerequisite và stack lên main là quyết định tích hợp sau, cần kiểm scope/validation và chấp nhận hệ quả deploy riêng. Không merge PR stack hoặc main trong closeout hiện tại.

CI hiện chỉ nhận PR target `main` hoặc push `main`. Vì draft PR target review base, CI tự động **Not run theo thiết kế YAML**; không sửa CI hoặc tạo run giả để làm xanh. Các required local gates giữ exact evidence/hash và giới hạn trong validation. Push feature/base không khớp trigger CI/deploy đã đọc.

## Nhóm commit và allowlist

Danh sách exact path, SHA256, diff source và inventory nằm trong [packet inventory](../../../../artifacts/reports/error-remediation-2026-10-30/closeout/git-inventory/). Không dùng `git add .`, `git add -A` hoặc glob thư mục lớn.

| Nhóm | Phạm vi | Commit đề xuất |
| --- | --- | --- |
| 1 | `allowlist-db-source.txt`: exact17 DB-sync, gồm csproj/probe/migration/tests | `fix(db): normalize topup evidence schema with guarded compatibility checks` |
| 2 | `allowlist-err-source.txt`: exact80 ERR source/tests/tooling/paired contract docs | `fix: preserve safe error context and confirmed operation results` |
| 3 | `allowlist-db-docs.txt` + `allowlist-err-docs.txt`: toàn bộ paired dossier hiện có, gồm audit history, integration và self-deploy handoff | `docs: record reviewed error remediation and integration handoff` |
| 4 | `allowlist-portable-evidence.txt` và exact closeout packet sau review: báo cáo/JSON/TRX/log nhẹ cần cho traceability, không binary | `test: archive scoped remediation verification evidence` |

Danh sách docs lấy từ file thực tế; “12 docs” của một checkpoint trước không phải toàn bộ dossier. Không biến artifact được giữ local thành scope product mới. Trước staging cần refresh manifests sau khi các writer docs dừng, kiểm paired AI/VI, links và secret screen; hash docs đang viết là snapshot, không lock.

Portable evidence gồm recursive Markdown artifact references và selected final build/test/browser/SQL/source-review summaries. Log ignored chỉ được force-add từng exact path trong allowlist, sau kiểm nội dung. ZIP/PNG/DLL/PDB/backup/cache, appsettings development, env, raw cookies/tokens/credentials, fixture database dumps và mọi path ngoài allowlist giữ nguyên local, không publish. Artifact cần giữ tại máy vẫn không bị xóa vì không commit.

## Kiểm trước/sau Git mutation

1. Recheck HEAD/index/status, source80/DB17/runner343 hashes và exact generated config restore. Nếu source drift, quay lại reviewer/runtime owner; không dùng green cũ cho bytes mới.
2. Independent review packet, source dependency, deploy trigger và allowlists; root GO là gate cho agent thực hiện, không phải yêu cầu quyền mới từ user.
3. Tạo feature branch; stage từng nhóm bằng exact literal paths/pathspec. So sánh cached paths với allowlist trước mỗi commit, kiểm diff/whitespace/secret screen. Không stage thay đổi writer khác chưa đóng băng.
4. Verify mỗi commit path/diff và cuối cùng cây tracked source đúng SHA256 reviewed; giữ artifact/status báo rõ phần untracked được preserve. Chỉ rerun checks khi snapshot thay đổi hoặc review phát hiện vấn đề mới.
5. Recheck remote refs và YAML ngay trước push; push hai ref mới, tạo draft PR đúng review base bằng body có actual newlines, báo URL và SHAs. Không tạo PR main hoặc bấm merge.

## Trigger deploy và giới hạn

`.github/workflows/ci.yml`: pull_request target main và push main; API build/tests, web lint/build và container builds. `.github/workflows/deploy.yml`: sau CI success với original event push/head_branch main, hoặc manual workflow_dispatch, build/push immutable GHCR images rồi job environment production chạy SSH `scripts/deploy-production.sh`. Script fetch main, thay compose theo release SHA, pull/up containers và health check. Vì vậy merge/push main có thể deploy tự động. Tên environment production không tự chứng minh required reviewers/protection thực tế; protection và runner state remote **Not run** trong inventory.

## Validation và bước kế

**Verified trong inventory:** read-only Git/ref/index/remotes/worktrees, CI/deploy/script đọc thực tế, ownership/dependency classification, fresh ERR80/DB17/runner343 hashes, generated configs, Markdown artifact references và secret-pattern screen của exact publish candidates. Pattern-only scan không chứng nhận tuyệt đối không có secret; placeholder/environment-variable hits phải được phân loại rõ.

**Not run bởi agent inventory:** test/build/browser/SQL reruns (sole runtime owner có accepted exact-hash evidence); Git mutations, CI server runs, remote protection/PR queries, release/deploy/provider/charge/submission. Kết quả local đã được independent whole-remediation review chấp nhận; integration review packet là gate riêng.

**Next recommended step:** independent review packet và freeze paired docs; root GO thực hiện exact scoped commits/feature push/stacked draft PR. Người dùng tự deploy theo handoff sau khi tự quyết định prerequisite/main integration và áp dụng preflight phù hợp. Không có integration/release claim tại bản kế hoạch này.
