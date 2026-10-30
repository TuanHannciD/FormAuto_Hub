# Stage A — backup, restore rehearsal và clean DB

2026-10-29; sole SQL/runtime owner `/root/db_sync_runtime_owner`, dispatch `gpt-6.1-sol/high`, không agent con. Source HEAD `a19f7a2f3dc1bc54ff645d662d94fc614439256a` không đổi.

## Summary

**Verified:** Stage A theo root GO và final independent preflight review đã thực thi thành công: actual COPY_ONLY/CHECKSUM backup, VERIFYONLY, inspected header/file list, restore into a new owned DB với MOVE/no REPLACE, CHECKDB, equality fingerprints và clean DB creation. **DB gốc không đổi application schema/history/business data.** Main history vẫn13. Không apply migration mới.

**Verified:** exact count + full-primary-key SHA256 + full-row SHA256 của **34/34 tables** (33 application + history) bằng nhau giữa source trước backup, source sau backup, source cuối Stage A và restored clone. Các bảng money/ledger/usage/submission/evidence cũng nằm trong tập này. Không in raw business rows hoặc personal data. `stage-a-validation.json` chứa per-table equality assertions và exact counts; không phải kiểm toán business accounting equation.

## Reviewed authorization và operation identity

- Review `preflight-review/report.md` SHA256 `f17c47f39217ac8672643b857d2e009f94f123e1c42326a3929290e26e43f5fa` được hash-verify cùng ba scripts trước chạy; `stage-a-reviewed-hashes.json` ghi equality.
- Stage01 hash `e2bc54f5c876fbda16dad926d7b75f73f9bd495ff37979d162813684bd0711ac`; stage02 `b4b34148b266fe59e95616cd44f0bd2092e0cab20ce465d54575df31973d9b71`; stage03 `35f77b5f97b92a74b8d31ce32e5adf78305d680c4916e0ab6944dcc9709bc533`. Không sửa script đã review.
- Fresh preflight đúng `DESKTOP-TS5JR7L` / local default instance / `FormAutoHub`; sysadmin, đủ rights, ONLINE/MULTI_USER; 0 other sessions/requests/target transactions. Source evidence5/overlength0. C còn49.49GB; names/files mới chưa có. Stage guards recheck destination absence trước mutation.
- Dùng `sqlcmd -S localhost -E -C -d <exact target> -l 5 -b -y 0 -w 65535 -i <reviewed stage> -o <owned log>`, chạy từng stage và dừng khi exit khác0. Tất cả ba operation exit0.

## Backup proof

- File được giữ tại `C:/Program Files/Microsoft SQL Server/MSSQL17.MSSQLSERVER/MSSQL/Backup/FormAutoHub_FAHERR001_pre_sync_20261029_a19f7a2.bak` ngoài Git; actual **9,916,416 bytes**.
- SHA256 `EBC3BAC4A26FF7222401D37309D47AAEF7848B55EB1F0B54D0D91B6B3D7EE856`.
- COPY_ONLY=true, HasBackupChecksums=true, BackupType1(full), Position1, SourceServer `DESKTOP-TS5JR7L`, DatabaseName `FormAutoHub`; exactly2 logical files `FormAutoHub` typeD + `FormAutoHub_log` typeL. Header/filelist được đọc sau VERIFYONLY trước stage02, và validated bằng typed SQL reader trong `backup-manifest.json`.
- `stage-01-backup.log`: 5450 pages processed, successful BACKUP; “The backup set on file 1 is valid.” Backup ACL chỉ SQL service/SYSTEM/Administrators/OS owner FullControl. Không mở rộng ACL/copy backup vào repo.
- Backup ghi msdb metadata là side effect được phép; không thay recovery model, shrink, INIT/FORMAT/overwrite hoặc differential base.

## Owned DB contexts cho integration tests

| Resource | Actual identity / baseline |
| --- | --- |
| Existing restore clone | `FormAutoHub_FAHERR001_restore_20261029_a19f7a2`, database_id8, ONLINE/MULTI_USER/read-write, FULL, compatibility170, source collation `SQL_Latin1_General_CP1_CI_AS`, RCSI ON; 33 application tables + history, 13 history rows, exact source data fingerprint |
| Clean test DB | `FormAutoHub_FAHERR001_clean_20261029_a19f7a2`, database_id9, ONLINE/MULTI_USER/read-write, FULL, compatibility170, same collation; RCSI OFF (CREATE default), **0 user tables, chưa có history**. Chưa apply full chain; không gọi schema-compatible trước apply |

Restore physical files: SQL DATA directory với basenames `FormAutoHub_FAHERR001_restore_20261029_a19f7a2.mdf` và `..._log.ldf`; logical names giữ `FormAutoHub`/`FormAutoHub_log`. Clean files dùng basename tương ứng clean DB; logical `FAHERR001_clean_data`/`FAHERR001_clean_log`. Không file source bị dùng lại. Cả hai 72MiB data +200MiB log tại acquisition; stage metadata log ghi paths đầy đủ.

`stage-02-restore-rehearsal.log`: RESTORE successful, CHECKDB WITH NO_INFOMSGS exit0/no errors. Actual successful file creation xác minh SQL service restore access, dù OS DATA Get-Acl trước đó bị deny. Final session check: 0 sessions vào hai owned DB; không process/tab/listener mới.

Overlength DB chưa được tạo: proposed name vẫn chỉ reservation. GO A không bao gồm script/migration/fixture đó.

## Fingerprint method và limitations

`Capture-Fingerprint.ps1` chỉ SELECT trên allowlisted local targets; serializable read transaction, LOCK_TIMEOUT10s, command timeout120s. Full PK ordered theo key_ordinal, all columns theo column_id; SQL FOR JSON PATH INCLUDE_NULL_VALUES canonical serialization, binary JSON SHA2_256 tính trong SQL; chỉ COUNT_BIG/keyHash/rowHash thoát ra. Evidence/binary/rowversion/secret fields tham gia hash nhưng raw values không in/lưu. Primary key thiếu sẽ fail. Source trước/sau backup bằng nhau, restored clone bằng source, và source cuối Stage A bằng baseline.

Đây là equality/digest proof và CHECKDB, không thay semantic ledger audit, concurrency test, restore lên user DB hoặc permission model review. Read transactions đã đóng; quiescence sample không phải reservation cho cutover sau này. Final SQL metadata log có sqlcmd JSON chunks ngắt dòng trong trường path; dùng như human-readable raw log, không giả là one-line JSON parser artifact.

Harness retry minh bạch: fingerprint attempt đầu fail SQL parse vì alias `rowCount` trùng keyword; read transaction rollback, chưa backup/DDL. Sửa thành `[rowCount]`, rerun exit0 và capture34 tables. Đây là lỗi artifact helper, không lỗi sản phẩm. Không overwrite fingerprint evidence đã tồn tại; các successful captures đều file riêng.

## Files changed / Scope alignment

Chỉ ghi thêm evidence/helper/report/ledger trong `artifacts/reports/db-sync-2026-10-29/runtime/`, backup trong SQL default Backup và hai owned DB/files mới. `git diff --name-only` vẫn trống trong main checkout. Không product/appsettings/secretconfig edits, install/commit/push/deploy/cleanup, provider/payment/submission, API/web/browser acquisition. Giữ nguyên mọi prior evidence và user resources.

## Validation not performed / Risks / Next recommended step

**Not run:** migration patch/full-chain/incremental/overlength/concurrency SQL tests, strict schema verifier, main apply, API startup/HTTP/auth/browser/provider sandbox, business ledger semantic audit. Stage A không tự đóng task DB sync/FAH-ERR-001.

Chờ reviewed patch/offline SQL hash và root GO B cho **owned test DBs**. Pre-sync expected normalization pending + exact two max columns là approved baseline, không phải tự tạo blocker; strict post-sync phải pending0/canonical200/50. Main apply vẫn **NOT YET** và cần root checkpoint riêng sau test/review. Backup/clone/evidence được giữ; không DROP, restore đè user DB hoặc cleanup tự động.
