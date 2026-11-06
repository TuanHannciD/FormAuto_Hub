# Task6 independent R1

Reviewer `/root/history_task6_review`, explicit gpt-6.1-sol/high/fresh context/read-only/no nested agents. Manifest SHA256 `bd1b28a7a1615259f480b20f784d31ca363004e295483937a2d9d1e13c531af8`,19/19 live+snapshot hashes verified.

**0 Critical,1 Important,0 Minor. Spec Compliance: Changes requested. Task Quality: Changes requested.**

## Important I1 — default discovery includes sensitive runtime suite

`apps/web/tests/history-runtime.spec.ts` reads ignored fixture at top-level and later manually grants credit/generates through actual API5305. `apps/web/playwright.config.ts` ignores only SEO. Installed Playwright matcher, without importing tests or credentials: defaultMatch=true/defaultIgnore=false/historyMatch=false/explicitRuntimeMatch=true.

Missing ignored fixture makes broad test/collection fail. Present fixture allows broad run to mutate local API5305 even with default web3000; default CI retries2/trace on-first-retry may retain session headers. Risk only: no observed token leak or CI execution claimed (current CI lint/build only). Minimum fix: exclude runtime spec from default config preserving SEO, dedicated config only, verify discovery/collection fixture absent without executing mutation. No full runtime rerun necessary.

## Other checks

Strict direct-SQL adapter uses exact localhost/Safety/server/machine guards, no reset/takeover. TRX Safety56+cutover2+Baseline1 accepted;43/49 skipped methods actually executed separately; remaining6 TopupEvidence SQL Not run. HTTP61 all passed/no-store; actual browser5+actions1 and no route interception. Cutover actor/reason/evidence/replay/Unknown hold and legacy no-hold limitations accurately labelled.14 paired Markdown UTF8/<400lines/equal commitments accepted. No other finding.

Reviewer did not mutate/read secrets/run mutation/change resources. Root accepted I1, assigned original author scoped fix plus fresh R2.
