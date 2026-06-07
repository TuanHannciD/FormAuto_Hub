# NCKH Phase 3 Validation And Closeout Docs

Use `formauto-http-behavior-tester` for runtime checks and `formauto-controlled-doc-editor` for paired docs updates.

Task:

Validate the completed NCKH Phase 3 backend slice and update closeout/progress docs only if validation supports it.

Read first:

- `README.md`
- `AGENTS.md`
- `docs/ai/AI_DOC_ROUTING_MATRIX.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_3_SINGLE_APPROVAL_PACKET.md`
- `docs/ai/nckh/NCKH_PHASE_3_CONTRACT_DB_FREEZE.md`
- Worker A/B/C result summaries and diffs

Required validation:

- `dotnet build FormAutoHub.sln -c Release`
- `dotnet test tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj -c Release`
- `dotnet ef database update` with the intended Development SQL Server database
- start/restart the API after code changes
- authenticated HTTP smoke for relation CRUD with a real JWT
- authenticated HTTP smoke for node-position save/load with a real JWT
- verify Draft-only edit behavior and Active read-only rejection
- inspect relevant server logs after smoke checks
- clean up smoke data
- stop disposable API process if started for validation

Docs to update only if validation supports closeout:

- `docs/ai/nckh/NCKH_PHASE_3_CLOSEOUT.md`
- `docs/vi/nckh/NCKH_PHASE_3_CLOSEOUT.md`
- `docs/ai/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/vi/nckh/NCKH_PROGRESS_LEDGER.md`
- `docs/ai/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/vi/nckh/NCKH_PHASE_ROADMAP.md`
- `docs/ai/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- `docs/vi/nckh/NCKH_PHASE_TRANSITION_GUIDE.md`
- contract/entity docs if implementation finalized approved surface details

Report labels:

- Verified
- Not run
- Blocked

Do not:

- mark Phase 3 completed without build/test/migration/runtime smoke evidence
- update only one language layer
- claim frontend validation if no frontend changed
- claim production readiness without current runtime validation

Stop and report if:

- build/test/migration/runtime smoke fails and cannot be fixed within approved Phase 3 scope
- docs cannot be kept semantically synced

Return:

- validation performed
- validation not performed
- blockers
- docs changed
- closeout decision recommendation

