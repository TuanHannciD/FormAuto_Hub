# FAH-ERR-001 — Static self-deploy handoff evidence

2026-10-30 · Writer `/root/deployment_handoff`, root-assigned `gpt-6.1-sol/high`; không agent con. Phạm vi writer: paired `SELF_DEPLOY_HANDOFF.md` và thư mục artifact này. Không ghi source/config/workflow/DB; không SSH, HTTP bên ngoài, runtime/test/process, commit/push/merge/deploy hoặc cleanup.

## Summary / Files changed

- `docs/ai/tasks/FAH-ERR-001/SELF_DEPLOY_HANDOFF.md`
- `docs/vi/tasks/FAH-ERR-001/SELF_DEPLOY_HANDOFF.md`
- `artifacts/reports/error-remediation-2026-10-30/closeout/deploy-handoff/{report.md,static-validation.json}`

Hai bản docs cố ý dùng cùng nội dung tiếng Việt, cùng 196 dòng/hash SHA256 `a26ea62f4ce821b91e7b0749b0f84e87933e12a9e86af72225e4b10b0f426153`. Điều này bảo toàn nguyên văn commands/commitments, không có bản dịch ngầm thay quyền triển khai.

## Scope alignment / Validation performed

**Verified — static only:** đọc entry/authority/execution/quality/tooling/routing, task local acceptance và DB-sync closeout, deployment/environment guides; đối chiếu actual `.github/workflows/{ci,deploy}.yml`, deploy script, Compose, Dockerfiles, API startup/migration, normalization source, local-only probe và legacy smoke implementation. Source hashes lưu trong `static-validation.json`.

Static checker Python stdlib đã chạy từ root checkout: UTF-8 strict cả hai file; byte parity; line cap dưới400;32 Markdown local links tồn tại;0failure/exit0. Đây là self-check, không phải independent review hoặc thực thi thử các command shell/SQL trong runbook.

Runbook ghi đúng auto deploy sau CI push main, manual workflow không có CI dependency, draft stack base không phải release main, pending prerequisite review, production state UNKNOWN, startup `Database.Migrate()`, backup riêng DB/key ring/config, không dùng probe Windows lên VPS, forward-only normalization, role/public chunk/cold/log smoke và rollback image không rollback DB. Không in secrets hoặc hướng dẫn bypass host verification. Không sinh domain/provider setting/status mới.

## Validation not performed / Risks / Deferred

**Not run:** mọi command trong runbook có tác động tới production, actual SSH/HTTP/Docker/DB/backup/release/browser/provider; không xác nhận trạng thái production, GitHub protection hoặc actual remote branch/PR. Snapshot branch names là kế hoạch root đã cung cấp, không phải remote existence claim.

Production migration rehearsal/compatibility phải được operator review trên đúng release/target trước deploy nếu còn pending; metadata query và VERIFYONLY không thay restore+CHECKDB/preservation rehearsal. Existing six migration Skipped, two lint warnings, NU1603 và earlier unexplained cold health failure được giữ nguyên giới hạn. Không biến live-cost/provider tests thành gate bắt buộc mới cho local acceptance.

## Next recommended step

Root gửi paired docs và artifact static này cho reviewer độc lập cùng packet closeout, sau đó cập nhật actual integration commit/PR ở hồ sơ root khi có. Người dùng tự thực hiện preflight/backup/migration checkpoint trước bất kỳ event push main/manual deploy nào. Deployment vẫn Not run.
