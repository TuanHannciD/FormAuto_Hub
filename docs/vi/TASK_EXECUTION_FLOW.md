# TASK_EXECUTION_FLOW

## Mục đích

Định nghĩa luồng xử lý mặc định cho công việc trong FormAuto Hub.

## Luồng mặc định

1. Nhắc lại task.
2. Xác định active phase.
3. Đọc routing docs và tài liệu liên quan.
4. Xác định module và ownership bị ảnh hưởng.
5. Tách rõ confirmed rules, assumptions và Deferred items.
6. Kiểm tra boundary an toàn và chống abuse.
7. Kiểm tra tác động API/database contract.
8. Đề xuất hoặc implement thay đổi nhỏ nhất an toàn.
9. Validate theo loại thay đổi.
10. Báo rõ đã đổi gì, không đổi gì, đã test gì, chưa test gì.

## Quy tắc escalation

Escalate trước khi implement khi:

- requirement còn mơ hồ
- cần quyết định database
- cần chốt API contract
- cần auth hoặc JWT claim behavior
- có yêu cầu Google OAuth hoặc official Google Forms API
- có yêu cầu payment gateway
- có yêu cầu AI generation hoặc mapping
- có yêu cầu refund behavior sau failed submission
- có yêu cầu chọn frontend framework

## Luồng chia việc

Với task nhiều phần, tách thành:

- requirement analysis
- module routing
- contract review
- database review
- implementation
- validation
- review
- documentation sync

Không gộp analysis, implementation và review thành một claim chưa verify.

## Điều kiện dừng

Dừng khi task sẽ:

- làm yếu safety rules
- bật hành vi abuse
- vượt current phase khi chưa duyệt
- âm thầm chốt contract đề xuất
- implement Deferred work
- chỉ sửa một language layer

