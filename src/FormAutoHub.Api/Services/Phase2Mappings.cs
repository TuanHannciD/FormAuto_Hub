using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Entities;

namespace FormAutoHub.Api.Services;

internal static class Phase2Mappings
{
    public static CreditPackageResponse ToResponse(this CreditPackage package) =>
        new(package.Id, package.Name, package.Credits, package.Price, package.IsActive, package.CreatedAt);

    public static TopupOrderResponse ToResponse(this TopupOrder order) =>
        new(order.Id, order.PackageId, order.Credits, order.Amount, order.Status, order.PaymentMethod,
            order.PaymentNote, order.CreatedAt, order.PaidAt, order.ApprovedAt);

    public static AdminTopupOrderResponse ToAdminResponse(this TopupOrder order) =>
        new(order.Id, order.UserId, order.PackageId, order.Credits, order.Amount, order.Status,
            order.PaymentMethod, order.PaymentNote, order.CreatedAt, order.PaidAt, order.ApprovedAt);

    public static UsageLogResponse ToResponse(this UsageLog log) =>
        new(log.Id, log.ToolName, log.Action, log.CreditsUsed, log.Status, log.Description, log.ProjectId,
            log.CreatedAt);

    public static CreditTransactionResponse ToResponse(this CreditTransaction transaction) =>
        new(transaction.Id, transaction.Amount, transaction.BalanceAfter, transaction.Type,
            transaction.Description, transaction.ReferenceType, transaction.ReferenceId, transaction.CreatedAt);

    public static ProfileResponse ToProfileResponse(this User user, UserExternalLogin? googleLogin = null) =>
        new(user.Id, user.Email, user.FullName, user.Role, user.CreatedAt, googleLogin is not null, googleLogin?.Email);

    public static UpdateProfileResponse ToUpdateProfileResponse(this User user) =>
        new(user.Id, user.Email, user.FullName, user.Role, user.CreatedAt);
}
