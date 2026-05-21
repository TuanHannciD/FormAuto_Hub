# PHASE_9_KICKOFF_PLAN

## Mục đích

Định nghĩa scope kickoff cho Phase 9: debug full-stack, smoke test sâu bằng người dùng thật, và báo cáo lỗi trên cả API lẫn UI.

## Mục tiêu phase

Chạy FormAuto Hub như một người dùng thật đang sử dụng hệ thống, với runtime thật và dữ liệu test thật đã duyệt, để moi lỗi backend, frontend, integration, data consistency và UX trước khi chọn phase tính năng tiếp theo.

Phase 9 là phase validation và debug. Phase này không duyệt tính năng sản phẩm mới, API contract mới, database field mới hoặc production integration mới.

## Scope đã chốt

- Restart và chạy process API/web thật trước khi smoke test.
- Dùng database target thật đã được duyệt cho phase này.
- Apply EF Core migrations cần thiết trước khi smoke các hành vi phụ thuộc database.
- Dùng Playwright để test UI thật trên browser, gồm hydration, navigation, form, guard và lỗi visual/layout.
- Test backend API bằng HTTP request thật với đúng session user/admin đã xác thực.
- Chạy luồng user chính từ register/login qua dashboard, form automation, preview, controlled submission, logs, credit ledger và top-up.
- Chạy luồng admin cho overview, payments, revenue, PayOS settings và credit package management.
- Dùng Google Form test URL đã duyệt cho live form-analysis và workflow smoke:
  `https://docs.google.com/forms/d/e/1FAIpQLSeNXy2Qycx9Dz2Rym8-Aqx4poqc_4fGLCPPFyTEKkJxa2VBtg/viewform?usp=header`
- Tạo checkout PayOS thật cho package 2.000 VND đã duyệt.
- Dừng sau khi tạo PayOS payment link và báo link thanh toán cho user.
- Chỉ tiếp tục verify payment cuối cùng sau khi user xác nhận đã thanh toán thật.
- Tạo báo cáo tách rõ mục OK, lỗi, cảnh báo, blocked và not run.

## Quy tắc dữ liệu thật

Phase 9 không được thay thế workflow người dùng thật bằng random fake data.

Dữ liệu setup được phép:

- test user account có tên rõ, được tạo qua register thật hoặc setup path đã duyệt
- admin account do user cung cấp hoặc tạo qua setup path đã duyệt
- credit packages đã duyệt, gồm package 2.000 VND dùng cho PayOS smoke
- Google Form live URL đã duyệt
- PayOS settings thật đã được project owner cấu hình
- input test có kiểm soát để kiểm tra validation và edge cases

Không được phép:

- bypass flow app bình thường bằng database-only state nếu không document rõ
- claim workflow đã pass bằng mocked data khi runtime smoke thật là bắt buộc
- dùng public form khác thay thế khi chưa được user duyệt
- cộng credit thủ công để che lỗi payment hoặc ledger

## Actors

- Normal user: register hoặc login, dùng dashboard, tạo preview, submit có kiểm soát, và bắt đầu top-up PayOS.
- Admin user: xem report, payments, revenue, PayOS settings và credit packages.
- PayOS: payment provider bên ngoài dùng cho checkout thật và xác nhận sau thanh toán.
- Google Forms: bề mặt public form bên ngoài dùng cho live form analysis và controlled submission smoke.

## Flow chạy một lượt

1. Chuẩn bị môi trường
   - cài hoặc kiểm tra Playwright
   - build backend và frontend
   - apply migrations vào database test đã duyệt
   - start hoặc restart API và web app processes
   - ghi lại API URL, web URL, database target và ghi chú môi trường

2. Setup user thật
   - register hoặc login bằng normal user
   - verify JWT/session behavior
   - verify starting credit hoặc trạng thái credit hiện tại
   - login bằng admin để kiểm tra admin-only

3. API smoke
   - verify auth endpoints
   - verify dashboard summary
   - verify packages và top-up routes
   - verify profile routes
   - verify form automation routes
   - verify logs và ledger routes
   - verify admin routes bằng admin và non-admin sessions

4. Playwright UI smoke
   - verify login/register pages
   - verify dashboard routes render, hydrate và load chunks
   - verify user navigation, form, validation và error states
   - verify form automation UI từ analysis đến preview và confirmation
   - verify admin pages và role guards
   - chụp screenshot cho defect và layout warning

5. Live Google Form workflow
   - analyze Google Form URL đã duyệt
   - verify questions detected và question types được support/không support
   - cấu hình answer rules
   - generate preview
   - verify credit chỉ bị trừ sau khi preview generation thành công
   - verify preview UI và generated responses đã lưu
   - verify controlled submission với explicit confirmation và response count an toàn

6. Data consistency checks
   - verify `CreditTransactions` khớp balance changes
   - verify `UsageLogs` được ghi với status trung thực
   - verify `SubmissionLogs` được ghi cho submission attempts
   - verify top-up order và payment record states nhất quán

7. Admin checks
   - verify admin overview metrics
   - verify revenue report
   - verify payment list
   - verify PayOS settings masking và setup guidance
   - verify package create/update/active-state behavior
   - verify normal user không vào được admin UI hoặc admin APIs

8. PayOS payment checkpoint
   - tạo checkout link PayOS cho package 2.000 VND đã duyệt
   - dừng lượt chạy
   - báo payment link cho user
   - chờ user xác nhận đã thanh toán thật

9. Hoàn tất sau thanh toán
   - verify webhook/payment confirmation sau khi user thanh toán
   - verify credit được cộng tự động
   - verify idempotency nếu quan sát được event lặp hoặc có thể replay an toàn
   - verify màn hình admin payment và revenue cập nhật
   - hoàn thiện báo cáo Phase 9

## Ma trận moi lỗi sâu

### Auth và session

- register bằng email đã tồn tại
- login sai mật khẩu đến khi lockout phải áp dụng
- refresh access token hết hạn
- logout rồi thử dùng lại session cũ
- normal user thử vào admin routes
- admin session hết hạn hoặc refresh giữa admin workflow

### Credit và top-up

- thiếu credit thì preview generation bị chặn
- preview failed không trừ credit
- preview thành công trừ đúng số credit
- reload trang sau khi tạo top-up order
- payment cancelled hoặc failed không cộng credit
- webhook PayOS lặp lại không cộng trùng credit
- inactive packages bị ẩn khỏi normal user
- package 2.000 VND tạo đúng PayOS payment link

### Google Form analysis

- Google Form URL đã duyệt pass hoặc báo blocker bên ngoài cụ thể
- invalid URL fail an toàn
- form không public fail an toàn
- question type không support được nhận diện mà không gây unsafe behavior
- thiếu entry ID được báo trung thực
- required fields được xử lý an toàn
- mixed question types được analyze
- analyze lại cùng một form không làm hỏng project data

### Answer rules và preview

- response count ở 1, 10 và 100
- response count ở 0 và 101 bị reject
- random percentage total không hợp lệ khi không khớp rule
- random quantity total không hợp lệ khi không khớp response count
- checkbox min/max validation reject giá trị bất khả thi
- text sample rỗng, dài và nhiều dòng được xử lý an toàn
- date/time range bị đảo chiều thì reject
- time step không hợp lệ thì reject
- preview lại sau khi sửa rules cập nhật đúng state
- reload sau preview vẫn giữ submission behavior an toàn

### Submission

- submit trước preview bị reject
- submit khi chưa confirm bị reject
- response đã submit không được submit lại
- cancel behavior được test nếu đã support
- partial success/failure được báo trung thực
- batch size 10 và total limit 100 được giữ nguyên
- không có captcha bypass, proxy rotation, fake-account hoặc unauthorized submission behavior

### UI và Playwright

- desktop viewport
- tablet viewport
- mobile viewport
- hydration và static chunks load
- loading, empty và error states render
- validation messages hiển thị rõ
- double-click không tạo duplicate dangerous actions
- browser back và refresh không làm hỏng state
- modal, accordion và table overflow được kiểm tra
- tiếng Việt không làm vỡ layout
- admin/user navigation guards hoạt động trên UI

### Admin và reporting

- admin overview phản ánh top-up/payment/credit data
- payment list phản ánh PayOS states
- revenue report dùng payment data đã verify
- raw PayOS secrets không bao giờ hiển thị
- package create/update validation hoạt động
- normal user gọi admin API bị reject

### Data consistency

- credit balance khớp `CreditTransactions`
- usage actions tạo `UsageLogs`
- submissions tạo `SubmissionLogs`
- top-up order status khớp payment record status
- retry hoặc duplicate event không tạo duplicate ledger entries

## Format báo cáo

Báo cáo Phase 9 phải dùng các severity labels:

- `P0 Blocker`: app không dùng được, payment/credit sai, mất dữ liệu, security bypass hoặc lộ auth/admin nghiêm trọng
- `P1 High`: workflow chính của user/admin/payment/form bị fail
- `P2 Medium`: workflow bị ảnh hưởng nhưng có workaround
- `P3 Low`: polish, copy, layout hoặc lỗi không blocking
- `OK`: đã kiểm tra và pass
- `Not run`: chưa chạy, kèm lý do
- `Blocked`: không chạy được vì credentials, database, external platform, tunnel, payment hoặc environment

Mỗi finding phải có:

- area
- severity
- ảnh hưởng với user
- bước reproduce
- expected result
- actual result
- evidence, như screenshot, HTTP status, response excerpt, console error hoặc log excerpt
- next action đề xuất

## Điều kiện dừng

Dừng và báo trước khi tiếp tục khi:

- đã tạo real PayOS payment link và cần user thanh toán
- database target chưa rõ hoặc không an toàn
- thiếu admin credentials
- thiếu PayOS settings hoặc cần lộ raw secrets
- bề mặt Google Form bên ngoài chặn test theo cách làm thay đổi expected behavior
- phát hiện P0 có thể làm hỏng credit, payment, auth hoặc submission data

## Deferred

- Tính năng sản phẩm mới.
- API contract mới.
- Database field hoặc migration mới trừ khi có task fix riêng duyệt.
- Payment provider khác PayOS.
- Subscription billing.
- Automated refunds.
- Official Google Forms API.
- Google Forms watches hoặc background sync.
- AI mapping/generation.
- Production background job framework.
- Tự động fix bug trong lượt test Phase 9 trừ khi được duyệt riêng.

## Validation expectations

- Backend build.
- Backend tests.
- Frontend build.
- Frontend lint.
- Playwright browser smoke.
- Real HTTP API smoke.
- Database migration state check.
- Kiểm tra server log và browser console.
- Payment checkpoint và post-payment verification sau khi user xác nhận.
