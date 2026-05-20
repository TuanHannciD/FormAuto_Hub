# FRONTEND_STYLE_GUIDE

## Mục đích

Định nghĩa UI baseline và hướng phong cách giao diện đã duyệt cho frontend dashboard của FormAuto Hub sau này.

File này chỉ kiểm soát style UI. File này không tự phê duyệt việc implement frontend mới.

## UI baseline đã duyệt

- Frontend framework: Next.js web dashboard.
- UI baseline: shadcn/ui với Tailwind CSS.
- Icon baseline: lucide-react.
- Hướng component: dùng shadcn/ui components và patterns cho MVP dashboard/admin UI.

## Hướng UI sản phẩm

FormAuto Hub nên có cảm giác là dashboard vận hành, không phải website marketing.

Copy trên UI mặc định phải dùng tiếng Việt rõ ràng, dễ hiểu. Chỉ dùng tiếng Anh khi bất khả kháng, ví dụ tên sản phẩm, provider, giao thức, code, hoặc định danh kỹ thuật như PayOS, API, webhook, JWT, URL, hoặc tên field.

Nên dùng:

- layout gọn nhưng dễ đọc
- navigation rõ ràng
- tables cho dữ liệu lịch sử và dữ liệu dạng danh sách
- cards cho metrics và summary lặp lại
- forms cho account, profile, top-up, và cấu hình rule
- dialogs hoặc sheets cho action tập trung
- badges cho statuses và roles
- toasts cho feedback ngắn

Tránh:

- landing-page hero sections bên trong app
- marketing gradients lớn
- minh họa trang trí không hỗ trợ workflow
- animation quá đà
- layout card-inside-card
- giấu business actions sau icon không rõ nghĩa

## Quy tắc layout

- Dùng dashboard shell cho các khu vực app đã đăng nhập.
- Ưu tiên sidebar kèm header nội dung ở các trang quản trị.
- Giữ nội dung trang dễ scan và tập trung vào action.
- Dữ liệu lặp lại nên đặt trong tables hoặc compact lists.
- Forms nên nhóm theo task, không nhóm máy móc theo database table.
- Giữ luồng preview-before-submit cho UI form automation.
- Không tạo frontend pages ngoài phase hoặc task scope đã duyệt.

## Quy tắc component

Dùng component theo hướng shadcn/ui cho:

- buttons
- inputs
- selects
- checkboxes
- switches
- tabs
- cards
- tables và data tables
- dialogs
- sheets
- dropdown menus
- badges
- alerts
- skeletons
- toasts
- pagination
- breadcrumbs
- sidebar navigation

Không tạo UI primitive riêng khi shadcn/ui component đã đủ dùng.

## Phong cách thị giác

- Ưu tiên neutral backgrounds với accent color tiết chế.
- Dùng semantic colors cho success, warning, destructive, info, và muted states.
- Dùng spacing nhất quán theo Tailwind CSS scales.
- Dùng border radius vừa phải, nhất quán với shadcn/ui defaults.
- Typography rõ ràng và tiết chế.
- Không dùng hero-scale typography trong dashboard panels.
- Giữ contrast đủ tốt cho text, controls, và status badges.

## UI cho dữ liệu và state

Mỗi trang có dữ liệu cần định nghĩa:

- loading state
- empty state
- error state
- success hoặc saved state khi phù hợp
- permission hoặc unavailable state khi phù hợp

Với tables và history pages, cần có:

- column names rõ ràng
- status badges
- hiển thị date/time
- pagination hoặc explicit limit behavior trước khi dùng production

## Style dashboard Phase 2

UI account và credit trong Phase 2 nên ưu tiên:

- overview metric cards
- chọn top-up package
- tạo top-up order và xem order history
- màn hình admin approve/reject top-up chỉ khi được duyệt
- usage log và credit transaction tables
- forms profile và đổi mật khẩu

Payment gateway UI vẫn là Deferred.

Package management UI, admin user management UI, và manual credit adjustment UI vẫn là Deferred trừ khi được duyệt rõ.

## UI reference đã generate

Trước khi implement page đã có Stitch-generated design, cần đọc:

- `docs/vi/UI_DESIGN_ARTIFACTS.md`
- `docs/design/stitch/<page-slug>/README.md` tương ứng
- `docs/design/stitch/<page-slug>/screen-map.md` tương ứng
- `docs/design/stitch/<page-slug>/notes.md` tương ứng khi có

UI artifact đã generate chỉ là design reference. Chúng không tự phê duyệt scope implement frontend mới và không định nghĩa API, DTO, database, status, event hoặc lifecycle contract.

Dùng screenshot làm visual reference chính. Dùng HTML export chỉ để kiểm tra layout.

## Gate trước khi implement frontend

Trước khi tạo frontend files, cần xác nhận:

- task duyệt rõ frontend implementation
- page hoặc component bị ảnh hưởng nằm trong phase hoặc đã được duyệt rõ
- API contracts đã được duyệt hoặc được đánh dấu temporary rõ ràng
- UI không làm yếu anti-abuse rules
- UI giữ preview và confirmation requirements khi liên quan
- UI copy ưu tiên tiếng Việt và tránh label tiếng Anh không cần thiết

## Quy tắc đồng bộ tài liệu

Mọi thay đổi frontend UI baseline phải cập nhật cả:

- `docs/ai/FRONTEND_STYLE_GUIDE.md`
- `docs/vi/FRONTEND_STYLE_GUIDE.md`
