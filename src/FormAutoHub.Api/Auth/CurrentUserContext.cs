namespace FormAutoHub.Api.Auth;

using System.Security.Claims;

public interface ICurrentUserContext
{
    Guid UserId { get; }
    bool IsAdmin { get; }
}

public sealed class HttpCurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    private static readonly Guid DevelopmentUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public Guid UserId
    {
        get
        {
            var httpContext = httpContextAccessor.HttpContext;
            var value = httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext?.User.FindFirstValue("sub")
                ?? httpContext?.Request.Headers["X-FormAuto-UserId"].FirstOrDefault();
            return Guid.TryParse(value, out var userId) ? userId : DevelopmentUserId;
        }
    }

    public bool IsAdmin
    {
        get
        {
            var httpContext = httpContextAccessor.HttpContext;
            if (httpContext?.User.IsInRole("Admin") == true)
            {
                return true;
            }

            var role = httpContext?.User.FindFirstValue(ClaimTypes.Role) ?? httpContext?.User.FindFirstValue("role");
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            var value = httpContext?.Request.Headers["X-FormAuto-IsAdmin"].FirstOrDefault();
            return bool.TryParse(value, out var isAdmin) && isAdmin;
        }
    }
}
