"""Read-only Git/source inventory; writes only this agent's closeout packet.

Never stages, commits, fetches, switches, pushes, runs applications or touches DBs.
Explicit remote read is ls-remote; no credentials or raw stderr are persisted.
"""
from __future__ import annotations

import collections
import datetime
import difflib
import hashlib
import json
from pathlib import Path
import re
import subprocess
import urllib.parse

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
ERR = ROOT / "artifacts/reports/error-remediation-2026-10-30"
DB = ROOT / "artifacts/reports/db-sync-2026-10-29"


def git(*args: str) -> bytes:
    proc = subprocess.run(["git", *args], cwd=ROOT, capture_output=True)
    if proc.returncode:
        raise RuntimeError(f"git read failed ({proc.returncode}): {args[0]}")
    return proc.stdout


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def normalize(path: str) -> str:
    return path.replace("\\", "/")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write(name: str, value) -> None:
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def manifest(paths):
    return [{"path": p, "bytes": (ROOT / p).stat().st_size, "sha256": sha(ROOT / p)} for p in sorted(paths)]


def linked_artifacts(paths):
    queue = [ROOT / p for p in paths]
    seen, included, missing = set(), set(), []
    while queue:
        path = queue.pop(0)
        if path in seen or path.suffix.lower() != ".md":
            continue
        seen.add(path)
        for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", path.read_text(encoding="utf-8-sig")):
            target = target.strip("<>").split("#", 1)[0]
            if not target or re.match(r"[a-zA-Z]+:", target):
                continue
            dest = (path.parent / target).resolve()
            if not dest.is_relative_to(ROOT):
                continue
            if not dest.exists():
                missing.append({"source": relative(path), "target": target})
            elif dest.is_file() and relative(dest).startswith("artifacts/"):
                included.add(relative(dest))
                queue.append(dest)
    return included, missing


def source_patch(name: str, paths):
    tracked = set(git("ls-files", "-z").decode().split("\0"))
    existing = sorted(set(paths) & tracked)
    result = git("diff", "--binary", "--no-ext-diff", "HEAD", "--", *existing) if existing else b""
    for path in sorted(set(paths) - tracked):
        lines = (ROOT / path).read_bytes().decode("utf-8-sig").splitlines(keepends=True)
        diff = "".join(difflib.unified_diff([], lines, fromfile="/dev/null", tofile="b/" + path))
        result += (f"diff --git a/{path} b/{path}\nnew file mode 100644\n" + diff).encode("utf-8")
    (OUT / name).write_bytes(result)


def main():
    ownership = read(ERR / "dossier-checkpoint/owned-delta-from-baseline371-final.json")
    db_inventory = read(DB / "dossier/current-source-inventory.json")
    runner = read(ERR / "runtime/final-verification-source-manifest.json")
    baseline = read(ERR / "runtime/baseline-source.json")
    err_paths = {normalize(x["path"]) for x in ownership["files"]}
    db_paths = {normalize(x["path"]) for x in db_inventory["newApprovedFiles"]}
    err_docs = {relative(p) for lang in ("ai", "vi") for p in (ROOT / f"docs/{lang}/tasks/FAH-ERR-001").glob("*.md")}
    db_docs = {relative(p) for lang in ("ai", "vi") for p in (ROOT / f"docs/{lang}/tasks/FAH-DB-SYNC-001").glob("*.md")}
    links, missing = linked_artifacts(err_docs | db_docs)
    additional = [
        "runtime/final-backend/build-result.json", "runtime/final-backend/test-result.json",
        "runtime/final-backend/all-tests.trx",
        "runtime/final-web/build-result.json", "runtime/final-web/build-r2-result.json", "runtime/final-web/lint-result.json",
        "runtime/sql-durability-harness/verification.json", "runtime/sql-durability-harness/fresh-guard.json",
        "runtime/sql-durability-harness/api-verification.json", "runtime/sql-durability-harness/api-identity.json",
        "runtime/sql-durability-harness/api-release.json", "runtime/sql-durability-harness/ai-sql-verification.json",
        "runtime/auth-callback-final/writer-hash-checks.json", "runtime/auth-callback-final/release.json",
        "runtime/auth-callback-final/green/build-result.json", "runtime/auth-callback-final/green/lint-result.json",
        "runtime/auth-callback-final/green/node.log", "runtime/auth-callback-final/green/lint.log", "runtime/auth-callback-final/green/build.log",
        "runtime/auth-callback-final-browser/playwright.json", "runtime/auth-callback-final-browser-r2/playwright.json",
        "runtime/final-browser-d13/playwright.json", "runtime/final-browser-d-fixture-r1/playwright.json",
        "runtime/final-browser-cef/playwright.json", "runtime/final-browser-regressions/playwright.json",
        "runtime/final-browser-nckh-fixture-r1/playwright.json", "runtime/final-browser-f-fix-r1/playwright.json",
        "runtime/final-browser-f-motion/playwright.json", "runtime/final-browser-post-restart/playwright.json",
        "runtime/final-browser-e-build-r2/playwright.json", "runtime/legacy-esm-final/results.json",
        "runtime/final-owned-process-release.json", "runtime/final-source-snapshot.json",
        "runtime/sql-durability-harness/Program.cs", "runtime/sql-durability-harness/ApiSmoke.cs",
        "runtime/sql-durability-harness/AiSqlSmoke.cs", "runtime/sql-durability-harness/RuntimeHarness.csproj",
    ]
    additional_absent = []
    for path in additional:
        candidate = ERR / path
        if candidate.is_file():
            links.add(relative(candidate))
        else:
            additional_absent.append(path)
    # Existing lightweight source-review reports; no logs/zip/screenshots copied wholesale.
    for name in ("p1-submission", "p1-ai-contract", "shared-web", "forms-ui", "nckh-ui", "account-payments-ui", "backend-boundaries", "legacy-smoke", "auth-callback-fix-r1"):
        candidate = ERR / name / "report.md"
        if candidate.is_file():
            links.add(relative(candidate))
    linked_more, missing_more = linked_artifacts(links)
    links |= linked_more
    missing += missing_more
    checks = []
    for kind, rows, key in (("ERR80", ownership["files"], "hash"), ("DB17", db_inventory["newApprovedFiles"], "sha256"), ("runner343", runner, "sha256")):
        mismatches = []
        for row in rows:
            path = normalize(row["path"])
            actual = sha(ROOT / path) if (ROOT / path).is_file() else None
            if actual != row[key].lower():
                mismatches.append({"path": path, "expected": row[key].lower(), "actual": actual})
        checks.append({"name": kind, "count": len(rows), "mismatches": mismatches})
    raw_status = git("status", "--porcelain=v1", "-z", "-uall").decode().split("\0")
    status = [{"xy": s[:2], "path": s[3:]} for s in raw_status if s]
    for row in status:
        path = row["path"]
        row["group"] = ("ERR80" if path in err_paths else "DB17" if path in db_paths else
            "ERR-task-docs" if path in err_docs else "DB-task-docs" if path in db_docs else
            "portable-evidence" if path in links else "closeout-packet" if path.startswith(relative(OUT) + "/") else
            "preserved-next-cache" if path.startswith("apps/web/.next-") else "preserved-other-evidence")
    remotes = []
    for name in git("remote").decode().split():
        url = git("remote", "get-url", name).decode().strip()
        parsed = urllib.parse.urlsplit(url)
        remotes.append({"name": name, "host": parsed.hostname, "path": parsed.path, "credentialsPresent": bool(parsed.username or parsed.password)})
    remote = subprocess.run(["git", "ls-remote", "--heads", "origin", "main", "docs/pre-ui-refinement-20261028", "ui/compact-refinement-20261028"], cwd=ROOT, capture_output=True, text=True)
    remote_refs = [{"sha": row.split()[0], "ref": row.split()[1]} for row in remote.stdout.splitlines() if len(row.split()) == 2]
    groups = {"db-source": sorted(db_paths), "err-source": sorted(err_paths), "db-docs": sorted(db_docs), "err-docs": sorted(err_docs), "portable-evidence": sorted(links)}
    for name, paths in groups.items():
        (OUT / f"allowlist-{name}.txt").write_text("\n".join(paths) + "\n", encoding="utf-8")
        write(f"manifest-{name}.json", manifest(paths))
    source_patch("db-source.patch", db_paths)
    source_patch("err-source.patch", err_paths)
    safe_patterns = {
        "private-key": r"-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----",
        "github-token": r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b",
        "openai-key": r"\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b",
        "jwt": r"\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b",
        "credential-url": r"https?://[^\s/@:]+:[^\s/@]+@",
        "sql-password": r"(?i)(?:password|pwd)\s*=\s*[^;\s<]{5,}",
    }
    findings = []
    for path in sorted(err_paths | db_paths | err_docs | db_docs | links):
        raw = (ROOT / path).read_bytes()
        content = raw.decode("utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig", errors="replace")
        for label, pattern in safe_patterns.items():
            matches = list(re.finditer(pattern, content))
            if matches:
                findings.append({"path": path, "kind": label, "count": len(matches), "lines": [content[:m.start()].count("\n") + 1 for m in matches]})
    write("secret-pattern-scan.json", {"scope": "Exact source/docs/portable-evidence allowlists; values never emitted", "findings": findings, "limit": "Pattern screen is not exhaustive; synthetic source fixtures may need explicit classification."})
    write("status-inventory.json", status)
    write("verification.json", {"utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "checks": checks, "linkedArtifactMissing": missing, "optionalAdditionalAbsent": additional_absent, "baseline371GeneratedConfig": [{"path": x["path"], "expected": x["sha256"].lower(), "actual": sha(ROOT / x["path"])} for x in baseline["sourceFiles"] if normalize(x["path"]) in {"apps/web/tsconfig.json", "apps/web/next-env.d.ts"}]})
    write("inventory.json", {
        "utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "owner": "/root/closeout_git_inventory", "model": "gpt-6.1-sol", "reasoning": "high", "children": 0,
        "dispatch": "Root checked live catalog and explicitly selected gpt-6.1-sol/high; no nested dispatch.",
        "head": git("rev-parse", "HEAD").decode().strip(), "branch": git("branch", "--show-current").decode().strip(),
        "gitDir": git("rev-parse", "--git-dir").decode().strip(), "gitCommonDir": git("rev-parse", "--git-common-dir").decode().strip(),
        "cachedNameOnly": git("diff", "--cached", "--name-only").decode().splitlines(),
        "localRefs": git("for-each-ref", "--format=%(refname:short) %(objectname) %(upstream:short)", "refs/heads", "refs/remotes").decode().splitlines(),
        "mainMergeBase": git("merge-base", "HEAD", "main").decode().strip(),
        "priorCommits": git("log", "main..HEAD", "--format=%H %s").decode().splitlines(),
        "worktrees": git("worktree", "list", "--porcelain").decode().splitlines(),
        "remotesSanitized": remotes, "remoteRead": {"command": "git ls-remote --heads origin main docs/pre-ui-refinement-20261028 ui/compact-refinement-20261028", "exit": remote.returncode, "refs": remote_refs, "stderrPresent": bool(remote.stderr.strip())},
        "ownership": dict(collections.Counter(x["category"] for x in ownership["files"])),
        "statusCounts": dict(collections.Counter(x["group"] for x in status)),
        "allowlistCounts": {k: len(v) for k, v in groups.items()},
        "dbErrOverlap": sorted(db_paths & err_paths), "portableEvidenceBytes": sum((ROOT / p).stat().st_size for p in links),
        "baselineStatus": baseline["status"], "testsRerun": False, "mutation": "Only owned docs/packet writes; no Git/index/ref mutation, no runtime/DB/deploy.",
    })
    write("workflow-manifest.json", manifest([".github/workflows/ci.yml", ".github/workflows/deploy.yml", "scripts/deploy-production.sh", "Dockerfile.api", ".dockerignore", "tests/FormAutoHub.Tests/FormAutoHub.Tests.csproj", "scripts/db-compatibility/DbCompatibilityProbe.csproj"]))
    print(json.dumps({"groups": {k: len(v) for k, v in groups.items()}, "freshChecks": [{"name": x["name"], "count": x["count"], "mismatches": len(x["mismatches"])} for x in checks], "missingLinks": len(missing), "patternFindings": len(findings), "optionalAdditionalAbsent": additional_absent}, ensure_ascii=False))


if __name__ == "__main__":
    main()
