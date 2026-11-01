# FAH-AGENT-001 — chuyển workflow đóng gói

Ngày: 28/10/2026. Trạng thái: Done cho scope tài liệu/đóng gói local; chưa commit, tích hợp hoặc phát hành.

## Scope và plan đã duyệt

Người dùng duyệt thay skill quy trình FormAuto tổng quát bằng 15 Superpowers ghim version + Impeccable/UI UX Pro Max, giữ bảy specialist domain, hợp nhất tài liệu vận hành song ngữ về bốn nguồn, giữ code sản phẩm và công việc đang có. Không commit/push/deploy, đổi global, mutation production hoặc sửa Minh Khuê.

Phương pháp: thực hiện inline theo plan đã duyệt; không dispatch Agent con. Áp override project thay commit/worktree/cleanup scratch tự động upstream. SHA/status/hash baseline và docs/skill gốc giữ local tại `.codex-tmp/agent-migration-20261028/`. Đây là snapshot dirty hiện tại, không phải base commit mới.

- [x] Baseline, inventory nguồn/license và hash preflight.
- [x] Nhập byte thuộc manifest; thay routing tổng quát; giữ bảy specialist.
- [x] Hợp nhất authority/execution/quality/tooling AI/VI; giữ đường dẫn tương thích và pack lịch sử.
- [x] Kiểm gói/mirror, path/anchor, AI/VI, bảo toàn và pilot planning/verification đúng scope.
- [x] Self-review diff cuối và bàn giao; scope tài liệu/đóng gói này không bắt buộc review độc lập.

## Quyết định và giới hạn

- `.agents/skills` sở hữu, `.claude/skills` sinh ra. Không đổi stack/schema/contract sản phẩm.
- Sửa phát biểu specialist cũ: frontend Deferred, Stitch 1–5 preview và danh sách tính năng Deferred toàn bộ. Giữ safety/contract được duyệt hiện tại.
- Giữ file/artifact SEO/GEO dirty đang có; tái cấu trúc cửa vào giữ trạng thái theo ngày và liên kết. Task không sửa implementation/runbook/recovery/artifact SEO.
- Có thể kiểm cài gói và đọc trực tiếp ở đây; không suy discovery tự động lượt sau hoặc mọi workflow vendor.
- Helper checker/sync chỉ bảo trì package, dùng standard library. Không cần runtime gate app vì code/config sản phẩm không đổi.

## Kiểm chứng

Verified ngày 28/10/2026:

- `python scripts/agent-skills.py --sync`, rồi `--check`: 24 skill hoạt động, 280 mục hash ghim, 293 file mirror, drift cuối bằng 0.
- Fixture helper cách ly: check sạch, chặn drift, sửa được phép, giữ file lạ, chặn tamper, chặn traversal/absolute, chặn thiếu file gói (7 ca).
- Check tài liệu đúng scope: 83/83 đường dẫn tương đối AI/VI, link/anchor Markdown sở hữu và UTF-8. Đã rà nghĩa quy tắc vận hành AI/VI cùng cam kết; chỉ khớp path không chứng minh khớp nghĩa.
- So baseline bảo toàn source/config sản phẩm, implementation/runbook/recovery/artifact SEO đang có và file ngoài scope. Git HEAD không đổi. Ba mẫu checkout-filter giữ byte package qua `.gitattributes`.
- Pilot planning/verification thủ công: sáu quyết định routing có assertion package/path thật. Đọc trực tiếp using-superpowers, writing-plans và verification-before-completion; không phải pilot Agent ngữ cảnh mới hoặc auto-discovery.
- CLI context Impeccable nhận `apps/web`, exit 0, báo thiếu PRODUCT.md tổng quát. Truy vấn UX UI UX Pro Max exit 0, một kết quả. Không sinh design file; tắt check network/cache update/staleness.
- `git diff --check` cho tracked diff thuộc task: exit 0. Self-review scope, gate, giữ safety/contract, mirror/quyền và tương thích. Không claim review độc lập.

Evidence và giới hạn đầy đủ: [validation.json](../../../../artifacts/reports/agent-workflow/2026-10-28/validation.json). Baseline HEAD: `8a4f18ee77453857c550ff7be0279c5cc9e415f1`; đầu ra là snapshot dirty local.

Not run: build/test/runtime/browser/SQL/provider/production của app, resume Agent độc lập, discovery skill tự động và mọi workflow vendor. Runtime sản phẩm không đổi. CI/dependency/browser/provider bổ sung vẫn Deferred.

Quan sát project nguồn: 11 tài liệu Minh Khuê đổi giữa baseline và lần đọc cuối, ngoài thao tác chỉ đọc của task này. Toàn bộ 280 mục hash nguồn đã nhập không đổi. Không claim cả workspace đó đóng băng; xem các path trong evidence. Task không chạy lệnh ghi/commit/cài đặt tại Minh Khuê.

## Bước tiếp

Task sau dùng AGENTS → authority → task/routing hiện hành và skill matrix duy nhất. Gói mới có thể được discovery ở lượt/phiên sau; nếu runtime chưa liệt kê thì đọc SKILL.md local trực tiếp và báo giới hạn. Giữ baseline/evidence local tới khi người dùng chọn tích hợp; không thực hiện lại pack NCKH lịch sử.
