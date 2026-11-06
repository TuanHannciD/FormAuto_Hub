# Task 2 brief — FAH-HISTORY-001

Requirements: read Task2 and Global Constraints of IMPLEMENTATION_PLAN.md, approved INDEX.md, CONTRACTS.md and DB_REVIEW.md. User approved L1/L2/P1/O1 and the reviewed proposal package on 2026-11-05. Implement Task2 only: durable credit reservation, availability, settlement; required approved entity/EF migration/DTO/internal service foundations and focused unit/SQL tests. Preserve existing pricing until Task3, but all spending must respect Available.

Use TDD and repository skills. New opt-in SQL fixture FormAutoHub_History_Safety_20261104 with FAH_HISTORY_SQL_SERVER/FAH_HISTORY_SQL_DATABASE; do not touch old task DBs. No InMemory claim of SQL concurrency. Root must identify/authorize owned DB before apply; no startup against unknown DB (Program auto-migrates). No real Google/AI, install, commit/push/deploy/cleanup. No nested agents. Sol only max gpt-6.1-sol/high.

Implement reviewed interfaces and exact invariants: Balance posted, Available subtract held, reservation/release not debit/refund, successful settlement exactly one CreditUsed plus usage/outcome transaction, unknown retains hold, replay idempotent. Local SQL execution retries never wrap external calls. Read full affected units/consumers/tests before editing; no unreviewed fields/statuses. No history UI/send integration/cutover/backfill/reconciliation tooling in Task2.

Report paired TASK2_REPORT.md with Summary/Files/Scope/Validation performed/not performed/Risks/Next. Return brief status, tests and concerns. No commit. Root performs fresh independent review.
