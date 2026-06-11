namespace FormAutoHub.Api.Services.Nckh;

public enum ResearchFormServiceStatus
{
    Success,
    InvalidRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict,
    ExternalError
}

public sealed record ResearchFormServiceResult<T>(ResearchFormServiceStatus Status, T? Value = default, string? Message = null);
