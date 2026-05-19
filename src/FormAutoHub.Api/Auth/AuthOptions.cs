namespace FormAutoHub.Api.Auth;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string Issuer { get; set; } = "FormAutoHub";
    public string Audience { get; set; } = "FormAutoHub";
    public string SigningKey { get; set; } = string.Empty;
    public string GoogleClientId { get; set; } = string.Empty;
}
