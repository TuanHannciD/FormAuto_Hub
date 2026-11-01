# Review độc lập FIX R1 — migration DB sync

Ngày 2026-10-30; giữ artifact task ngày 2026-10-29. Reviewer mới `/root/db_sync_fix_r1_review`, root dispatch `gpt-6.1-sol / high`, không children; không có API introspection backing model. Skill đã dùng: `formauto-db-risk-reviewer`, `verification-before-completion`.

## Findings theo mức độ

**Không phát hiện blocker mã mới trong candidate R1 đã hash. P1 grammar của candidate cũ đã được loại khỏi source/generated SQL; việc sửa đúng hành vi SQL Server vẫn cần actual execution.** Candidate cũ cùng GO đã rút vẫn Failed, không được sử dụng.

**P2 — validation gate còn mở trước main, không chặn owned rehearsal/local integration:** `tests/FormAutoHub.Tests/TopupEvidenceSqlServerTests.cs`, `Writer_IsBlockedUntilNormalizationTransactionCommits_ThenOversizeRejected` (dòng167): Widen và Up diễn ra trước writer trong cùng transaction, vì vậy Sch-M từ DDL có thể làm ca pass dù thiếu table X lock ở guard. Ca này không tự chứng minh khoảng guard→ALTER được bảo vệ. Runtime cần chuẩn bị max/max rồi **COMMIT trước measured transaction**, xác minh không còn Sch-M, chạy exact raw Up chỉ thêm hook sau byte guard/trước first ALTER; DMV ghi granted OBJECT X trên exact evidence object và writer blocked bởi owner tại hook, trước mọi ALTER trong measured transaction; sau ALTER/COMMIT writer oversize phải lỗi2628/8152. Harness instrumented là evidence, không là SQL apply main. Không yêu cầu product patch khi guard hiện hành đúng.

## Summary / verdict

| Gate | Verdict | Giới hạn |
| --- | --- | --- |
| Candidate source R1 | **GO về review mã** | Exact17paths/hashes trong manifest dưới đây; chỉ3delta so failed candidate,14unchanged. |
| Local integration17files | **GO trong scope local đã giao root** | Copy đúng frozen17files và rehash; giữ unrelated dirty work. First clean actual success đã có và được đọc trước freeze report này. Đây không phải SQL/main/Done/release approval; nếu runtime phát hiện lỗi candidate mới, hold apply và fresh fix/review. |
| B2 owned clean/restored/safety rehearsal | **GO** | Exact SQL hashes, sole runtime owner; refresh identity/schema/session/transaction/files/space. Safety CREATE được review riêng bên dưới. Dừng khi lỗi, không tự sửa frozen SQL/baseline để waive. |
| Main `FormAutoHub` | **NOT YET** | Chờ actual clean/restored/repeat/history/probe/preservation,16expandedSQLcases zero skip,6harness success/error branches, independent rollback/negative guards, direct X-lock proof, exact main wrapper/hash và fresh cutover/backup review. |

## Frozen identity

Source checkout `C:/Users/Tuan/.t3/worktrees/FormAuto_Hub/t3-ecd39b00`, base `a19f7a2f3dc1bc54ff645d662d94fc614439256a`, uncommitted patch. Manifest: `implementation-fix-r1/manifest.json` dưới task artifact root,17/17files đối chiếu trực tiếp thành công. `verification/source-hashes.json` giữ exact per-file bytes; `artifact-hashes.json` và `binary-hashes.json` giữ artifacts/assemblies.

| Artifact | SHA-256 |
| --- | --- |
| Full17patch | `40d5b3efeec58a4ef0314e3dc61349ddcf33b24186b60c8b8433ae3b4e03b75c` |
| Source archive | `d5cada3f3cca7a0af69828021ea5718e12de581edce0824f1ee842a9902f5873` |
| Incremental | `dce67d64eeae54917532b6905146b7259f576fbbd1886a8d2699543db6dfb362` |
| Idempotent full chain | `81e3b60f5d6426303f256e254501a442889e511e912f54841c183d690ca78807` |
| Raw Up | `69d79032c5d95ce1bc99cf574fccae738e27b5e72d33b5540dc50030e8b27356` |
| Session timeout harness | `26d16ff1264e47320940b02f057956c4c0d8199430b2571bd8b1c89c977aecbe` |
| Safety CREATE wrapper | `089652bfbafd8bb92693051ff523c735942b63d4310a73c7447749231c8a3a93` |

Final R1 report hash `20419782cc1500525f0dabb91c778be02db575601117980356b5268aee4d45b1`; manifest hash `d1a04e10f045010e3dedf4a5a0764bfc94d71286e18076a0cf06c8775de6b20c`.

## Scope alignment / phân tích

- Đọc trực tiếp cả3delta từ old frozen archive và full current handwritten source/tests/probe;14unchanged files đối chiếu old manifest và prior independent review, không giả coi review cũ là proof SQL. New designer body so snapshot bằng nhau;23oldtracked migration/designer/snapshotfiles so base unchanged. Không model/context/entity/service/DTO/controller change.
- Whole Up nằm trong **một** `sys.sp_executesql` constant; apostrophes được double trước quote, không input/identifier interpolation. `SET LOCK_TIMEOUT 15000` hợp grammar; không còn SET dùng biến ở branch nào. Không dùng nested EXEC chỉ để restore (sẽ tự restore sai setting về caller). Microsoft excerpt cho SET dynamic scope phù hợp hướng sửa; theory/harness cần xác nhận trên target.
- Transaction caller được chia sẻ, guard `@@TRANCOUNT`, `TABLOCKX,HOLDLOCK`, shape/byte guards và hai conditional ALTER cùng dynamic scope. Không suppress transaction/commit sớm/catch thay original errors. SET scope kết thúc không kết thúc transaction hoặc giải phóng transaction X lock; lock vẫn cần actual DMV proof. Incremental history INSERT ở ngoài dynamic batch nhưng trong cùng BEGIN/COMMIT; full-chain idempotent IF bọc EXEC với quoting đúng.
- Chỉ narrow max→200/50; DATALENGTH400/100 bảo vệ trailing spaces/supplementary UTF-16; unexpected type/nullability/collation fail-closed. Không business INSERT/UPDATE/DELETE, index/FK/RowVersion DDL, history delete hoặc truncation. Raw Up không ghi history; incremental ghi đúng một normalization ID. Full-chain repeat dựa exact history IDs, không count equality.
- New timeout theory giữ SET/Up/observation trong cùng caller batch, tránh connection reset che leaked setting; -1/0/4321 mỗi case kiểm success và original51003/state1/message. Harness dùng shape51002, exact safety identity, không history/business rows, ALTER201 rollback; cả6success/error branches cần runtime pass.
- PRE chỉ exact planned pending và hai max allowances/canonical; POST pending0/canonical200/50. Exact known legacy history/twoindexshapes INFO, unknown/wrong-shape BLOCKING. Không false count gate. Baseline provenance/clean chain/catalog và current relational storage kiểm độc lập. Down vẫn fail-fast trước legacy Down; recovery forward/verifiedbackup, không widen đoán hoặc restore đè main.
- `runtime/stage-04-safety-db.sql` chỉ master→exact new owned `FormAutoHub_FAHERR001_safety_20261029_a19f7a2`, server hardguard `DESKTOP-TS5JR7L`, name/MDF/LDF absence guards, explicit unique DATA paths/collation, không DROP/REPLACE hoặc target substitution. **GO tạo safety DB** trong quyền local đã giao, sau fresh absence/identity/files/space/session checks; old absence sample không giữ chỗ. Không cleanup DB/evidence.

## Exact files được GO local integration

1. `scripts/db-compatibility/BaselineModelGuard.cs`
2. `scripts/db-compatibility/CatalogReader.cs`
3. `scripts/db-compatibility/CompatibilityPolicy.cs`
4. `scripts/db-compatibility/DbCompatibilityProbe.csproj`
5. `scripts/db-compatibility/OfflineScripts.cs`
6. `scripts/db-compatibility/Program.cs`
7. `scripts/db-compatibility/README.md`
8. `scripts/db-compatibility/SchemaBaseline.cs`
9. `scripts/db-compatibility/catalog.sql`
10. `src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.Designer.cs`
11. `src/FormAutoHub.Api/Data/Migrations/20261029142938_NormalizeTopupEvidenceColumnLengths.cs`
12. `tests/FormAutoHub.Tests/BaselineModelGuardTests.cs`
13. `tests/FormAutoHub.Tests/DbCompatibilityPolicyTests.cs`
14. `tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj`
15. `tests/FormAutoHub.Tests/SqlServerMigrationFixture.cs`
16. `tests/FormAutoHub.Tests/TopupEvidenceSchemaMigrationTests.cs`
17. `tests/FormAutoHub.Tests/TopupEvidenceSqlServerTests.cs`

## Validation performed

Reviewer chạy từ isolated checkout, evidence riêng `fix-r1-review/verification/`:

- **Verified:** fresh focused `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release --no-build --no-restore --filter 'FullyQualifiedName~DbCompatibilityPolicyTests|FullyQualifiedName~BaselineModelGuardTests|FullyQualifiedName~TopupEvidenceSchemaMigrationTests' --logger trx --results-directory <owned-review>/focused-tests`: exit0,24passed/0failed/0skipped. TRX+log giữ nguyên. Kiểm migration discovery/model false/Down/policy/storage; không SQL execution.
- **Verified:** direct Release probe offline `--write-scripts <owned-review>/regenerated-sql --source-commit <base>`: exit0,current13/modelPending=false, incremental/fullchain bằng exact new hashes. Đã đọc whole incremental, normalization block trong full chain và full session harness; text export không là parser test.
- **Verified:**17source/patch/archive/SQL/harness/safetywrapper/binaries hashes match manifests;3changed/14unchanged;23oldtracked migration files unchanged;designerbody=snapshot. `git diff --check`, `git apply --check --reverse <newpatch>` exit0. Giữ bản verification JSON.
- **Evidence author đã đọc, không diễn đạt thành reviewer chạy:** R1 red regression1fail đúng badgrammar trước sửa; build0errors và full182pass/6SQLgroupsskip. NU1603 cũ còn nguyên. Reviewer không lặp fullsuite/build vì không có lỗi mới cần mở rộng checks.
- **Verified qua actual evidence của sole runtime owner, không phải reviewer SQL execution:** `runtime/b2-clean-chain-I.log` không còn Msg102; root báo command exit0 với cùng frozen full-chain hash. `b2-capture-baseline.log` có actual clean identity, current/applied13 đúng sets, pending0/modelPendingfalse và đúng chain/planned/API hashes. Clean baseline file hash được reviewer tính lại: `5fc4a8014e452a4338a0f32d993a8f5d6a533f7f30e4e2aee6f0e028dda74d61`. Chấp nhận provenance baseline cho B2 tiếp tục. Attempt `b2-clean-chain.log` trước đó Failed1934 do sqlcmd QUOTED_IDENTIFIER OFF; runner retry `-I` ON giữ nguyên SQL hash, corrected session log xác nhận1. Giữ failure evidence; dùng `sqlcmd -I -b` cho tiếp tục rehearsal/main wrapper. Đây không phải candidate source correction. Existing historical index maximum-key-length warnings giữ nguyên, không biến thành nhiệm vụ redesign.
- Đã đọc README/AGENTS/authority/execution/quality/routing/source rules, approved design/preflight review, prior independent code review+withdrawal, runtimeStageBfailure/checkpoint, R1finalreport/manifest/harness và task context. Main/clone state do runtime owner xác nhận, không từ reviewer SQL query.

## Validation not performed

**Not run bởi reviewer theo ownership:** SQL connection/parser/query/DDL/DML. Actual clean execution được chứng minh bằng runtime evidence nói trên; comprehensive B2 vẫn chưa hoàn tất review:16expandedcases/harness6branches, restored/safety/repeat, data/ledger/links/bytes/RowVersion/history equality, independent rollback/negative guards/X-lock proof. Không claim whole fix runtime/DB sync Verified. Main apply, API restart/roleHTTP/browser hydration/chunks/log smoke, integration/release cũng chưa xác nhận. Main/Done gate còn mở dù local source integration được review GO.

## Files changed / Risks / Next recommended step

Reviewer chỉ tạo `fix-r1-review/report.md` và bounded `verification/` evidence; không source/DB/process/dependency/Git/remote/cleanup mutation. Không dispatch child. Reports cũ preserved. Deferred:23auditrepairs, legacy index semantics/workload, NU1603repair, userDBoverwrite recovery, providers/production/release.

Sole runtime owner tiếp tục B2 exacthashes,16cases zero skip +harness6branches và lock proof max baseline chuẩn bị/committed riêng; root localintegrate exact17files theo GO trên. Fresh runtime evidence phải được review trước mainGO; cần exactmainwrapper/cutover/backup checkpoint riêng. Sau actual sync+runtime smoke mới tiếp tục audit và đánh giá Done, không suy release từ localcompletion.
