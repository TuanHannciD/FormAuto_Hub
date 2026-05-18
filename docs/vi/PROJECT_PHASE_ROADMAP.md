# PROJECT_PHASE_ROADMAP

## Mục đích

Định nghĩa phase triển khai và scope gate cho FormAuto Hub.

## Current Phase

Current phase: **Phase 6 - Production integrations**.

## Phase 0 - Documentation and scope baseline

Status: Completed baseline, chờ doc sync sau này khi cần.

Bao gồm:

- documentation architecture
- AI execution docs
- Vietnamese human docs
- module map
- phase roadmap
- safety và non-goal baseline
- proposed API/entity documentation

Exit criteria:

- required docs tồn tại trong `docs/ai` và `docs/vi`
- docs đồng bộ về nghĩa
- Deferred items được label rõ
- stale conflicting docs đã được gỡ

## Phase 1 - Backend foundation

Status: Completed.

Bao gồm:

- ASP.NET Core Web API .NET 9 project
- controller-based API baseline
- SQL Server connection
- EF Core setup
- initial entities
- EF Core migrations

Current completed subset:

- solution scaffold
- ASP.NET Core Web API .NET 9 project
- controller-based API pipeline
- SQL Server EF Core package setup
- minimal `FormAutoHubDbContext`
- safe connection string placeholder không chứa secrets
- xUnit test project
- initial conceptual entities từ `DOMAIN_ENTITIES_OVERVIEW.md`
- initial EF Core migration
- local `dotnet-ef` 9.0.16 tool manifest
- migration validation trên temporary LocalDB database

Không bao gồm:

- payment gateway
- Google OAuth
- AI answer generation
- production background job framework

## Phase 2 - Account and credit management

Status: Completed.

Bao gồm:

- users
- credit accounts
- credit packages
- top-up orders
- admin approval/rejection
- credit transactions
- usage logs
- dashboard summary API
- dashboard account areas: overview, top-up credits, top-up orders, tool usage history, credit transactions, profile
- dashboard summary cards: current credit balance, total credits deposited, total credits used, pending top-up orders
- dashboard recent panels: recent top-up orders, recent tool usage

Không bao gồm:

- payment gateway integration
- package management UI khi chưa duyệt
- admin user management UI khi chưa duyệt
- manual credit adjustment khi chưa duyệt

## Phase 3 - Form automation MVP

Status: Completed.

Bao gồm:

- Google Form URL analysis
- question detection
- entry ID detection khi available
- MVP question types: short text, paragraph text, multiple choice, checkbox, dropdown, linear scale, rating, multiple choice grid, checkbox grid, date, time
- Deferred question type: file upload, vì Google yêu cầu đăng nhập với form upload file
- MVP answer-generation modes: random equally, random by percentage, random by quantity, sample text lines cho text answers, khoảng ngày tuần tự, khoảng giờ tuần tự
- answer rules
- response preview
- controlled submission
- usage logging
- submission logs
- giới hạn 1 đến 100 generated responses mỗi action, với submission xử lý tuần tự theo batch 10

Không bao gồm:

- captcha bypass
- proxy rotation
- fake accounts
- unauthorized submission
- AI answer generation khi chưa duyệt
- official Google Forms API/OAuth khi chưa duyệt

## Phase 4 - Safety and validation hardening

Status: Completed.

Bao gồm:

- rate limiting
- validation tốt hơn
- error handling
- audit logs
- anti-abuse constraints
- submission safety tốt hơn

Không bao gồm:

- production integrations khi chưa duyệt rõ

## Phase 5 - Frontend dashboard and tool UI

Status: Completed.

Bao gồm:

- dashboard/account management UI
- form automation UI
- preview-before-submit UI
- top-up order UI
- profile UI

Frontend framework: Next.js web dashboard.

## Phase 6 - Production integrations

Status: Current.

Deferred trừ khi được duyệt rõ:

- Google OAuth
- official Google Forms API
- payment gateway
- background job framework
- AI mapping/generation
- webhook integrations
- production deployment platform

## Phase Rule

Task ngoài active phase cần approval rõ hoặc phải thu hẹp về safe in-phase subset.
