# Task 3 brief — FAH-HISTORY-001

## Authority / snapshot

User approved continued Task3 execution after plain-language explanation of20 account-wide runs and0/1/2 creation fees. Read IMPLEMENTATION_PLAN.md Task3 and Global Constraints, INDEX.md, CONTRACTS.md, DB_REVIEW.md, PROGRESS.md and TASK2_REPORT.md. Latest approval notes override historical proposal/pending labels. Preserve all existing tracked/untracked/ignored work. Task2 reviewed foundation is uncommitted on branch fah-history-001 at base df5cce54f4a8516ab9dd0bf2b5dff561c1cb8d5c.

Frozen Task3 starting snapshot: artifacts/reports/fah-history-001/task3-baseline-20261105-123140/ (37 source/test SHA256). Fresh baseline filter AiGenerationServiceTests|Phase3FormAutomationTests|GenerationCreditReservationTests:50 passed/0 failed/0 skipped; log task3-baseline.log;3 existing NU1603 warnings.

## Implement Task3 only

- Rules generation0, default AI1, custom AI2 per valid persisted response. No deduction0 call, rules100 allowed at balance0, count1..100. AI partial charges valid committed count only; zero output no batch/debit/eviction.
- Shared GenerationBatchWriter.AppendBatchAsync and owner-scoped GenerationHistoryService list/detail with reviewed signatures/DTOs. Account-wide20 newest by SQL CreatedAt DESC,Id DESC. Run21 logically evicts oldest; no payload/audit/ledger deletes. Each successful request/supplement is one run. Snapshots/policy/membership immutable. Unproven legacy grouping never guessed.
- Persist batch+responses+generation debit+usage+retention in one ordered-lock local transaction. Preserve Task2 account-first Users/account/project/batch/item locking; only local SQL retries; AI/provider calls outside retries. Stable IDs/completion time and exact-membership replay checking per DB_REVIEW. Failed append cannot evict. Keep Task2 availability/settlement/evidence durability fixes.
- Owner-scoped pagination10 default, page>=1,pageSize1..20; detail<=100; expired/unowned absent; no raw AI/provider audit. Existing project-response recovery must not re-expose evicted batches. History observations may be Partial; unknown required/constraints/receipt must remain honest, incomplete observation must not block creation.
- Preserve actual generation expenditure semantics in AI analytics. Generation DTO additions exact reviewed fields; source modes/statuses unchanged. New generation uses SeparatedV1, no legacy backfill/entitlement guesses.
- No Task4 sending/resending/classifier/settlement integration or Task5 UI. Current direct send consumer is transitional until Task4; do not activate/send through live providers or claim unchanged end-to-end pricing before integration. Raise specific cross-task boundary issue with source evidence to root if needed.

## Validation / resources

Use applicable TDD/contract skills; full affected units/consumers/tests read before changes. Meaningful RED for pricing/quota followed by GREEN. Required tests: rules100 balance0; default/custom AI10 charges10/20; partial3 charges3/6; zero valid no slot/debit;101 rejected;20/21/concurrent runs; append rollback no eviction; owner/pagination/expired recovery; append/admission lock ordering and admitted snapshot survival. SQL concurrency/transactions cannot be claimed from InMemory. Test actual generation consumers under held credits and local retry/lost commit acknowledgement; provider invocation must not repeat.

Only exact already-owned localhost / DESKTOP-TS5JR7L databases FormAutoHub_History_Safety_20261104 and FormAutoHub_History_Baseline_20261105 may receive guarded synthetic fixture writes/applicable approved migrations. Reuse GenerationHistorySqlFixture exact identity checks before each run. No old task DB takeover, DROP/reset/EnsureDeleted or API startup (Program auto-migrates). Root owns DB/process lifecycle. Ask root before any genuinely new DB/schema decision.

No install, live Google/AI/payment, commit/push/merge/deploy, cleanup or nested agents. Sol only, max gpt-6.1-sol/high. One implementer writer. Inform root before final build; freeze source after paired TASK3_REPORT.md with Summary/Files/Scope/Validation performed/not performed/Risks/Next and exact logs/counts. Root packages diff against Task3 baseline and dispatches fresh independent review. Report output in Vietnamese, concise milestones; no Done/runtime/release claim for missing gates.