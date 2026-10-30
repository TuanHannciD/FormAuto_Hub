# FIX R1 — tích hợp nguồn local và kiểm chứng offline

## Summary

**Verified: chép chính xác 17 tệp FIX R1 vào workspace chính, build và suite offline.** Chỉ xác nhận local source integration theo review GO; không claim DB sync, Done hoặc release.

Nguồn ready UTC `2026-10-29T19:21:41.921857+00:00` (VN 2026-10-30 02:21:41). Binary Release ready UTC `2026-10-29T19:25:51.413244+00:00`. Writer được dispatch **gpt-6.1-sol / high**, children 0; không có API introspection backing model.

Parent `D:/TinHoc/FormAuto_Hub`, branch `ui/compact-refinement-20261028`, HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` giữ nguyên. Không commit/push/merge/reset/clean/checkout/deploy.

## Files changed

- `scripts/db-compatibility/BaselineModelGuard.cs`
- `scripts/db-compatibility/CatalogReader.cs`
- `scripts/db-compatibility/CompatibilityPolicy.cs`
- `scripts/db-compatibility/DbCompatibilityProbe.csproj`
- `scripts/db-compatibility/OfflineScripts.cs`
- `scripts/db-compatibility/Program.cs`
- `scripts/db-compatibility/README.md`
- `scripts/db-compatibility/SchemaBaseline.cs`
- `scripts/db-compatibility/catalog.sql`
- `src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.Designer.cs`
- `src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.cs`
- `tests/FormAutoHub.Tests/BaselineModelGuardTests.cs`
- `tests/FormAutoHub.Tests/DbCompatibilityPolicyTests.cs`
- `tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj`
- `tests/FormAutoHub.Tests/SqlServerMigrationFixture.cs`
- `tests/FormAutoHub.Tests/TopupEvidenceSchemaMigrationTests.cs`
- `tests/FormAutoHub.Tests/TopupEvidenceSqlServerTests.cs`

Hash trước/sau nằm `approved-source-files.json` và `final-validation.json`. Evidence mới chỉ dưới `integration/fix-r1/`: pre-copy/source inventory, review-at-copy, source statuses, command-result JSON và logs build/restore/probe/export, offline TRX, offline generated scripts, final-validation và report này. Build/restore cập nhật ignored bin/obj cho API/tests/probe; binary hashes được lưu. HOLD/candidate thất bại và mọi artifact khác được giữ nguyên.

## Scope alignment

Đã đọc final `fix-r1-review/report.md`: explicit GO exact 17 local integration, main NOT YET. Manifest hash `d1a04e10f045010e3dedf4a5a0764bfc94d71286e18076a0cf06c8775de6b20c`; patch `40d5b3efeec58a4ef0314e3dc61349ddcf33b24186b60c8b8433ae3b4e03b75c`; archive `d5cada3f3cca7a0af69828021ea5718e12de581edce0824f1ee842a9902f5873`.

Trước copy: 1.337 tracked files khớp baseline, source sạch, 0 collision; candidate bytes = archive bytes = frozen hashes. Final: 17/17 parent hashes khớp; không tracked file nào ngoài allowlist thay đổi. Test project là tệp tracked duy nhất modified; 16 paths added. Không sửa old migrations/snapshot/entities/contracts/config; giữ unrelated dirty/untracked/ignored work.

## Validation performed

- **Verified:** exact base/branch/collision/manifest/patch/archive/review/source hashes; `git diff --check` exit 0. Review hash tại copy được lưu ở pre-copy và final-validation; nội dung lưu `review-at-copy.md`.
- **Failed lịch sử:** initial solution build `-c Release --no-restore` exit 1 NETSDK1004 vì probe mới thiếu project.assets.json; giữ log.
- **Verified:** `dotnet restore tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj --source C:/Users/Tuan/.nuget/packages --ignore-failed-sources` exit 0, chỉ cache local; không thêm package/version/network source.
- **Verified:** `dotnet build FormAutoHub.sln -c Release --no-restore` exit 0, 0 errors/3 NU1603 warnings cũ. Solution reference build probe vào Debug; build riêng probe `-c Release --no-restore` exit 0, 0 errors/2 warnings cũ. API/tests Release.
- **Verified offline:** `dotnet test FormAutoHub.sln -c Release --no-build --no-restore --logger trx --results-directory <owned>/test-results` exit 0; **182 passed, 0 failed, 6 SQL groups skipped**, total 188. SQL opt-in environment absent; skips không là SQL pass. TRX parsed lại: passed 182 và 6 NotExecuted outcomes.
- **Verified offline:** parent Release probe `--write-scripts <owned>/offline-scripts --source-commit <base>` exit 0; actual EF `GetMigrations()` trả 13, `HasPendingModelChanges=false`. Generated incremental SHA-256 `dce67d64eeae54917532b6905146b7259f576fbbd1886a8d2699543db6dfb362`, full chain `81e3b60f5d6426303f256e254501a442889e511e912f54841c183d690ca78807`, đúng frozen FIX R1. Chỉ text export, không SQL connection.

Final-check harness có hai assertion cần sửa: trim đầu dòng làm sai porcelain status; TRX summary notExecuted=0 dù 6 outcome NotExecuted. Đã sửa cách đọc evidence và chạy lại toàn bộ kiểm tra; không thay source.

## Validation not performed

**Not run bởi integration writer:** SQL/main apply/applied history query, backup/restore/clean/safety/lock/harness/preservation/negative guards; sole runtime owner sở hữu. Known legacy history ID không nằm current 13 source set; không suy source 13 thành applied history 14. Không API/process/listener/browser startup/restart, role HTTP, hydration/chunks/log smoke. Required runtime gates do root/runtime tiếp tục.

## Risks/Deferred items

NU1603 Google Forms baseline còn nguyên. P2 guard→ALTER X-lock proof và main cutover/backup review cần fresh runtime evidence. Old candidate/old GO vẫn Failed. Offline pass không thay SQL gates. Không tự fix hoặc mở rộng 17 paths.

## Next recommended step

Root/runtime dùng parent source và Release binaries vừa build sau khi main cutover được GO và SQL sync hoàn tất; restart owned API với intended DB rồi chạy actual role HTTP/browser/log smoke. `final-validation.json` là handoff nguồn/binary, không là main permission hoặc release.
