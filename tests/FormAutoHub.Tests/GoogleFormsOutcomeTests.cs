using Microsoft.Extensions.Configuration;
using System.Net;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Integrations.GoogleForms;

namespace FormAutoHub.Tests;

public sealed class GoogleFormsOutcomeTests
{
    [Theory]
    [InlineData(200, "<html><title>Sign in - Google Accounts</title></html>", null)]
    [InlineData(200, "<html><body>Google Forms error</body></html>", null)]
    [InlineData(200, "<html><body>Your response has been recorded</body></html>", null)]
    [InlineData(200, "<html><body>Your response has", null)]
    [InlineData(200, "", null)]
    [InlineData(302, "", "https://accounts.google.com/ServiceLogin")]
    [InlineData(302, "", "https://example.invalid/untrusted")]
    [InlineData(302, "", "/forms/d/e/other/formResponse")]
    [InlineData(307, "", "/forms/d/e/synthetic/formResponse")]
    [InlineData(308, "", "/forms/d/e/synthetic/formResponse")]
    [InlineData(400, "Validation error", null)]
    [InlineData(500, "Rejected", null)]
    public async Task UnprovenDocumentOrRedirectIsUnknownAndNeverReplaysPost(int status, string body, string? redirect)
    {
        var handler = new Handler(() =>
        {
            var response = new HttpResponseMessage((HttpStatusCode)status) { Content = new StringContent(body) };
            if (redirect is not null) response.Headers.Location = new Uri(redirect, UriKind.RelativeOrAbsolute);
            return response;
        });
        using var http = new HttpClient(handler);
        var result = await new GoogleFormsClient(http).SubmitVerifiedAsync("https://docs.google.com/forms/d/e/synthetic/formResponse",
            new Dictionary<string, IReadOnlyList<string>> { ["entry.1"] = ["one"] }, default);
        Assert.Equal(SubmissionOutcomeKind.Unknown, result.Kind); Assert.Equal(1, handler.Calls);
        Assert.NotEqual(Guid.Empty, result.Evidence.EvidenceId); Assert.Equal(64, result.Evidence.ArtifactSha256.Length);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task TimeoutAndDisconnectAreUnknownAfterOnePossibleInvocation(bool timeout)
    {
        var handler = new Handler(() => { if (timeout) throw new TaskCanceledException("synthetic timeout"); throw new HttpRequestException("synthetic disconnect"); });
        using var http = new HttpClient(handler);
        var result = await new GoogleFormsClient(http).SubmitVerifiedAsync("https://docs.google.com/forms/d/e/synthetic/formResponse",
            new Dictionary<string, IReadOnlyList<string>> { ["entry.1"] = ["one"] }, default);
        Assert.Equal(SubmissionOutcomeKind.Unknown, result.Kind); Assert.Equal("TransportUncertain", result.Evidence.Code); Assert.Equal(1, handler.Calls);
    }

    [Theory]
    [InlineData("http://docs.google.com/forms/d/e/synthetic/formResponse")]
    [InlineData("https://docs.google.com.evil.invalid/forms/d/e/synthetic/formResponse")]
    [InlineData("https://name@docs.google.com/forms/d/e/synthetic/formResponse")]
    [InlineData("https://docs.google.com/forms/d/e/synthetic/formResponse/extra")]
    public async Task UnsupportedActionNeverInvokesNetwork(string action)
    {
        var handler = new Handler(() => throw new InvalidOperationException("Must never invoke")); using var http = new HttpClient(handler);
        var result = await new GoogleFormsClient(http).SubmitVerifiedAsync(action, new Dictionary<string, IReadOnlyList<string>>(), default);
        Assert.Equal(SubmissionOutcomeKind.Unknown, result.Kind); Assert.Equal("UnsupportedTarget", result.Evidence.Code); Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task ConfirmedReceiptHasRetrievableHashedArtifactAndOnePost()
    {
        var root = Path.Combine(Path.GetTempPath(), "formauto-receipt-test-" + Guid.NewGuid().ToString("N"));
        var handler = new ReceiptHandler();
        using var http = new HttpClient(handler);
        var config = new Microsoft.Extensions.Configuration.ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["GoogleForms:EvidencePath"] = root }).Build();
        var result = await new GoogleFormsClient(http, config).SubmitVerifiedAsync(GoogleFormsSubmissionParserTests.Action,
            new Dictionary<string, IReadOnlyList<string>> { ["entry.1"] = ["test"] }, default);
        Assert.Equal(SubmissionOutcomeKind.ConfirmedSuccess, result.Kind);
        Assert.Equal(1, handler.Posts);
        var artifact = Path.Combine(root, result.Evidence.EvidenceId.ToString("N") + ".json");
        Assert.True(File.Exists(artifact));
        Assert.Equal(result.Evidence.ArtifactSha256, Convert.ToHexStringLower(System.Security.Cryptography.SHA256.HashData(await File.ReadAllBytesAsync(artifact))));
        File.Delete(artifact); Directory.Delete(root);
    }
    private sealed class ReceiptHandler : HttpMessageHandler
    {
        public int Posts;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            if (request.Method == HttpMethod.Post) Posts++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(
                request.Method == HttpMethod.Get ? GoogleFormsSubmissionParserTests.Document() : GoogleFormsReceiptTests.Receipt(), System.Text.Encoding.UTF8, "text/html") });
        }
    }

    private sealed class Handler(Func<HttpResponseMessage> response) : HttpMessageHandler
    {
        public int Calls { get; private set; }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            if (request.Method == HttpMethod.Get) return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(GoogleFormsSubmissionParserTests.Document()) });
            Calls++; return Task.FromResult(response());
        }
    }
}
