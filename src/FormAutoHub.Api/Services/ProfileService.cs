using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IProfileService
{
    Task<ProfileResponse?> GetAsync(CancellationToken cancellationToken);
    Task<UpdateProfileResponse?> UpdateAsync(UpdateProfileRequest request, CancellationToken cancellationToken);
    Task<ChangePasswordResponse?> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken);
}

public sealed class ProfileService(FormAutoHubDbContext dbContext, ICurrentUserContext currentUser)
    : IProfileService
{
    public async Task<ProfileResponse?> GetAsync(CancellationToken cancellationToken) =>
        await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == currentUser.UserId)
            .Select(user => user.ToProfileResponse())
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<UpdateProfileResponse?> UpdateAsync(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(item => item.Id == currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        user.FullName = request.FullName;
        await dbContext.SaveChangesAsync(cancellationToken);
        return user.ToUpdateProfileResponse();
    }

    public async Task<ChangePasswordResponse?> ChangePasswordAsync(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(item => item.Id == currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        if (user.PasswordHash != request.CurrentPasswordHash)
        {
            return new ChangePasswordResponse(false);
        }

        user.PasswordHash = request.NewPasswordHash;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ChangePasswordResponse(true);
    }
}
