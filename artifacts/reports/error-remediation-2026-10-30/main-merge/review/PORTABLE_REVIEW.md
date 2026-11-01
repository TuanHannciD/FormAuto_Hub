# Independent main integration review — source/runtime accepted

Reviewer `/root/main_merge_review`, actual `gpt-6.1-sol/high`, 2026-11-01, không agent con. Review read-only; không sửa source/tests/docs, chạy application/SQL/provider, sửa Git hoặc remote. Root sở hữu quyết định merge và deployment barrier.

## Findings / verdict

**Source và applicable local runtime evidence được chấp nhận tại head `7cb943a05162577df456479fcdb5485cab9dbeaa`. Không còn P1/P2 source mở trong phạm vi tích hợp đã review.** Đây là verdict trước remote merge; final CI và deploy barrier vẫn phải được xác minh trên head cuối. Không phải release/production certification.

**P2 PKG-MIRROR-01 — ADDRESSED.** [Finding](package-p2.md) xác nhận specialist YAML source LF khác mirror CRLF dưới `.gitattributes -text`. Exact checker [RED reproduction](mirror-reproduction-result.json) và runtime clean-export RED→GREEN chứng minh lỗi/sửa. Source/mirror cuối cùng đều blob `10cdfc20add765ccbde942fe5cda7d29696921cd`,232bytesLF. Không đổi YAML text/vendor pin. [Staged review](staged-fix-review.json) và [postcommit binding](postcommit-fix-review.json) chấp nhận exact mirror+paired-plan delta.

## Full integration scope

Base main `8a4f18ee77453857c550ff7be0279c5cc9e415f1`, prerequisite `a19f7a2f3dc1bc54ff645d662d94fc614439256a`. Main→published3893 ban đầu1024net paths/10commits; prerequisite719paths gồm workflow/skills/UI và closeout. Final7cb adds canonical mirror+paired plan only:1026net paths/11commits. Không bỏ qua bốn prerequisite vì ERR snapshot đã accepted.

- Đọc authority/execution/quality/tooling/source rules và task approvals; không thấy mở phase/contract/provider/deploy permission ngoài scope. Vendor280pins exact match;293mirror comparisons tìm đúng một defect đã sửa. Licenses/provenance và project overrides có mặt; không execute vendor hooks hoặc chứng nhận mọi script an toàn.
- Review prerequisite UI diff/shared/auth/admin/topup/NCKH consumers, đối chiếu prior independent37production+6tests/code/visual/fixture reviews và frozen142file evidence.139hashes bind exact GitLF/CRLF; topup mixedEOL bind preserved before bytes; auth/toast không đổi main→prerequisite.34UI paths đổi sau prerequisite đều thuộc ERR80. Giữ native auth callback, preview/confirmation, credit/submission invariants và homepage follow-up Deferred.
- [Source binding](source-content-binding.json): ERR80/DB17 raw reviewed hashes và normalized Git content đều match; runtime343 current raw hashes match. DB17 probe/catalog dependencies đầy đủ, migration guards/transaction/forward-only behavior đã có accepted SQL evidence. ERR không thêm migration; reviewed optional DTO delta không mở lifecycle mới. Không chạy lại full24-ID audit.

## Fresh validation evidence accepted

Đã đọc [paired runtime validation](../../../../../docs/ai/tasks/FAH-ERR-001/MAIN_MERGE_VALIDATION.md), actual results/logs, [frozen evidence checksum manifest](../runtime/evidence-checksums.json), browser summary, API assertions, owned-build proof, config restoration và resource release.

Verified theo owner evidence: backend build;291pass/6SQLskips/0fail; web lint với2warnings; final isolated `npm run build` exit0; Node108; production-web browser105/105 dùng API fixtures; owned T3 hydration/action/chunks; actual Program cold-start15 safe HTTP assertions với User/Admin JWT và preserved SQL clone, pending0/modelPendingfalse/counts5tablesunchanged; final-head clean skill export24/280/293/0.343sourcehashes unchanged. Đã đối chiếu Next preload chỉ chọn dist sở hữu và giữ config functions. Exact tsconfig/next-env cùng5confighashes restored; owned web/API/browser released.

Sáu SQL skips, NU1603, hai lint warnings, raw local checker failure vì ignored bytecode, build-helper attempts1/3fail và attempt2regeneratedstandardcache, first-readiness failures, historical broad83failures/cold-health failure đều được giữ. Fresh105/coldstartsuccess không viết lại lịch sử. Live provider/payment/submission/production/tunnel/deployment Not run. Prior SQL9/AI6/Program25 mutation proofs chỉ được dùng vì application bytes không đổi; không giả browser→realAPI→provider.

## Final integration conditions

CI/deploy YAML không đổi từ main. Existing main-CI-success tự kích release+SSH; actual branch/environment không có protection. [Plan](../../../../../docs/ai/tasks/FAH-ERR-001/MAIN_MERGE_PLAN.md) yêu cầu disable đúng deploy workflow293903479, read-back `disabled_manually`, CIactive, zero active deploy runs trước/sau merge và giữ disabled sau push-mainCI terminal. User tự enable/manual dispatch khi sẵn sàng; reviewer không cấp quyền remote.

Sau docs/evidence-only commit, root phải bind exact new head/diff, current CI success, reviewed clean tree và deploy barrier; expected-head guard kèm fresh main-base recheck trước merge. Verify actual merge SHA/parents/tree/main ancestry và postmergeCI riêng. Không còn source/runtime finding yêu cầu sửa product; operational gates thiếu không được suy thành pass.
