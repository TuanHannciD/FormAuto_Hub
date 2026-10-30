"""Read-only index versus explicit publication pathsets/content identity."""
import hashlib
import json
from pathlib import Path
import subprocess
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
PACKET = OUT.parent / 'git-inventory'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

names = ['db-source', 'err-source', 'db-docs', 'err-docs', 'portable-evidence', 'packet', 'closeout-metadata']
groups = {n: (PACKET / ('allowlist-' + n + '.txt')).read_text(encoding='utf-8-sig').splitlines() for n in names}
# Root-authorized exact lightweight independent-review/handoff metadata.
extra = [
    'artifacts/reports/error-remediation-2026-10-30/closeout/review/report.md',
    'artifacts/reports/error-remediation-2026-10-30/closeout/review/snapshot-verification.json',
    'artifacts/reports/error-remediation-2026-10-30/closeout/review/verify_snapshot.py',
    'artifacts/reports/error-remediation-2026-10-30/closeout/review/verify_staged.py',
    'artifacts/reports/error-remediation-2026-10-30/closeout/deploy-handoff/report.md',
    'artifacts/reports/error-remediation-2026-10-30/closeout/deploy-handoff/static-validation.json',
]
allowed = set(p for rows in groups.values() for p in rows)
staged = [x for x in git('diff', '--cached', '--name-only', '-z').decode().split('\0') if x]
checks = []
for path in staged:
    blob = git('show', ':' + path)
    live = (ROOT / path).read_bytes()
    checks.append({'path': path, 'blobSha256': hashlib.sha256(blob).hexdigest(), 'worktreeSha256': hashlib.sha256(live).hexdigest(), 'exactBytes': blob == live, 'equalAfterCRLFNormalization': blob.replace(b'\r\n', b'\n') == live.replace(b'\r\n', b'\n')})
diff_check = subprocess.run(['git', 'diff', '--cached', '--check'], cwd=ROOT, capture_output=True, text=True)
result = {'utc': datetime.now(timezone.utc).isoformat(), 'head': git('rev-parse', 'HEAD').decode().strip(), 'branch': git('branch', '--show-current').decode().strip(), 'expectedPrimaryCount': len(allowed), 'stagedCount': len(staged), 'missingPrimary': sorted(allowed-set(staged)), 'unexpected': sorted(set(staged)-allowed-set(extra)), 'recognizedExtras': sorted(set(staged)&set(extra)), 'statuses': git('diff', '--cached', '--name-status').decode().splitlines(), 'contentChecks': checks, 'nonNewlineMismatch': [r['path'] for r in checks if not r['equalAfterCRLFNormalization']], 'newlineOnlyDifferences': [r['path'] for r in checks if not r['exactBytes'] and r['equalAfterCRLFNormalization']], 'cachedDiffCheckExit': diff_check.returncode, 'cachedDiffCheck': diff_check.stdout, 'limits': 'Read-only index/content check. Git CRLF normalization is recorded separately from raw worktree identity; no tests or Git mutations.'}
(OUT/'staged-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in {'contentChecks','statuses'}}, ensure_ascii=False))
