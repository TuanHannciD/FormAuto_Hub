using System.Net;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Integrations.AI;
using Microsoft.Extensions.Logging.Abstractions;

namespace FormAutoHub.Tests;

public sealed class OpenAiCompatibleProviderAdapterTests
{
    [Fact]
    public async Task GenerateAsync_CallsChatCompletionsEndpointAndExtractsResponses()
    {
        var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(new
            {
                choices = new[]
                {
                    new
                    {
                        message = new
                        {
                            content = JsonSerializer.Serialize(new
                            {
                                responses = new[]
                                {
                                    new { answers = new[] { new { questionId = Guid.NewGuid(), values = new[] { "A" } } } },
                                    new { answers = new[] { new { questionId = Guid.NewGuid(), values = new[] { "B" } } } }
                                }
                            })
                        }
                    }
                }
            }), Encoding.UTF8, "application/json")
        });
        var adapter = CreateAdapter(handler);
        var request = new AiProviderGenerateRequest(
            Guid.NewGuid(),
            "Option2",
            2,
            "OpenAICompatible",
            "gpt-test",
            "{}",
            "[]",
            "https://gateway.example.com/v1/",
            "secret-key");

        var result = await adapter.GenerateAsync(request, CancellationToken.None);

        Assert.Equal(new Uri("https://gateway.example.com/v1/chat/completions"), handler.RequestUri);
        Assert.Equal("Bearer", handler.AuthorizationScheme);
        Assert.Equal("secret-key", handler.AuthorizationParameter);
        Assert.Contains("\"response_format\":{\"type\":\"json_object\"}", handler.RequestBody, StringComparison.Ordinal);
        Assert.Equal(2, result.OutputJsons.Count);
        Assert.DoesNotContain("secret-key", result.RawProviderRequestJson, StringComparison.Ordinal);
        Assert.Contains("https://gateway.example.com/v1/chat/completions", result.RawProviderRequestJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GenerateAsync_ExtractsJsonWhenProviderAddsTextAroundContent()
    {
        var questionId = Guid.NewGuid();
        var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(new
            {
                choices = new[]
                {
                    new
                    {
                        message = new
                        {
                            content = $"duoi day la JSON: {{\"answers\":[{{\"questionId\":\"{questionId}\",\"values\":[\"A\"]}}]}}"
                        }
                    }
                }
            }), Encoding.UTF8, "application/json")
        });
        var adapter = CreateAdapter(handler);
        var request = new AiProviderGenerateRequest(
            Guid.NewGuid(),
            "Option2",
            1,
            "OpenAICompatible",
            "gpt-test",
            "{}",
            "[]",
            "https://gateway.example.com/v1/",
            "secret-key");

        var result = await adapter.GenerateAsync(request, CancellationToken.None);

        var output = Assert.Single(result.OutputJsons);
        Assert.Contains(questionId.ToString(), output, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerateAsync_ExtractsJsonFromServerSentEvents()
    {
        var questionId = Guid.NewGuid();
        var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                $"data: {{\"choices\":[{{\"delta\":{{\"content\":\"{{\\\"answers\\\":[{{\\\"questionId\\\":\\\"{questionId}\\\",\\\"values\\\":[\\\"A\\\"]}}]}}\"}}}}]}}\n\ndata: [DONE]\n",
                Encoding.UTF8,
                "text/event-stream")
        });
        var adapter = CreateAdapter(handler);
        var request = new AiProviderGenerateRequest(
            Guid.NewGuid(),
            "Option2",
            1,
            "OpenAICompatible",
            "gpt-test",
            "{}",
            "[]",
            "https://gateway.example.com/v1/",
            "secret-key");

        var result = await adapter.GenerateAsync(request, CancellationToken.None);

        var output = Assert.Single(result.OutputJsons);
        Assert.Contains(questionId.ToString(), output, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GenerateAsync_UsesChatCompletionsUrlAsIs()
    {
        var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(JsonSerializer.Serialize(new
            {
                choices = new[]
                {
                    new { message = new { content = "{\"answers\":[]}" } }
                }
            }), Encoding.UTF8, "application/json")
        });
        var adapter = CreateAdapter(handler);
        var request = new AiProviderGenerateRequest(
            Guid.NewGuid(),
            "Option2",
            1,
            "OpenAICompatible",
            "gpt-test",
            "{}",
            "[]",
            "https://gateway.example.com/v1/chat/completions",
            "secret-key");

        await adapter.GenerateAsync(request, CancellationToken.None);

        Assert.Equal(new Uri("https://gateway.example.com/v1/chat/completions"), handler.RequestUri);
    }

    [Fact]
    public async Task GenerateAsync_RequiresBaseUrl()
    {
        var adapter = CreateAdapter(new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)));
        var request = new AiProviderGenerateRequest(Guid.NewGuid(), "Option2", 1, "OpenAICompatible", "gpt-test", "{}", "[]", "", "secret-key");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            adapter.GenerateAsync(request, CancellationToken.None));

        Assert.Contains("base URL", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class TestHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }
        public string? AuthorizationScheme { get; private set; }
        public string? AuthorizationParameter { get; private set; }
        public string? RequestBody { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            AuthorizationScheme = request.Headers.Authorization?.Scheme;
            AuthorizationParameter = request.Headers.Authorization?.Parameter;
            RequestBody = request.Content?.ReadAsStringAsync(cancellationToken).GetAwaiter().GetResult();
            return Task.FromResult(handler(request));
        }
    }

    private static OpenAiCompatibleProviderAdapter CreateAdapter(TestHttpMessageHandler handler) =>
        new(new HttpClient(handler), NullLogger<OpenAiCompatibleProviderAdapter>.Instance);
}
