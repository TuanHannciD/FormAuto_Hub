"""Bounded documentation verification; never starts app processes or writes product files."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[3]
out = Path(__file__).resolve().parent
failures = []
documents = []
for language in ("ai", "vi"):
    folder = root / "docs" / language / "tasks" / "FAH-UI-003"
    for filename in ("INDEX.md", "AUDIT.md", "PLAN.md", "PROGRESS.md"):
        path = folder / filename
        data = path.read_bytes()
        body = data.decode("utf-8")
        if "\ufffd" in body:
            failures.append(f"Replacement character: {path}")
        if len(body.splitlines()) >= 400:
            failures.append(f"Document too long: {path}")
        links = re.findall(r"\[[^\]]+\]\(([^)]+)\)", body)
        for link in links:
            if "://" not in link and not link.startswith("#"):
                target = (path.parent / link.split("#")[0]).resolve()
                if not target.exists():
                    failures.append(f"Missing link: {path}: {link}")
        documents.append({"path": str(path.relative_to(root)).replace("\\", "/"), "sha256": hashlib.sha256(data).hexdigest(), "lines": len(body.splitlines()), "relativeLinks": links})

for filename in ("INDEX.md", "AUDIT.md", "PLAN.md", "PROGRESS.md"):
    ai = (root / "docs/ai/tasks/FAH-UI-003" / filename).read_text(encoding="utf-8")
    vi = (root / "docs/vi/tasks/FAH-UI-003" / filename).read_text(encoding="utf-8")
    # Human review owns translated meaning; this checks shared identifiers only.
    for pattern in (r"F\d{2}", r"`(/(?:dashboard|admin|payment)[^`]*?)`", r"gpt-[\w.-]+"):
        if set(re.findall(pattern, ai)) != set(re.findall(pattern, vi)):
            failures.append(f"Identifier mismatch: {filename}: {pattern}")
    if filename == "PLAN.md":
        if len(re.findall(r"^- \[[ x]\]", ai, re.M)) != len(re.findall(r"^- \[[ x]\]", vi, re.M)):
            failures.append("Plan checkbox count mismatch")
        if re.findall(r"^## (T\d+)", ai, re.M) != re.findall(r"^## (T\d+)", vi, re.M):
            failures.append("Plan task identifiers mismatch")

routes = []
audit = (root / "docs/ai/tasks/FAH-UI-003/AUDIT.md").read_text(encoding="utf-8")
for surface in ("dashboard", "admin"):
    for path in sorted((root / "apps/web/app" / surface).rglob("page.tsx")):
        route = "/" + path.parent.relative_to(root / "apps/web/app").as_posix()
        routes.append(route)
        if f"`{route}`" not in audit:
            failures.append(f"Missing route in assessment: {route}")
if len(routes) != 18:
    failures.append(f"Expected inventory18, got{len(routes)}")

tracked = subprocess.check_output(["git", "diff", "--name-only", "HEAD"], cwd=root, text=True).splitlines()
approved = ("apps/web/app/dashboard/", "apps/web/app/admin/", "apps/web/app/payment/payos/return/", "apps/web/tests/", "docs/ai/tasks/FAH-UI-003/", "docs/vi/tasks/FAH-UI-003/", "artifacts/reports/ui-cleanup-2026-11-02/")
shared = {"apps/web/components/admin-shell.tsx", "apps/web/components/shell-layout.tsx", "apps/web/components/dropdown-select.tsx", "apps/web/components/searchable-dropdown-select.tsx"}
unexpected_tracked = [path for path in tracked if not path.startswith(approved) and path not in shared]
if unexpected_tracked:
    failures.append(f"Out-of-scope tracked changes: {unexpected_tracked}")
untracked = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard"], cwd=root, text=True).splitlines()
allowed = ("docs/ai/tasks/FAH-UI-003/", "docs/vi/tasks/FAH-UI-003/", "artifacts/reports/ui-cleanup-2026-11-02/", "apps/web/tests/ui-cleanup.spec.ts", "apps/web/tests/user-pages-cleanup.spec.ts", "apps/web/tests/admin-cleanup.spec.ts")
unexpected = [path for path in untracked if not path.startswith(allowed)]
if unexpected:
    failures.append(f"Unexpected untracked files: {unexpected}")
result = {"task": "FAH-UI-003", "date": "2026-11-02", "status": "Failed" if failures else "Verified", "documents": documents, "routes": routes, "trackedFilesChanged": tracked, "unexpectedUntrackedFiles": unexpected, "failures": failures, "limits": "Identifier/link/encoding/implementation-scope checks only. Bilingual semantic review is independent human-like assessment; no app runtime/test pass is claimed."}
(out / "implementation-doc-verification.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(bool(failures))
