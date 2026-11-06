using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Integrations.GoogleForms;

internal static partial class GoogleFormIdentity
{
    public static bool TryNormalize(string value, string endpoint, out string normalized)
    {
        normalized = "";
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme != "https" ||
            uri.Host != "docs.google.com" || !uri.IsDefaultPort || uri.UserInfo.Length != 0 || uri.Fragment.Length != 0) return false;
        var match = FormPath().Match(uri.AbsolutePath);
        if (!match.Success || match.Groups["endpoint"].Value != endpoint) return false;
        normalized = $"https://docs.google.com{match.Groups["identity"].Value}/{endpoint}";
        return true;
    }

    [GeneratedRegex(@"^(?<identity>/forms/d/(?:e/)?[A-Za-z0-9_-]+)/(?<endpoint>viewform|formResponse)$", RegexOptions.CultureInvariant)]
    private static partial Regex FormPath();
}

internal static class GoogleSubmissionEvidence
{
    public static VerifiedSubmissionOutcome Unknown(string code, string trace) => new(SubmissionOutcomeKind.Unknown,
        new(Guid.NewGuid(), code, "google-unverified-v1", $"internal:google-attempt:{Guid.NewGuid():D}",
            Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(trace))), DateTimeOffset.UtcNow, null, null));
}
