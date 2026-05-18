namespace FormAutoHub.Api.Contracts;

public sealed record DashboardSummaryResponse(
    decimal CurrentCreditBalance,
    decimal TotalCreditsDeposited,
    decimal TotalCreditsUsed,
    int PendingTopupOrders,
    IReadOnlyList<TopupOrderResponse> RecentTopupOrders,
    IReadOnlyList<UsageLogResponse> RecentUsageLogs);

public sealed record CreditPackageResponse(
    Guid Id,
    string Name,
    int Credits,
    decimal Price,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed record CreateTopupOrderRequest(
    Guid PackageId,
    string PaymentMethod,
    string PaymentNote);

public sealed record TopupOrderResponse(
    Guid Id,
    Guid PackageId,
    int Credits,
    decimal Amount,
    string Status,
    string PaymentMethod,
    string PaymentNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PaidAt,
    DateTimeOffset? ApprovedAt);

public sealed record TopupOrderListResponse(IReadOnlyList<TopupOrderResponse> Items);

public sealed record CancelTopupOrderResponse(Guid Id, string Status);

public sealed record AdminTopupOrderResponse(
    Guid Id,
    Guid UserId,
    Guid PackageId,
    int Credits,
    decimal Amount,
    string Status,
    string PaymentMethod,
    string PaymentNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PaidAt,
    DateTimeOffset? ApprovedAt);

public sealed record ApproveTopupOrderRequest(string PaymentNote);

public sealed record ApproveTopupOrderResponse(
    Guid Id,
    string Status,
    Guid CreditTransactionId,
    decimal BalanceAfter);

public sealed record RejectTopupOrderRequest(string PaymentNote);

public sealed record RejectTopupOrderResponse(Guid Id, string Status);

public sealed record UsageLogResponse(
    Guid Id,
    string ToolName,
    string Action,
    int CreditsUsed,
    string Status,
    string Description,
    Guid? ProjectId,
    DateTimeOffset CreatedAt);

public sealed record UsageLogListResponse(IReadOnlyList<UsageLogResponse> Items);

public sealed record CreditTransactionResponse(
    Guid Id,
    decimal Amount,
    decimal BalanceAfter,
    string Type,
    string Description,
    string ReferenceType,
    Guid? ReferenceId,
    DateTimeOffset CreatedAt);

public sealed record CreditTransactionListResponse(IReadOnlyList<CreditTransactionResponse> Items);

public sealed record ProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    DateTimeOffset CreatedAt);

public sealed record UpdateProfileRequest(string FullName);

public sealed record UpdateProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    DateTimeOffset CreatedAt);

public sealed record ChangePasswordRequest(
    string CurrentPasswordHash,
    string NewPasswordHash);

public sealed record ChangePasswordResponse(bool Changed);
