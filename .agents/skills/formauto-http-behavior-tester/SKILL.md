---
name: formauto-http-behavior-tester
description: Test FormAuto Hub routes and endpoints by making safe HTTP requests and analyzing status codes, redirects, response bodies, validation errors, auth failures, or contract mismatches. Avoid risky mutation requests unless clearly justified.
---

# Purpose

Verify actual endpoint behavior when a local API or web route exists.

# Workflow

1. Identify endpoint and expected contract.
2. Prefer safe GET/read-only requests first.
3. For mutation requests, confirm task justification and payload safety.
4. Use the correct auth role/session when the endpoint is protected.
5. For browser routes, verify both route HTML and required static chunks when relevant.
6. Capture method, URL, status, response markers, and mismatch.
7. Check relevant logs after the request when the app is local.
8. Report `Verified`, `Not run`, or `Blocked`.

# Must Enforce

- Do not send risky mutation requests casually.
- Do not invent expected contracts.
- Compare behavior against `API_CONTRACT_GUIDE.md`.
- Do not treat HTML `200` as enough when the bug could be hydration, chunk loading, auth guard, or runtime API behavior.
