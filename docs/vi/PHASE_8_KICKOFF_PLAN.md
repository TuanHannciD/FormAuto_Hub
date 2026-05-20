# PHASE_8_KICKOFF_PLAN

## Mục đích

Định nghĩa phạm vi kickoff cho Phase 8: vận hành admin, báo cáo doanh thu và nạp credit tự động qua PayOS.

## Mục tiêu phase

Xây khu vực admin riêng và chuyển luồng nạp credit của MVP từ chỉ xử lý thủ công sang luồng tự động ưu tiên PayOS.

## Scope đã chốt

- Khu vực admin riêng cho quản lý tài chính và vận hành.
- Dashboard admin cho doanh thu, top-up orders, credit đã bán, credit đã dùng và trạng thái thanh toán.
- PayOS là payment provider đầu tiên được duyệt.
- User có thể bắt đầu nạp credit và hệ thống tạo PayOS payment link.
- PayOS callback/webhook dùng để xác nhận kết quả thanh toán.
- Bắt buộc xác minh tính hợp lệ của PayOS trước khi cộng credit.
- Chỉ tự động cộng credit sau khi xác nhận được PayOS event đã thanh toán hợp lệ.
- PayOS callback/webhook lặp lại không được cộng trùng credit.
- Mọi lần cộng credit tự động phải ghi ledger `CreditTransactions`.
- Trạng thái top-up order phải phản ánh kết quả thanh toán đã xác minh.
- Admin xem được lịch sử thanh toán và lịch sử credit transaction.

## Actors

- Admin user: xem doanh thu, top-up orders, kết quả thanh toán và hoạt động credit.
- Normal user: bắt đầu nạp credit qua PayOS từ dashboard.
- PayOS: payment provider bên ngoài để tạo payment link và xác nhận thanh toán.

## Khu vực bị ảnh hưởng

- Khu vực frontend cho admin.
- Workflow top-up order.
- Workflow credit management.
- Payment integration service cho PayOS.
- API contracts cho admin reporting và PayOS top-up flow.
- EF Core persistence cho payment metadata được duyệt.
- Validation và test coverage cho payment verification và idempotency.

## Contract guardrails

- Không chốt API contracts trước khi từng endpoint được review.
- Không thêm database fields trước khi entity và migration plan được review.
- Không tự bịa payment statuses khi chưa review lifecycle.
- Không lưu PayOS secrets trong source-controlled configuration.
- Không cộng credit từ callback/webhook chưa xác minh.
- Không bỏ qua `CreditTransactions`.
- Không làm yếu anti-abuse hoặc unauthorized submission rules.

## Delivery slices đề xuất

1. Admin area shell và authorization guard.
2. Admin revenue và credit reporting read models dùng dữ liệu hiện có.
3. PayOS configuration model và environment setup plan.
4. Tạo PayOS payment link cho top-up orders.
5. Xác minh PayOS callback/webhook và xử lý payment idempotent.
6. Tự động cộng credit qua credit transaction discipline hiện có.
7. Admin payment history và reconciliation view.
8. Validation end-to-end và Phase 8 closeout docs.

## Validation expectations

- Backend build.
- Frontend build.
- Unit tests cho PayOS verification và idempotency.
- API tests cho tạo top-up, xử lý callback và callback lặp lại.
- Ledger validation để bảo đảm mọi lần cộng credit tự động đều ghi `CreditTransactions`.
- Admin authorization tests.
- Manual hoặc mocked PayOS sandbox smoke khi có credentials.

## Assumptions

Assumption: PayOS là payment provider đầu tiên cho Phase 8.

Assumption: Tên credential PayOS, dữ liệu dùng để verify webhook signature và payment payload shape phải được xác nhận từ tài liệu PayOS trước khi implement.

Assumption: Nên tái sử dụng top-up và credit entities hiện có khi có thể, nhưng mọi field mới phải được review trước migration.

## Deferred

- VNPay, MoMo, Stripe hoặc payment provider khác.
- Subscription billing.
- Automated refund behavior.
- Manual credit adjustment nếu chưa duyệt riêng.
- Package management UI nếu chưa duyệt riêng.
- Admin user management UI nếu chưa duyệt riêng.
- Official Google Forms API.
- Google Forms watches hoặc background sync.
- AI mapping/generation.
- Production background job framework trừ khi task PayOS chứng minh là cần.
