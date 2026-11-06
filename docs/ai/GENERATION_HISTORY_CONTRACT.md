# Generation history — implemented local contract

Approved scope: [FAH-HISTORY-001](tasks/FAH-HISTORY-001/INDEX.md), [exact contracts](tasks/FAH-HISTORY-001/CONTRACTS.md), [validation](tasks/FAH-HISTORY-001/VALIDATION.md). This supplement records implemented local behavior; production activation remains blocked by real-provider evidence and separately authorized operator tooling.

## HTTP and ownership

- Owner-only, no-store `GET /api/generation-history?page=1&pageSize=10` lists 20 newest account-wide eligible runs; page >=1 and size 1..20. Detail `GET /api/generation-history/{batchId}` has <=100 responses, ordered by ordinal; missing/unowned/evicted is 404. Admin has no owner bypass.
- Generation keeps existing rules/AI routes and requires `X-FormAuto-Contract-Version: 2`; old clients get 409 `ClientUpgradeRequired` after ownership checks. Responses include `generationBatchId`, `generationFeePerResponse`, and posted/reserved/available `credits`. AI run identity is distinct from generation batch identity.
- Rules creation costs0; default/custom AI costs1/2 per committed response. Partial output charges actual persisted rows; zero valid output creates no batch/debit. A successful request creates one immutable run; a continuation creates a separate run. Run21 logically evicts the oldest; physical audit/ledger/payloads remain.
- Selected send keeps its existing route and requires contractVersion2, commandId, one batch/project, response IDs and explicit confirmation. Same command/fingerprint is read-only replay. New deliberate resend uses a new command and duplicate warning. Rules direct remains one action without a second confirmation.
- Current production compatibility rejects insufficient form/receipt evidence before provider I/O, job or hold. Synthetic compatibility/receiver fixtures are test-only and are not a production configuration switch.

## Persistence and credit boundaries

`GenerationBatch` stores owner/project, durable completion time, mode, requested/generated counts, generation fee, pricing policy, immutable form observation/hash and logical eviction time. `GeneratedResponse` stores batch membership/ordinal and separated or reviewed legacy pricing/entitlement evidence. Timestamp proximity never proves legacy group membership.

`CreditReservation`, append-only `CreditReservationEvent` and `SubmissionJobItem` preserve selected payload/evidence, attempt state and settlement identity. Balance is posted; Reserved is outstanding holds; Available=Balance-Reserved. Reservations are not expenditure. Dedicated `CreditService` writes every debit/grant ledger; generation and submission usage remain separate.

The implemented v2 `SettleAttemptAsync` settles one possible-dispatch/Unknown item from immutable reviewed evidence, with actor/reason where applicable and idempotent replay. Success consumes its own hold once; rejection releases its own hold; Unknown stays reserved and fenced. Runner acknowledgement is distinct from financial closure; reconciliation preserves operational finish timestamps.

`LegacyAttemptEvidence` schema/read consumers exist. The proposed `ILegacyAttemptReconciliationService.ReconcileLegacyAttemptAsync` and operator mutation/backfill are **not implemented** and remain Deferred. No public mutation endpoint, automatic release, runner takeover or inferred receipt is approved.

## Runtime evidence limits

Task6 distinguishes ordinary production-config authenticated web/API/SQL evidence from controlled synthetic receiver/service rehearsal. Real Google delivery and receipt provenance were not tested; paid sending activation remains Blocked. See [cutover](tasks/FAH-HISTORY-001/CUTOVER.md), [handoff](tasks/FAH-HISTORY-001/HANDOFF.md).
