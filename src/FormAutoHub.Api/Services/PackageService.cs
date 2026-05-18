using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IPackageService
{
    Task<IReadOnlyList<CreditPackageResponse>> GetActivePackagesAsync(CancellationToken cancellationToken);
}

public sealed class PackageService(FormAutoHubDbContext dbContext) : IPackageService
{
    public async Task<IReadOnlyList<CreditPackageResponse>> GetActivePackagesAsync(CancellationToken cancellationToken) =>
        await dbContext.CreditPackages
            .AsNoTracking()
            .Where(package => package.IsActive)
            .OrderBy(package => package.Price)
            .Select(package => package.ToResponse())
            .ToListAsync(cancellationToken);
}
