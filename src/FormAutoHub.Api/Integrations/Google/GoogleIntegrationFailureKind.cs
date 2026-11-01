namespace FormAutoHub.Api.Integrations.Google;

internal enum GoogleIntegrationFailureKind
{
    Configuration,
    Authorization,
    Forbidden,
    NotFound,
    RateLimited,
    Unavailable,
    InvalidResponse,
    Transport
}
