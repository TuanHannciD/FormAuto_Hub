namespace FormAutoHub.Api.Auth;

public interface ICurrentUserContext
{
    Guid UserId { get; }
    bool IsAdmin { get; }
}

public sealed class HeaderCurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    private static readonly Guid DevelopmentUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public Guid UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.Request.Headers["X-FormAuto-UserId"].FirstOrDefault();
            return Guid.TryParse(value, out var userId) ? userId : DevelopmentUserId;
        }
    }

    public bool IsAdmin
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.Request.Headers["X-FormAuto-IsAdmin"].FirstOrDefault();
            return bool.TryParse(value, out var isAdmin) && isAdmin;
        }
    }
}
