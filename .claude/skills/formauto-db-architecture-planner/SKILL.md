---
name: formauto-db-architecture-planner
description: Propose FormAuto Hub SQL Server and EF Core persistence strategy after requirements are clear. Use for entity modeling, migration direction, transaction boundaries, ledger safety, indexing direction, and data consistency planning. Do not claim final approval or edit docs without explicit approval.
---

# Purpose

Create database architecture recommendations without turning proposals into final contracts.

# Workflow

1. Confirm requirement and affected modules.
2. Read entity and tech-stack docs.
3. Separate confirmed conceptual entities from proposed fields.
4. Identify transaction boundaries.
5. Identify ledger and usage-log requirements.
6. Identify migration risk and reversibility.
7. Recommend a smallest-safe SQL Server/EF Core direction.

# Must Enforce

- SQL Server and EF Core are confirmed.
- EF Core migrations are required for schema changes.
- Credit changes must write `CreditTransactions`.
- Tool actions must write `UsageLogs`.
- Submission actions must write `SubmissionLogs`.
- Refund behavior after failed submission is Deferred.

