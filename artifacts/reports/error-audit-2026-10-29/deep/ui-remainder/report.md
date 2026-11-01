# FAH-ERR-001 — Phần UI còn lại

2026-10-29. Agent `gpt-6.1-sol / high`, không agent con. HEAD kiểm mới: `a19f7a2f3dc1bc54ff645d662d94fc614439256a`.

## Summary

Đã đọc đầy đủ **56/56 tệp còn lại** từ danh sách `unreviewed-by-this-agent` của [coverage trước](../ui/coverage.json); không dùng số dòng regex hay hash thay cho đọc thủ công. Mỗi tệp có disposition, hash nguồn và số dòng trong [coverage.json](coverage.json). Cộng hợp hai tập không giao nhau: **99/99 tệp TS/TSX đã được đọc toàn tệp qua hai lượt UI**, với điều kiện 43 hash của lượt trước vẫn khớp; điều kiện này được kiểm trong validation. Đây là denominator riêng `apps/web/{app,components,lib}` của lượt trước, không phải toàn repo, E2E specs/config/CSS hay tất cả nhánh runtime.

Kết quả: **một candidate mới UIR-001 / P2**, cùng ba mở rộng UIR-002/003/004 đề nghị gộp nhóm đã có. UIR IDs chỉ là IDs nhánh chờ review/root quyết định; không tự đổi register 23 nhóm. Không sửa source sản phẩm, hợp đồng, DB, task docs hoặc cache; không chạy server/browser/provider.

## UIR-001 — P2: Xóa ngày/giờ làm ô hiển thị mặc định nhưng cấu hình gửi đi vẫn rỗng

- **Trigger:** ở quy tắc khoảng ngày hoặc khoảng giờ, xóa giá trị ô bắt đầu/kết thúc. Đây là event hợp lệ của input date/time, không cần API trả dữ liệu sai.
- **Nguồn:** `apps/web/app/dashboard/forms/_components/RuleEditor.tsx`, `updateDateRange` dòng 132, `updateTimeRange` dòng 139; đọc `dateRange/timeRange` dòng 54–55, các input dòng 235–271. Dependency `forms/_helpers.ts`, `readDateRange`/`readTimeRange`: `parsed.fromDate || "2026-05-18"`, `parsed.fromTime || "09:00"`, tương tự giá trị kết thúc.
- **Quan sát:** input `onChange` lưu chuỗi rỗng vào `configJson`. Render kế tiếp đọc lại helper, thấy rỗng và hiển thị ngày/giờ mặc định. `canGenerate` ở `forms/page.tsx:127` chỉ kiểm mode + chuỗi configJson khác rỗng, nên JSON có trường rỗng vẫn qua gate. `saveRulesAndGenerate:345` gửi nguyên config đó. Người dùng nhìn thấy trường đã có ngày/giờ hợp lệ nhưng API nhận trường rỗng.
- **Chuỗi lỗi thực từ source:** `AnswerRuleService.ValidateRequest` → `Phase3RuleHelpers.HasValidConfig` → `PickDateRange/PickTimeRange` → `ReadRequiredDate/ReadRequiredTime` từ chối rỗng. `HasValidConfig` trả false; service ném `Answer rule config does not match the selected mode and question.`; `AnswerRulesController` trả 400 với Detail đó. `apiFetch` giữ Detail, `showError/readableError` cho phép câu tiếng Anh này. Consumer cuối là toast của nút tạo preview, không có lỗi cạnh ô/định danh câu hỏi để biết trường nào cần sửa.
- **Bằng chứng:** `UIR-P01` và `UIR-P02` chạy component RuleEditor gốc + helpers gốc + handler save gốc với mock API. Date: hiển thị `2026-05-18`, POST config `fromDate:""`; Time: hiển thị `09:00`, POST config `fromTime:""`. Mock rejection dùng literal service hiện tại. **Verified mock**, JSX object tree; không React DOM/browser. Phần backend rejection là **static trace**, không gọi C#/HTTP/SQL trong lượt này. Probe kiểm ô bắt đầu; ô kết thúc cùng cấu trúc được đọc source, chưa probe riêng.
- **Tác động/severity:** P2 vì UI che dữ liệu thiếu, làm thao tác tạo thất bại dù form trông đã đầy đủ và thông báo không chỉ được chỗ sửa. Không có bằng chứng mất credit hoặc dữ liệu persisted ở case này; handler dừng ở POST rule đầu tiên trong fixture.
- **Đề xuất Deferred:** giữ giá trị trống khi người dùng xóa và báo cạnh ô `Hãy chọn ngày bắt đầu.` / `Hãy chọn giờ bắt đầu.`; xác thực đủ hai đầu và thứ tự trước tạo. Mặc định chỉ được khởi tạo khi chọn chế độ, hoặc phải được lưu đồng nhất với phần hiển thị. Thông báo lỗi cần xác định câu hỏi/ô liên quan, giữ cause nội bộ an toàn. Không thêm response field/status/contract mới trong audit.
- **Chống trùng:** ERR-012 đã mô tả nhiều constraint bị gộp ở backend, ERR-003 mô tả raw English. UIR-001 có nguyên nhân UI độc lập: giá trị hiển thị không khớp request. Đề nghị reviewer đánh giá thành nhóm mới hay mở rộng nhóm validation trước khi gán global ID.

## UIR-002 — Mở rộng ERR-019: copy còn lộ thuật ngữ triển khai ở leaf AI và public SEO

**Mức đề nghị:** giữ trong nhóm P2 ERR-019; riêng các câu public có tác động copy mức thấp hơn, không tăng số nhóm. **Evidence:** static source-to-consumer, không browser mới.

- `AiQuestionBlock.tsx:52`: mọi câu hỏi trong AI mode hiển thị `Khối AI thu gọn; không hiển thị danh sách lựa chọn chi tiết trong Option 2/3.`. Consumer là `AiModePreparationPanel` → forms page; UI ngoài đã gọi chế độ `AI mặc định`/`AI tùy chỉnh`. `Option 2/3` là tên backend mapping qua `toBackendAiMode`, không giúp người dùng hiểu cách phục hồi hay kiểm tra câu hỏi. Đề xuất `Mở câu hỏi để xem thông tin và hướng dẫn trả lời.` nếu đúng trạng thái; tránh nói luôn “thu gọn” khi khối đã mở.
- `seo-keyword-page.tsx:213–214`: nội dung render cho năm trang SEO nói `bám product baseline: phân tích, cấu hình, preview...`; dòng 240–243 `Hướng dẫn theo use case`, `giúp Google và AI search hiểu rõ...`. Đây là copy người đọc thấy, không chỉ metadata/code comment. Đề xuất tập trung vào việc kiểm thử biểu mẫu/xem trước/xác nhận, bỏ mô tả nội bộ sản xuất nội dung.
- `seo-pages.ts:379`: câu trả lời FAQ `/anti-abuse` là `Không. Những hành vi này bị cấm theo product safety rules.`. `SeoKeywordPage` render nguyên `faq.answer` trong `<p>` và structured data. Đề xuất `Không. FormAuto Hub không hỗ trợ vượt mã xác minh hoặc tạo tài khoản giả.` dựa đúng câu hỏi hiện hữu. Những chỗ `API`, `Google Forms`, `PayOS`, `Likert`, mã biến, ID và protocol dành đúng người dùng/admin không tự bị coi là lỗi.
- `llms.txt` là nội dung hướng máy và metadata tiếng Anh không tự thành finding UI. Không đánh đồng mọi English string với lỗi.

## UIR-003 — Mở rộng ERR-017/021: NCKH dataset chưa xác định được trình bày là chưa có

**P2 theo nhóm hiện hữu**, không tăng số nhóm. **Evidence:** static component + loader + consumer trace.

`dataset-preview.tsx:7` gộp `dataset === null` với `items.length === 0`, hiện `Chưa có bộ dữ liệu` / `Chạy chuẩn hóa sau khi đã có phản hồi thô và ánh xạ.`. Parent `loadModelData:314` chỉ setDataset khi request fulfilled; state ban đầu null và failed slice giữ nguyên. `renderDataPanel:1261` vẫn render DatasetPreview, kể cả có panelError phía trên hoặc đang loading; raw-response BaseTable cũng lấy `responses?.items ?? []`.

Không cáo buộc toàn trang nuốt lỗi: parent có warning `Một phần dữ liệu chưa sẵn sàng`. Finding là thông điệp cục bộ mâu thuẫn và hướng chạy chuẩn hóa khi chưa biết có dữ liệu hay không; khi đổi model còn liên quan stale owner của ERR-017. Đề xuất đưa validity/loading/error của slice vào hiển thị, chỉ hiện “chưa có” sau GET thành công. Không chạy thu thập/chuẩn hóa thật; chưa chứng minh mutation sai model.

## UIR-004 — Mở rộng ERR-021: tìm người dùng admin lỗi vẫn có trạng thái không tìm thấy

**P2 theo nhóm hiện hữu**, static sibling trace, không tăng nhóm hoặc suy ra account enumeration. `SearchableDropdownSelect:109–110` chỉ có loading/options-empty; caller manual-credits `loadUsers:80` có finally hạ loading nhưng không error state/clear options. Catch effect chỉ toast `Không tìm được người dùng theo email.`. Khi lần tải đầu lỗi, mở dropdown thấy `Không tìm thấy email người dùng phù hợp`; sau search mới lỗi, có thể còn options của search cũ. Đây là lỗi chưa biết kết quả bị trình bày như kết quả tìm kiếm, cùng ERR-021. Có version guard ngăn success response cũ ghi đè; không cáo buộc mọi request race mất guard. `changeGrantEmail` cập nhật grantUserId, nên không suy ra đã cộng nhầm người hoặc credit thật.

Đề xuất Deferred: phân biệt tìm kiếm thất bại với thành công không có kết quả; error/retry gần control, không giữ danh sách cũ như kết quả query mới. Không đổi policy generic login/email existence của core auth; đây là admin đã có quyền dùng endpoint tìm tài khoản hiện hữu.

## Các fallback và giới hạn được chấp nhận

- **DeleteModelDialog:** đọc đầy đủ `loadImpact`, effect cancellation, final GET recheck, busy/mounted guards, catch, render/disable/reload. Mọi GET/count/name bất định chặn xóa; lỗi DELETE dùng `Không xác nhận được kết quả xóa...` và buộc tải lại, không tự replay DELETE. Đúng cách thừa nhận unknown outcome. Mapper raw-English/fallback vẫn thuộc ERR-003/018/019. Đã đọc đầy đủ spec `nckh-delete-model.spec.ts` để biết coverage hiện có; **không rerun** và không nhận kết quả test cũ thành test lượt này.
- **Confirm/Dialog:** reject concurrent confirm bằng false, unmount resolve(false), dismissal cancel, focus/cleanup rõ; `DialogContent must be used inside Dialog.` là invariant lập trình, không tự dịch thành lỗi người dùng. Kiểm consumer ui.tsx và NCKH confirmation/deletion units, không phát hiện instance vi phạm invariant trong tập này.
- **Motion:** `.finished.catch(() => {})` trong transition/popup đi cùng cancel chủ đích và animation identity guards. Không xếp chung với swallowed API failures. Browser thiếu Web Animations/ResizeObserver/IntersectionObserver là coverage compatibility chưa thực thi, không khẳng định lỗi hiện tại hoặc tự thêm browser-support requirement.
- **PreviewAccordion:** `Không có tiêu đề`/`Không có câu trả lời` áp dụng chuỗi rỗng, dùng array contract đã có; không tự coi null payload trái contract là server behavior. Empty `answers` hoặc `values` được map không tạo lời giải thích bổ sung, nhưng chưa chứng minh source server phát case sai nên không tạo finding riêng.
- **BaseTable/Metric/Status/Pagination:** primitive nhận dữ liệu do caller quyết định; nguyên nhân false-empty được gán caller, tránh nhân 56 finding. Labels có fallback raw code cho future/unknown values; chưa thấy status hợp lệ đang phát mà label lỗi trong tập này, không invent status. Pagination callback NCKH đang là no-op ở danh sách giới hạn hiện hữu; thuộc tính năng đọc trang ngoài audit lỗi/thông điệp, không tự mở scope sửa.
- **SEO/public:** homepage và năm page wrappers/static config không gọi data API. Placeholder dashboard tabs không có caller hiện tại, dữ liệu “-”/empty là demo tĩnh; không coi là request thất bại. Public copy rõ preview/xác nhận/1–100; giữ các factual claims và branding hiện có.
- **Webhook proxy:** POST giữ upstream status/body/content-type; GET trả 405 + Allow POST có câu hướng dẫn kỹ thuật dành cấu hình webhook. Network/body-read reject để framework xử lý, không catch/log operation riêng ở wrapper. Chưa quan sát actual Next exception/log boundary; không nâng absence của local catch thành “không log/mất stack”. Không proxy test, không request payment.
- **siteUrl/metadata:** giá trị env không phải URL có thể làm `new URL` throw trong layout, nhưng chưa thấy config lỗi; không invent runtime incident. Layout/robots/sitemap/llms metadata là tĩnh và không gọi API.

## Files changed và Scope alignment

Chỉ ghi `deep/ui-remainder/report.md`, `coverage.json`, `probe.cjs`, `probe-results.json`. Không sửa docs AI/VI (root/synthesizer sở hữu), source/test, migration/schema/history, ignored cache hoặc evidence trước. Không install/cleanup/commit/push/deploy; không DB/port/process/browser resources cần release. Các writer khác có thể có thay đổi đồng thời; manifest chỉ chứng nhận nguồn UI được hash trong phạm vi này.

## Validation performed

- **Verified:** chạy `node artifacts/reports/error-audit-2026-10-29/deep/ui-remainder/probe.cjs` từ root; exit 0, 2/2 observations trên TSX/helper/save-handler gốc. Đây là tái hiện lỗi hiện tại bằng mocks, không kiểm sản phẩm đã sửa.
- **Verified:** kiểm denominator chính xác 56 unique, không giao 43 full-file cũ; SHA-256 99 nguồn UI khớp coverage cũ; hash probe khớp current files; JSON parse, UTF-8/link nội bộ và không có tracked product diff của workspace audit. Kết quả số lượng cuối được in lệnh handoff, không dùng hash để chứng minh đọc thủ công.
- Dependency đọc full: forms helpers, shared labels/utils/toast, NCKH workspace helpers, API/controller AnswerRuleService/Phase3RuleHelpers/AnswerRulesController, PaymentsController và Next config. Focused: forms canGenerate/save consumer, API fetch parser/types, NCKH loader/render/deletion callbacks, admin search/handlers, Phase3 tests date/time units. Previous 43 không được cộng lại lần thứ hai.

## Validation not performed, Risks/Deferred và Next recommended step

**Not run:** build/lint/broad test suite, browser/DOM/hydration, actual API/auth/SQL/provider/payment/webhook/submission, keyboard/a11y/viewport compatibility. Không đổi runnable source nên không restart/broad smoke trong lượt audit chỉ đọc này. Actual DB/runtime work do agent khác sở hữu; báo cáo này không tự nhận kết quả của họ. Một lệnh đọc `apps/web/next.config.ts` exit 1 vì repo dùng `.mjs`; đã tìm và đọc đúng `.mjs`, không phải product failure.

**Deferred:** mọi fix/wording implementation, contract/status/correlation design, DB repair và release. Review độc lập của snapshot mới này chưa thực hiện bởi tác giả; cần reviewer đối chiếu UIR-001, quyết định gộp UIR-002/003/004 và global IDs. Không gọi full-system audit Done chỉ từ 99/99 manual file reads. Bước tiếp: root gửi evidence cho reviewer, kết hợp runtime sau DB sync và cập nhật paired dossier với provenance/evidence limits.

## Disposition từng tệp còn lại

Mọi hàng bên dưới là `full-file`; ghi nhận nội dung đã đọc, consumer/fallback và kết luận. Hash cụ thể nằm trong coverage JSON.

| Tệp | Disposition sau đọc đầy đủ |
| --- | --- |
| `app/admin/layout.tsx` | AdminShell + noIndex; không data/error handler riêng; shell thuộc 43 cũ. |
| `app/anti-abuse/page.tsx` | Wrapper SEO dùng config static hiện hữu; UIR-002 qua template/config. |
| `app/api/payments/payos/webhook/route.ts` | POST forward body/status/content-type; GET405 Allow POST có hướng dẫn admin. Framework failure/log runtime Not run. |
| `app/auth/layout.tsx` | Metadata noIndex, trả children; không nuốt/đổi lỗi. |
| `app/dashboard/forms/_components/AiDirectionInput.tsx` | Input có label, maxlength 200; callback string; không I/O riêng. |
| `app/dashboard/forms/_components/AiModePreparationPanel.tsx` | Mode/direction/scope/prompts/count/busy/canGenerate và callbacks đã đọc; bounds1–100; UIR-002 child. |
| `app/dashboard/forms/_components/AiQuestionBlock.tsx` | Prompt length/collapse/options metadata; UIR-002 Option2/3 + collapsed copy cả khi mở. |
| `app/dashboard/forms/_components/CheckboxSelectionFields.tsx` | Clamp count qua helper; caller maxOptionCount ít nhất1; không giả định zero-option contract mới. |
| `app/dashboard/forms/_components/GenerationModeSelector.tsx` | Ba mode static labels, aria-pressed/callback; không I/O, không error riêng. |
| `app/dashboard/forms/_components/PreviewAccordion.tsx` | Chuỗi rỗng có label/value fallback; arrays đúng contract, no malformed-payload incident asserted. |
| `app/dashboard/forms/_components/RuleEditor.tsx` | Đọc modes/options/sample/numeric/date/time/update/render đầy đủ; UIR-001 display config mismatch. |
| `app/dashboard/forms/_components/WorkflowSummary.tsx` | Balance null hiện Chưa tải được số dư; stale preview warning; không default về0. |
| `app/dashboard/forms/_constants.ts` | Modes/limits/defaults/resume key; defaults khởi tạo tách validity; UIR-001 dependency. |
| `app/dashboard/forms/_types.ts` | UI mode/resume context types; không tự runtime-validate localStorage; no new status invented. |
| `app/dashboard/layout.tsx` | DashboardShell/noIndex wrapper; error owner ở shell/caller đã review trước. |
| `app/dashboard/nckh/forms/[formId]/_components/dataset-preview.tsx` | UIR-003 null/empty cùng message; columns/values fallback/render đã đọc. |
| `app/dashboard/nckh/forms/[formId]/_components/delete-model-dialog.tsx` | loadImpact all7 GET/identity/count guard; cancellation/final recheck/unknown DELETE outcome/reload; accepted safe fallback. |
| `app/dashboard/nckh/forms/[formId]/_components/loading-state.tsx` | Label/spinner display-only; không nuốt lỗi/I/O. |
| `app/dashboard/nckh/forms/[formId]/_components/overview-panel.tsx` | Model/form contract display; thiếu mô tả -; question empty chỉ caller dữ liệu; stale owner ERR017 parent. |
| `app/dashboard/nckh/forms/[formId]/_components/relation-edge.tsx` | Optional data callbacks, label fallback id; no I/O; không thêm finding từ absent optional data. |
| `app/dashboard/nckh/forms/[formId]/_constants.ts` | Labels enums/canvas dims; legitimate domain labels; no new status error found. |
| `app/dashboard/nckh/forms/[formId]/_types.ts` | PendingAction/tab/edge/dataset types; không phải runtime state transition contract. |
| `app/google-forms/sample-data/page.tsx` | Wrapper/config static; template UIR002; không failed GET state. |
| `app/google-forms/sheets-report/page.tsx` | Wrapper/config static; template UIR002; không data API. |
| `app/google-forms/student-report/page.tsx` | Wrapper/config static; template UIR002; không data API. |
| `app/google-forms/survey-demo/page.tsx` | Wrapper/config static; template UIR002; không data API. |
| `app/layout.tsx` | Root font/metadata/site URL/toaster; URL parse config boundary chưa có malformed config evidence. |
| `app/llms.txt/route.ts` | Machine-facing static English text and public paths; accepted no UI translation claim. |
| `app/login/layout.tsx` | NoIndex + children, auth error policy ở page/helper đã đọc trước. |
| `app/page.tsx` | Đọc metadata/brand/illustration/mobile nav/landing/services/pricing/FAQ/footer + helpers; server/static không request-error state. |
| `app/payment/layout.tsx` | NoIndex + children; payment outcome owner ở result pages cũ. |
| `app/register/layout.tsx` | NoIndex + children; không credential cause split. |
| `app/robots.ts` | Static crawler rules/site sitemap; không user error path. |
| `app/sitemap.ts` | Maps static publicPagePaths; no lastModified fabrication/no data fetch. |
| `components/auth-password-input.tsx` | State show/hide/disabled/aria pass; không password logging. |
| `components/auth-shell.tsx` | Login/register/callback wrapper + heading/switch; no async/error swallowing. |
| `components/base-table.tsx` | Empty presentation only; caller supplies validity; mobile/desktop render and callbacks đã đọc. |
| `components/confirm-dialog.tsx` | Concurrent request=false/unmount=false/dismiss=false; resolve sau motion close; no unhandled promise observed. |
| `components/dialog.tsx` | Portal/context/native modal/focus/dismiss/cleanup + close controls; invariant Error internal; browser Not run. |
| `components/dropdown-select.tsx` | Local open/select/outside/Escape cleanup/disabled/placeholder; no API lookup/error owner. |
| `components/landing-dashboard-tabs.tsx` | Four local tabs + static overview/table/metric/empty helpers; no current caller found, no failed-read claim. |
| `components/metric-card.tsx` | Typed tone map/display ReactNode; caller owns unknown/error; no default numeric state. |
| `components/motion/motion-presets.ts` | Reduced-motion media listener cleanup; browser API support Not run. |
| `components/motion/transition-region.tsx` | Key/current/outgoing/size/scroll/identity/cancel; rejected finished promise accepted intentional cancellation. |
| `components/motion/use-element-size.ts` | ResizeObserver measure/epsilon guard/disconnect; API compatibility Not run. |
| `components/motion/use-popup-motion.ts` | Open/resize/close/current phase/identity/cancel/disconnect and reduced motion; cancellation catch accepted. |
| `components/pagination-controls.tsx` | Zero pages/trước/sau disabled guards; callbacks caller responsibility; no API failure masking inside. |
| `components/scroll-reveal.tsx` | Reduced motion/intersection/state/cleanup; SEO noscript dependency; API compatibility not certified. |
| `components/searchable-dropdown-select.tsx` | Loading/no-results/options/local open/cleanup; UIR-004 caller lacks failure state, avoid blaming primitive alone. |
| `components/seo-keyword-page.tsx` | All5 configs/render metadata/schema/sections/FAQ/header/footer; UIR-002 internal/English copy; noscript present. |
| `components/status-badge.tsx` | Known statuses tone + displayStatus shared labels, raw fallback accepted future unknown; no invented emitted state. |
| `components/ui-styles.ts` | Shared control/button variants/size/disabled/focus; no I/O or error state decisions. |
| `lib/public-page-inventory.ts` | SEO slug inventory used sitemap/llms; static no missing data state. |
| `lib/seo-pages.ts` | All5 complete configs/types/metadata builder; UIR-002 FAQ public safety rules; legitimate product/provider identifiers retained. |
| `lib/seo.ts` | NoIndex/schema/JSON-LD serializer escapes <; metadata English machine-facing, no UI error conclusion. |
| `lib/site.ts` | Env/fallback URL trim; invalid env only hypothetical, no incident asserted. |
