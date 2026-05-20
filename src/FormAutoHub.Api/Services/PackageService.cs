using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IPackageService
{
    Task<IReadOnlyList<CreditPackageResponse>> GetActivePackagesAsync(CancellationToken cancellationToken);
    Task<CreditPackageListResponse?> GetAdminPackagesAsync(CancellationToken cancellationToken);
    Task<CreditPackageResponse?> CreateAdminPackageAsync(CreateCreditPackageRequest request, CancellationToken cancellationToken);
    Task<CreditPackageResponse?> UpdateAdminPackageAsync(Guid id, UpdateCreditPackageRequest request, CancellationToken cancellationToken);
}

public sealed class PackageService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser) : IPackageService
{
    public async Task<IReadOnlyList<CreditPackageResponse>> GetActivePackagesAsync(CancellationToken cancellationToken) =>
        await dbContext.CreditPackages
            .AsNoTracking()
            .Where(package => package.IsActive)
            .OrderBy(package => package.Price)
            .Select(package => package.ToResponse())
            .ToListAsync(cancellationToken);

    public async Task<CreditPackageListResponse?> GetAdminPackagesAsync(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return null;
        }

        var items = await dbContext.CreditPackages
            .AsNoTracking()
            .OrderBy(package => package.Price)
            .Select(package => package.ToResponse())
            .ToListAsync(cancellationToken);

        return new CreditPackageListResponse(items);
    }

    public async Task<CreditPackageResponse?> CreateAdminPackageAsync(CreateCreditPackageRequest request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return null;
        }

        ValidatePackageInput(request.Name, request.Credits, request.Price);

        var package = new CreditPackage
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Credits = request.Credits,
            Price = request.Price,
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.CreditPackages.Add(package);
        await dbContext.SaveChangesAsync(cancellationToken);
        return package.ToResponse();
    }

    public async Task<CreditPackageResponse?> UpdateAdminPackageAsync(Guid id, UpdateCreditPackageRequest request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return null;
        }

        ValidatePackageInput(request.Name, request.Credits, request.Price);

        var package = await dbContext.CreditPackages.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (package is null)
        {
            return null;
        }

        package.Name = request.Name.Trim();
        package.Credits = request.Credits;
        package.Price = request.Price;
        package.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return package.ToResponse();
    }

    private static void ValidatePackageInput(string name, int credits, decimal price)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Tên gói credit là bắt buộc.", nameof(name));
        }

        if (credits <= 0)
        {
            throw new ArgumentException("Số credit phải lớn hơn 0.", nameof(credits));
        }

        if (price <= 0)
        {
            throw new ArgumentException("Giá gói phải lớn hơn 0.", nameof(price));
        }

        if (price != decimal.Truncate(price))
        {
            throw new ArgumentException("Giá PayOS phải là số VND nguyên.", nameof(price));
        }
    }
}
