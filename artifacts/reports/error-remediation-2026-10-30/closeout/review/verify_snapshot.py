"""Independent read-only source, allowlist and paired-doc identity checks."""
import hashlib
import json
from pathlib import Path
import subprocess
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
PACKET = OUT.parent / 'git-inventory'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

checks = []
for name, path, key, container in [
    ('ERR80', 'artifacts/reports/error-remediation-2026-10-30/dossier-checkpoint/owned-delta-from-baseline371-final.json', 'hash', 'files'),
    ('DB17', 'artifacts/reports/db-sync-2026-10-29/dossier/current-source-inventory.json', 'sha256', 'newApprovedFiles'),
    ('runner343', 'artifacts/reports/error-remediation-2026-10-30/runtime/final-verification-source-manifest.json', 'sha256', None),
]:
    source = ROOT / path
    data = json.loads(source.read_text(encoding='utf-8-sig'))
    rows = data[container] if container else data
    bad = [r['path'] for r in rows if digest(ROOT / r['path']) != r[key].lower()]
    checks.append({'name': name, 'count': len(rows), 'manifestHash': digest(source), 'mismatches': bad})

allowlists = []
for path in sorted(PACKET.glob('allowlist-*.txt')):
    paths = path.read_text(encoding='utf-8-sig').splitlines()
    manifest = PACKET / path.name.replace('allowlist-', 'manifest-').replace('.txt', '.json')
    if not manifest.is_file():
        allowlists.append({'path': str(path.relative_to(ROOT)).replace('\\', '/'), 'count': len(paths), 'manifestNotProvided': True})
        continue
    rows = json.loads(manifest.read_text(encoding='utf-8-sig'))
    if isinstance(rows, dict):
        rows = rows['files']
    actual = {r['path']: r['sha256'] for r in rows}
    self_manifest_path = str(manifest.relative_to(ROOT)).replace('\\', '/')
    omitted_self = path.name == 'allowlist-packet.txt' and self_manifest_path in paths and self_manifest_path not in actual
    missing = [p for p in paths if not (ROOT / p).is_file()]
    mismatch = [p for p in paths if (ROOT / p).is_file() and not (omitted_self and p == self_manifest_path) and actual.get(p) != digest(ROOT / p)]
    forbidden = [p for p in paths if any(part in {'.git', 'node_modules', 'bin', 'obj', '.next'} or part.startswith('.next-') for part in Path(p).parts) or Path(p).suffix.lower() in {'.zip', '.png', '.dll', '.pdb', '.bak', '.bacpac', '.env', '.key', '.pem', '.pfx'}]
    allowlists.append({'path': str(path.relative_to(ROOT)).replace('\\', '/'), 'sha256': digest(path), 'count': len(paths), 'duplicates': len(paths) - len(set(paths)), 'manifestPathSetMatch': set(paths) - ({self_manifest_path} if omitted_self else set()) == set(actual), 'selfHashIntentionallyExcluded': omitted_self, 'missing': missing, 'hashMismatches': mismatch, 'forbiddenPaths': forbidden})

pairs = []
for name in ['INTEGRATION_PLAN.md', 'SELF_DEPLOY_HANDOFF.md']:
    ai = ROOT / 'docs/ai/tasks/FAH-ERR-001' / name
    vi = ROOT / 'docs/vi/tasks/FAH-ERR-001' / name
    ai.read_text(encoding='utf-8', errors='strict')
    vi.read_text(encoding='utf-8', errors='strict')
    pairs.append({'name': name, 'sha256': digest(ai), 'aiViByteEqual': ai.read_bytes() == vi.read_bytes(), 'lines': len(ai.read_text(encoding='utf-8').splitlines())})

result = {'utc': datetime.now(timezone.utc).isoformat(), 'owner': '/root/closeout_review', 'sourceChecks': checks, 'allowlists': allowlists, 'pairedDocs': pairs, 'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'branch': subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip(), 'cachedPaths': subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=ROOT, text=True).splitlines(), 'limits': 'No tests/runtime/DB/SSH/remote or Git mutations; hash and static review only.'}
(OUT / 'snapshot-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
