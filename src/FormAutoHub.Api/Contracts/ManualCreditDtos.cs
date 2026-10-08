using System.ComponentModel.DataAnnotations;

namespace FormAutoHub.Api.Contracts;

public sealed record AdminCreditUserOption(Guid Id, string Email, string FullName);
public sealed record AdminCreditUserOptionListResponse(IReadOnlyList<AdminCreditUserOption> Items);
public sealed record ManualCreditGrantRequest(
    Guid UserId,
    [Range(1, int.MaxValue)] int Credits,
    [Required, StringLength(1000)] string Reason);
public sealed record ManualCreditGrantResponse(Guid UserId, string UserEmail, Guid CreditTransactionId, decimal BalanceAfter);
public sealed record UploadTopupEvidenceResponse(Guid FileId, string FileName, string ContentType, long Length, DateTimeOffset CreatedAt);
public sealed record ManualCreditHistoryItem(
    Guid Id, Guid UserId, string UserEmail, string UserFullName, decimal Credits,
    decimal BalanceAfter, string Reason, DateTimeOffset CreatedAt,
    Guid? AdminId, string? AdminEmail, string? AdminFullName);
public sealed record ManualCreditHistoryResponse(
    IReadOnlyList<ManualCreditHistoryItem> Items, int Page, int PageSize, int TotalItems, int TotalPages);
