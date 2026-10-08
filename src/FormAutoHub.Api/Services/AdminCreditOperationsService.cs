using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public sealed class AdminCreditOperationsService(FormAutoHubDbContext db, ICreditService credits, ICurrentUserContext currentUser)
{
    public async Task<ManualCreditHistoryResponse> HistoryAsync(string? search, int page, int pageSize, CancellationToken ct)
    {
        if (!currentUser.IsAdmin) throw new UnauthorizedAccessException();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = from ledger in db.CreditTransactions.AsNoTracking()
                    where ledger.Type == "ManualGrant"
                    join recipient in db.Users on ledger.UserId equals recipient.Id into recipients
                    from recipient in recipients.DefaultIfEmpty()
                    let adminId = db.AuditLogs.Where(a => a.Action == "ManualGrant" && a.TargetType == "CreditTransaction" && a.TargetId == ledger.Id)
                        .OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id).Select(a => (Guid?)a.UserId).FirstOrDefault()
                    join actor in db.Users on adminId equals (Guid?)actor.Id into actors
                    from actor in actors.DefaultIfEmpty()
                    select new { ledger.Id, ledger.UserId,
                        UserEmail = recipient == null ? "" : recipient.Email, UserFullName = recipient == null ? "" : recipient.FullName,
                        Credits = ledger.Amount, ledger.BalanceAfter, Reason = ledger.Description, ledger.CreatedAt,
                        AdminId = adminId, AdminEmail = actor == null ? null : actor.Email, AdminFullName = actor == null ? null : actor.FullName };
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.UserEmail.Contains(term) || x.UserFullName.Contains(term) || x.Reason.Contains(term)
                || (x.AdminEmail != null && x.AdminEmail.Contains(term)) || (x.AdminFullName != null && x.AdminFullName.Contains(term)));
        }
        var total = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        page = Math.Min(page, Math.Max(1, totalPages));
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ManualCreditHistoryItem(x.Id, x.UserId, x.UserEmail, x.UserFullName, x.Credits,
                x.BalanceAfter, x.Reason, x.CreatedAt, x.AdminId, x.AdminEmail, x.AdminFullName)).ToListAsync(ct);
        return new(items, page, pageSize, total, totalPages);
    }

    public async Task<AdminCreditUserOptionListResponse> SearchAsync(string? search, CancellationToken ct)
    {
        if (!currentUser.IsAdmin) throw new UnauthorizedAccessException();
        var query = db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Email.Contains(search.Trim()));
        return new(await query.OrderBy(x => x.Email).Take(20).Select(x => new AdminCreditUserOption(x.Id, x.Email, x.FullName)).ToListAsync(ct));
    }

    public async Task<ManualCreditGrantResponse?> GrantAsync(ManualCreditGrantRequest request, CancellationToken ct)
    {
        if (!currentUser.IsAdmin) throw new UnauthorizedAccessException();
        if (request.UserId == Guid.Empty || request.Credits <= 0 || string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length > 1000)
            throw new ArgumentException("Người dùng, số credit nguyên dương và lý do (tối đa 1000 ký tự) là bắt buộc.");
        var transactionId = Guid.NewGuid();
        return await CreditWriteTransaction.RunAsync<ManualCreditGrantResponse?>(db, async () =>
        {
            var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == request.UserId, ct);
            if (user is null) return null;
            var committed = await db.CreditTransactions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == transactionId, ct);
            if (committed is not null) return new(user.Id, user.Email, committed.Id, committed.BalanceAfter);
            var (ledger, account) = await credits.AddManualCreditsAsync(user.Id, request.Credits, request.Reason, ct, transactionId);
            AuditLogWriter.Add(db, currentUser.UserId, "ManualGrant", "CreditTransaction", ledger.Id,
                new { userId = user.Id, credits = request.Credits, reason = request.Reason.Trim(), balanceAfter = account.Balance });
            await db.SaveChangesAsync(ct);
            return new(user.Id, user.Email, ledger.Id, account.Balance);
        }, ct);
    }
}
