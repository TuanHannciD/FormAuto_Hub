using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FormAutoHub.Api.Integrations.AI;

public sealed class OpenAiCompatibleProviderAdapter(
    HttpClient httpClient,
    ILogger<OpenAiCompatibleProviderAdapter> logger) : IAiProviderAdapter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<AiProviderGenerateResult> GenerateAsync(
        AiProviderGenerateRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.BaseUrl))
        {
            throw new InvalidOperationException("AI provider base URL is required for OpenAI-compatible runtime generation.");
        }

        if (string.IsNullOrWhiteSpace(request.ApiKey))
        {
            throw new InvalidOperationException("AI provider API key is required for runtime generation.");
        }

        var endpoint = BuildChatCompletionsEndpoint(request.BaseUrl);
        var payload = BuildPayload(request);
        var rawRequestJson = JsonSerializer.Serialize(new
        {
            endpoint,
            provider = request.Provider,
            model = request.Model,
            mode = request.Mode,
            count = request.Count,
            payload
        }, JsonOptions);
        //log lỗi
        logger.LogInformation("AI raw request: {RawRequestJson}", rawRequestJson);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", request.ApiKey);

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var rawResponseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        // log lỗi 
        logger.LogInformation("AI raw response: {RawResponseJson}", rawResponseJson);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"AI provider returned HTTP {(int)response.StatusCode}.");
        }

        var outputJsons = ExtractOutputJsons(rawResponseJson);
        return new AiProviderGenerateResult(rawRequestJson, rawResponseJson, outputJsons);
    }

    private static Uri BuildChatCompletionsEndpoint(string baseUrl)
    {
        var normalized = baseUrl.Trim().TrimEnd('/');
        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException("AI provider base URL must be an absolute http or https URL.");
        }

        if (uri.AbsolutePath.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase))
        {
            return uri;
        }

        return new Uri($"{normalized}/chat/completions");
    }

    private static object BuildPayload(AiProviderGenerateRequest request) =>
        new
        {
            model = request.Model,
            temperature = 0.2,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new
                {
                    role = "system",
                    content = """
                    Return JSON only. Do not include markdown, explanations, greetings, comments, or text before or after the JSON.

                    For one preview, return exactly:
                    {"answers":[{"questionId":"...","values":["..."]}]}

                    For multiple previews, return exactly:
                    {"responses":[{"answers":[{"questionId":"...","values":["..."]}]}]}

                    Rules:
                    - Return one valid answer for every provided question.
                    - Every answer must use one questionId from the provided questions.
                    - The values property must always be an array of strings.
                    - Never return numbers as JSON numbers. Always return strings.

                    For questions with options:
                    - The answer value must be copied exactly from the provided options.
                    - Treat numeric-looking options as strings, not numbers.
                    - Do not calculate, interpolate, round, normalize, translate, or invent option values.
                    - Do not return a value between two options.
                    - Do not return min/max range values unless they appear exactly in options.
                    - If options are ["1","2","3","4","5"], valid values are only "1", "2", "3", "4", or "5".
                    - Invalid examples for ["1","2","3","4","5"]: "0", "3.5", "6", 3, 3.5, "5.0".
                    - For choice, dropdown, scale, rating, and grid questions, every value must be exactly equal to one of the provided option strings.

                    If no valid answer can be determined, choose the closest valid option from the provided options, but still return only the exact option string.
                    """
                },
                new
                {
                    role = "user",
                    content = JsonSerializer.Serialize(new
                    {
                        request.Mode,
                        request.Count,
                        requiredOutput = request.Count == 1
                            ? new { answers = new[] { new { questionId = "question-guid-from-input", values = new[] { "answer" } } } }
                            : (object)new { responses = new[] { new { answers = new[] { new { questionId = "question-guid-from-input", values = new[] { "answer" } } } } } },
                        promptProfile = JsonSerializer.Deserialize<JsonElement>(request.PromptSnapshotJson),
                        questions = JsonSerializer.Deserialize<JsonElement>(request.QuestionSnapshotJson)
                    }, JsonOptions)
                }
            }
        };

    private static IReadOnlyList<string> ExtractOutputJsons(string rawResponseJson)
    {
        var content = ReadAssistantContent(rawResponseJson);
        if (string.IsNullOrWhiteSpace(content))
        {
            return [];
        }

        content = ExtractJsonContent(StripJsonFence(content));
        if (!LooksLikeJson(content))
        {
            return [];
        }

        JsonDocument contentDocument;
        try
        {
            contentDocument = JsonDocument.Parse(content);
        }
        catch (JsonException)
        {
            return [];
        }

        using (contentDocument)
        {
            var root = contentDocument.RootElement;

            if (root.ValueKind == JsonValueKind.Object &&
                root.TryGetProperty("responses", out var responses) &&
                responses.ValueKind == JsonValueKind.Array)
            {
                return responses.EnumerateArray().Select(item => item.GetRawText()).ToList();
            }

            if (root.ValueKind == JsonValueKind.Array)
            {
                return root.EnumerateArray().Select(item => item.GetRawText()).ToList();
            }

            if (root.ValueKind == JsonValueKind.Object &&
                root.TryGetProperty("answers", out var answers) &&
                answers.ValueKind == JsonValueKind.Array)
            {
                return [root.GetRawText()];
            }

            return [];
        }
    }

    private static string ReadAssistantContent(string rawResponseJson)
    {
        var trimmed = rawResponseJson.TrimStart();
        if (trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return ReadServerSentEventContent(rawResponseJson);
        }

        if (!LooksLikeJson(trimmed))
        {
            return trimmed;
        }

        using var document = JsonDocument.Parse(trimmed);
        return ReadAssistantContent(document.RootElement);
    }

    private static string ReadServerSentEventContent(string rawResponseJson)
    {
        var builder = new StringBuilder();
        using var reader = new StringReader(rawResponseJson);
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            var trimmed = line.Trim();
            if (!trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var data = trimmed["data:".Length..].Trim();
            if (string.IsNullOrWhiteSpace(data) || data.Equals("[DONE]", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!LooksLikeJson(data))
            {
                builder.Append(data);
                continue;
            }

            using var document = JsonDocument.Parse(data);
            builder.Append(ReadAssistantContent(document.RootElement));
        }

        return builder.ToString();
    }

    private static bool LooksLikeJson(string content)
    {
        var trimmed = content.TrimStart();
        return trimmed.StartsWith("{", StringComparison.Ordinal) ||
               trimmed.StartsWith("[", StringComparison.Ordinal);
    }

    private static string ReadAssistantContent(JsonElement root)
    {
        if (!root.TryGetProperty("choices", out var choices) ||
            choices.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (var choice in choices.EnumerateArray())
        {
            if (choice.TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var content))
            {
                if (content.ValueKind == JsonValueKind.String)
                {
                    return content.GetString() ?? string.Empty;
                }

                return content.GetRawText();
            }

            if (choice.TryGetProperty("delta", out var delta) &&
                delta.TryGetProperty("content", out var deltaContent))
            {
                if (deltaContent.ValueKind == JsonValueKind.String)
                {
                    return deltaContent.GetString() ?? string.Empty;
                }

                return deltaContent.GetRawText();
            }
        }

        return string.Empty;
    }

    private static string StripJsonFence(string content)
    {
        var trimmed = content.Trim();
        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            return trimmed;
        }

        var firstLineEnd = trimmed.IndexOf('\n');
        var lastFenceStart = trimmed.LastIndexOf("```", StringComparison.Ordinal);
        if (firstLineEnd < 0 || lastFenceStart <= firstLineEnd)
        {
            return trimmed;
        }

        return trimmed[(firstLineEnd + 1)..lastFenceStart].Trim();
    }

    private static string ExtractJsonContent(string content)
    {
        var trimmed = content.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) ||
            trimmed.StartsWith("{", StringComparison.Ordinal) ||
            trimmed.StartsWith("[", StringComparison.Ordinal))
        {
            return trimmed;
        }

        var start = trimmed.IndexOfAny(['{', '[']);
        if (start < 0)
        {
            return trimmed;
        }

        var open = trimmed[start];
        var close = open == '{' ? '}' : ']';
        var depth = 0;
        var inString = false;
        var escaped = false;
        for (var index = start; index < trimmed.Length; index++)
        {
            var current = trimmed[index];
            if (escaped)
            {
                escaped = false;
                continue;
            }

            if (current == '\\' && inString)
            {
                escaped = true;
                continue;
            }

            if (current == '"')
            {
                inString = !inString;
                continue;
            }

            if (inString)
            {
                continue;
            }

            if (current == open)
            {
                depth++;
            }
            else if (current == close)
            {
                depth--;
                if (depth == 0)
                {
                    return trimmed[start..(index + 1)];
                }
            }
        }

        return trimmed[start..];
    }
}
