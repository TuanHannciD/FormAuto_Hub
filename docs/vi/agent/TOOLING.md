# Skill, công cụ và mức kiểm chứng

Chỉ chọn skill tại [SKILL_USAGE_MATRIX](../../../SKILL_USAGE_MATRIX.md). Superpowers sở hữu phương pháp; bảy specialist FormAuto bổ sung domain, không tạo lifecycle khác. Đợt này không cài dependency sản phẩm, MCP, hook global hoặc cấu hình provider mới.

## Nguồn gói và bảo trì

- `.agents/skills/` là bản phân phối được bảo trì. `.claude/skills/` là mirror sinh ra, khớp byte, không sửa độc lập. Dùng `python scripts/agent-skills.py --sync` sau thay đổi gói được phép, rồi `python scripts/agent-skills.py --check`.
- [Manifest Superpowers](../../../.agents/superpowers-source.json): 15 skill, v6.4.2, commit `8ca22dba9a94f28898bbce59f2537ff4d87c747d`, gốc obra/superpowers; nhập nguyên byte từ snapshot local Minh Khuê đã duyệt.
- [Manifest UI](../../../.agents/ui-skills-source.json): Impeccable và UI UX Pro Max, snapshot duy trì local có nguồn upstream ứng viên; không claim bản upstream nguyên trạng. Đường dẫn nhập chỉ là provenance, không là dependency runtime.
- Giữ [license Superpowers](../../../.agents/SUPERPOWERS-LICENSE), [UI notices](../../../.agents/UI-LICENSES) và [modern-screenshot notice](../../../.agents/MODERN-SCREENSHOT-LICENSE). Không sửa byte vendor để tùy biến hoặc làm check xanh.
- [.gitattributes](../../../.gitattributes) tắt chuyển line ending cho byte package/mirror/notice để hash giữ đúng qua Git checkout. `.impeccable/config.json` local tắt check update và staleness tự động; pilot context hẹp không cần cache/hook global.
- Chỉ đổi version trong scope được phép: review nguồn/version/license, tác động script/network, hash, rollback, routing và pilot ảnh hưởng. Không chạy toàn bộ script đi kèm như bước cài đặt. Pin kiểm integrity, không chứng minh mọi script an toàn.
- Skill FormAuto quy trình cũ rút khỏi discovery hoạt động; prompt lịch sử không là chỉ dẫn thực thi. Bảy specialist giữ lại thuộc project, sửa reference cũ tại nguồn rồi sinh mirror.

## Override phương pháp upstream của project

1. Quyền phiên/người dùng và scope project được ưu tiên. Không tự cài hook, sửa cấu hình Codex/Claude global, tạo lịch, commit/push/merge/deploy hoặc xóa worktree/evidence vì skill gợi ý.
2. Chỉ đọc skill phù hợp. Catalog runtime sở hữu schema/provider/model hiện có. Có thể đọc SKILL.md trực tiếp khi chưa auto-discovery, nhưng không coi đó là chứng minh discovery tự động. Tên như `superpowers:writing-plans` chỉ package local `writing-plans`, không hứa plugin đã cài.
3. Tái sử dụng discovery/plan đã duyệt. Đợt tài liệu/đóng gói này được thực hiện inline trong checkout dirty hiện tại với baseline đã giữ; không tạo approval prompt, commit hoặc worktree hình thức theo ví dụ upstream. Task code sau chọn isolation theo task/ownership; không che dependency chưa commit.
4. Plan/quyết định/kiểm chứng bền vững nằm trong hồ sơ task song ngữ, có approval và next action thật. Đường dẫn plan/helper ledger Bash upstream là adapter tùy chọn; không chạy helper không tương thích Windows hoặc xóa hồ sơ bền vững như scratch skill.
5. Test theo tác động. Sửa tài liệu không cần TDD hình thức; hành vi runnable vẫn qua runtime gate project. Ngưỡng review, review lại sau sửa và giữ tài nguyên theo [quality](QUALITY_GATES.md), [execution](EXECUTION_RULES.md), ưu tiên hơn giới hạn vòng fix/review hoặc cleanup upstream.
6. Impeccable là phương pháp UI, UI UX Pro Max bổ trợ tra cứu, Stitch là integration thiết kế tùy chọn. Frontend guide/design artifacts và UI sản phẩm được chấp nhận vẫn là nguồn chuẩn. Không tạo PRODUCT.md/DESIGN.md, đổi token/framework hoặc thay UI đã chấp nhận chỉ để thỏa initializer tổng quát; dùng tài liệu project đã duyệt làm context và ghi adapter còn thiếu. Không tự check update/hook/pin; đọc script được yêu cầu trước khi chạy.
7. Đọc source theo [source rules](../SOURCE_STRUCTURE_AND_NAMING_RULES.md): map định hướng, symbol hiện tại và implementation/dependency/test đầy đủ mới làm rõ hành vi.

## Lệnh và target có thật

Chỉ chạy phần thay đổi cần, từ đúng cwd:

- Root repo: `python scripts/agent-skills.py --check`; `dotnet build FormAutoHub.sln -c Release`; `dotnet test FormAutoHub.sln -c Release`. EF tool ghim trong `.config/dotnet-tools.json`; lệnh migration cần DB test được phép.
- `apps/web`: `npm run lint`, `npm run build` (gồm `check:colors`), `npm run test:auth`; `npx playwright test <affected-spec>` để regression.
- `run-local.bat` / `npm run dev` khởi API 7039 và web 3020, có thể cài dependency frontend còn thiếu. Đây không là check chỉ đọc.
- Playwright mặc định khởi web 3000, có thể dùng server local đã chạy; kiểm owner/target trước. SEO config dùng target được khởi rõ, mặc định 3034. Test auth/browser có thể mock API; đọc spec trước khi claim integration.
- CI hiện cấu hình backend build/test, web lint/build, container build. Auth/Playwright/docs check chưa nằm trong CI đó. Kiểm trigger release/deploy và protection thật trước remote; YAML tồn tại không chứng minh run đạt.

## Trạng thái năng lực và giới hạn pilot

Tách ba tuyên bố: đã viết quy định; tool/package đã cài hoặc discovery; hành vi đã kiểm đúng môi trường/ngày. `Available/discovered` không là `Verified`. Check thật theo [hồ sơ chuyển đổi](../tasks/FAH-AGENT-001/INDEX.md).

Lúc khảo sát: có đường dẫn Node/npm, Python, Git, .NET và rg local; có file package Next 15.5.18 và Playwright Test 1.60.0. Inventory không chứng minh browser executable, SQL Server, credential, live provider, sức khỏe production hiện tại hoặc toàn bộ 17 workflow upstream. T3 Browser/delegation do runtime cung cấp, không do repo cài; discovery lại khi cần. Đợt này không cài Playwright MCP hoặc connector ngoài mới.

Pilot bootstrap bao phủ integrity/mirror, routing planning/verification đúng scope, nạp context Impeccable và một truy vấn UI UX Pro Max. Context báo thiếu PRODUCT.md tổng quát; dùng ngữ cảnh project đã duyệt theo override trên, không tạo thêm nguồn nghiệp vụ. Pilot không chứng nhận thao tác browser, gọi provider, resume Agent độc lập, crash recovery đầy đủ, deploy hoặc mọi script vendor. Tool/dependency/CI/pilot bổ sung là `Deferred:` tới khi được duyệt riêng.
