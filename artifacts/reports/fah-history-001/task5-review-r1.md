# Task5 independent R1

Reviewer `/root/history_task5_review_r1`, gpt-6.1-sol/high, fresh context, read-only; no nested agents. Package `task5-final.diff`, `task5-final-manifest.json`, `task5-final-snapshot-20261105-2306`; manifest SHA256 `c36d388841aa1ac8a8525eb82989638cfd9dd1b147fbef6845c4e4ed852365d3`. Reviewer verified27/27 frozen hashes; targeted VM reproduction, no build/browser/SQL rerun.

## Findings

**Important I1: unresolved command overwritten across tabs.** `apps/web/app/dashboard/forms/history/_components/history-command.ts` uses one localStorage key per user and unconditional overwrite. `GenerationHistory.tsx` and forms/page.tsx read only on mount; HistoryRunDetail checks local pending only. Two preopened same-user tabs share storage: A stores commandA/projectA with uncertain result; B stores commandB/projectB, overwriting A; A reload recovers B; terminal removal of B leaves null. Violates exact-command GET recovery after uncertainty/reload. No demonstrated provider replay or lost ledger; backend Unknown fence remains. Preserve every unresolved command independently or atomically prevent competition. Regression must cover interleaved two-tab/history–AI storage/removal/recovery.

**Minor M1: partial/continuation fee summary uses original request.** forms/page.tsx passes previewCount to WorkflowSummary after generationResult becomes a new immutable continuation run. Request5/partial3/continuation2 correctly shows2/2 in inline notice but sidebar still uses5 for count/creation estimate/maxsend. Initial partial3→1 similarly overstates maxsend. Use current completed run/request and current previews, or explicitly distinguish next-action estimate; preserve pre-generation estimate. Backend pricing unchanged.

## Verdict

Spec Compliance: **Changes required**. Task Quality: **Changes required**. No Critical found. Owner/no-store/pagination/DTO/version/confirmation/session/fail-closed broadly comply. Task3M1 batch-query fix accepted; Task4M2 remains correctly Deferred with both409s safe. Runtime role/API/SQL gate remains Task6.

Root verified I1 against current source and accepted smallest related correction; original resumed author assigned I1+M1 with focused RED/GREEN and fresh frozen review. No source change by root.
