using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FormAutoHub.Api.Integrations.Google;

public sealed record GoogleFormStructure(
    string FormId,
    string Title,
    IReadOnlyList<GoogleFormQuestionItem> Questions);

public sealed record GoogleFormQuestionItem(
    string QuestionId,
    string QuestionText,
    string QuestionType,
    bool IsRequired,
    int OrderIndex);

public sealed record GoogleFormCreateResult(
    string FormId,
    string FormUrl);

public sealed record GoogleFormQuestionDraft(
    string QuestionText,
    string QuestionType,
    bool IsRequired,
    int? ScaleLow,
    int? ScaleHigh);

public sealed record GoogleFormResponseItem(
    string ResponseId,
    DateTimeOffset? ResponseTimestamp,
    IReadOnlyDictionary<string, IReadOnlyList<string>> Answers);

public interface IGoogleFormsApiService
{
    Task<GoogleFormStructure?> GetFormStructureAsync(string accessToken, string formId, CancellationToken cancellationToken);
    Task<GoogleFormCreateResult?> CreateFormAsync(string accessToken, string title, CancellationToken cancellationToken);
    Task<bool> CreateQuestionsAsync(
        string accessToken,
        string formId,
        IReadOnlyList<GoogleFormQuestionDraft> questions,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<GoogleFormResponseItem>?> ListResponsesAsync(
        string accessToken,
        string formId,
        CancellationToken cancellationToken);
}

public sealed class GoogleFormsApiService(HttpClient httpClient) : IGoogleFormsApiService
{
    private const string FormsApiBase = "https://forms.googleapis.com/v1/forms";

    public async Task<GoogleFormStructure?> GetFormStructureAsync(
        string accessToken,
        string formId,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"{FormsApiBase}/{formId}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var body = await response.Content.ReadFromJsonAsync<GoogleFormsApiResponse>(cancellationToken: cancellationToken);
        if (body?.FormId is null)
        {
            return null;
        }

        var title = body.Info?.Title ?? "Untitled Form";
        var questions = new List<GoogleFormQuestionItem>();
        var orderIndex = 0;

        if (body.Items is not null)
        {
            foreach (var item in body.Items)
            {
                var questionItem = item.QuestionItem;
                if (questionItem?.Question is null)
                {
                    continue;
                }

                var question = questionItem.Question;
                var questionText = string.IsNullOrWhiteSpace(item.Title)
                    ? $"Question {orderIndex + 1}"
                    : item.Title.Trim();
                var questionType = MapQuestionType(question.QuestionId, question);

                questions.Add(new GoogleFormQuestionItem(
                    QuestionId: question.QuestionId ?? $"q{orderIndex}",
                    QuestionText: questionText,
                    QuestionType: questionType,
                    IsRequired: question.Required ?? false,
                    OrderIndex: orderIndex));

                orderIndex++;
            }
        }

        return new GoogleFormStructure(body.FormId, title, questions);
    }

    public async Task<GoogleFormCreateResult?> CreateFormAsync(
        string accessToken,
        string title,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, FormsApiBase)
        {
            Content = JsonContent.Create(new
            {
                info = new
                {
                    title
                }
            })
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var body = await response.Content.ReadFromJsonAsync<GoogleFormsApiResponse>(cancellationToken: cancellationToken);
        if (string.IsNullOrWhiteSpace(body?.FormId))
        {
            return null;
        }

        return new GoogleFormCreateResult(
            body.FormId,
            $"https://docs.google.com/forms/d/{body.FormId}/edit");
    }

    public async Task<bool> CreateQuestionsAsync(
        string accessToken,
        string formId,
        IReadOnlyList<GoogleFormQuestionDraft> questions,
        CancellationToken cancellationToken)
    {
        if (questions.Count == 0)
        {
            return true;
        }

        var requests = questions.Select((question, index) => new
        {
            createItem = new
            {
                item = new
                {
                    title = question.QuestionText,
                    questionItem = new
                    {
                        question = CreateGoogleQuestion(question)
                    }
                },
                location = new
                {
                    index
                }
            }
        }).ToList();

        var request = new HttpRequestMessage(HttpMethod.Post, $"{FormsApiBase}/{formId}:batchUpdate")
        {
            Content = JsonContent.Create(new { requests })
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<IReadOnlyList<GoogleFormResponseItem>?> ListResponsesAsync(
        string accessToken,
        string formId,
        CancellationToken cancellationToken)
    {
        var responses = new List<GoogleFormResponseItem>();
        string? pageToken = null;

        do
        {
            var url = string.IsNullOrWhiteSpace(pageToken)
                ? $"{FormsApiBase}/{formId}/responses"
                : $"{FormsApiBase}/{formId}/responses?pageToken={Uri.EscapeDataString(pageToken)}";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var body = await response.Content.ReadFromJsonAsync<GoogleFormsResponsesApiResponse>(cancellationToken: cancellationToken);
            if (body?.Responses is not null)
            {
                foreach (var item in body.Responses)
                {
                    if (string.IsNullOrWhiteSpace(item.ResponseId))
                    {
                        continue;
                    }

                    responses.Add(new GoogleFormResponseItem(
                        item.ResponseId,
                        item.LastSubmittedTime ?? item.CreateTime,
                        ExtractAnswers(item.Answers)));
                }
            }

            pageToken = body?.NextPageToken;
        }
        while (!string.IsNullOrWhiteSpace(pageToken));

        return responses;
    }

    private static IReadOnlyDictionary<string, IReadOnlyList<string>> ExtractAnswers(
        Dictionary<string, GoogleFormsAnswer>? answers)
    {
        var result = new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase);
        if (answers is null)
        {
            return result;
        }

        foreach (var (questionId, answer) in answers)
        {
            var values = answer.TextAnswers?.Answers?
                .Select(item => item.Value?.Trim())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item!)
                .ToList() ?? [];
            result[questionId] = values;
        }

        return result;
    }

    private static object CreateGoogleQuestion(GoogleFormQuestionDraft question)
    {
        if (string.Equals(question.QuestionType, "paragraphText", StringComparison.OrdinalIgnoreCase))
        {
            return new
            {
                required = question.IsRequired,
                textQuestion = new
                {
                    paragraph = true
                }
            };
        }

        if (string.Equals(question.QuestionType, "linearScale", StringComparison.OrdinalIgnoreCase))
        {
            var low = question.ScaleLow ?? 1;
            var high = question.ScaleHigh ?? 5;
            return new
            {
                required = question.IsRequired,
                scaleQuestion = new
                {
                    low,
                    high,
                    lowLabel = low.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    highLabel = high.ToString(System.Globalization.CultureInfo.InvariantCulture)
                }
            };
        }

        return new
        {
            required = question.IsRequired,
            textQuestion = new
            {
                paragraph = false
            }
        };
    }

    private static string MapQuestionType(string? questionId, GoogleFormsQuestion question)
    {
        if (question.TextQuestion is not null)
        {
            return question.TextQuestion.Paragraph == true ? "paragraphText" : "shortText";
        }

        if (question.ChoiceQuestion is not null)
        {
            return question.ChoiceQuestion.Type switch
            {
                "RADIO" => "multipleChoice",
                "CHECKBOX" => "checkbox",
                "DROP_DOWN" => "dropdown",
                _ => "multipleChoice"
            };
        }

        if (question.ScaleQuestion is not null)
        {
            return "linearScale";
        }

        if (question.DateQuestion is not null)
        {
            return question.DateQuestion.IncludeTime == true ? "dateTime" : "date";
        }

        if (question.TimeQuestion is not null)
        {
            return "time";
        }

        if (question.RatingQuestion is not null)
        {
            return "rating";
        }

        return "text";
    }

    private sealed class GoogleFormsApiResponse
    {
        [JsonPropertyName("formId")]
        public string? FormId { get; set; }

        [JsonPropertyName("info")]
        public GoogleFormsInfo? Info { get; set; }

        [JsonPropertyName("items")]
        public List<GoogleFormsItem>? Items { get; set; }
    }

    private sealed class GoogleFormsInfo
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }
    }

    private sealed class GoogleFormsItem
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("questionItem")]
        public GoogleFormsQuestionItemWrapper? QuestionItem { get; set; }
    }

    private sealed class GoogleFormsQuestionItemWrapper
    {
        [JsonPropertyName("question")]
        public GoogleFormsQuestion? Question { get; set; }
    }

    private sealed class GoogleFormsQuestion
    {
        [JsonPropertyName("questionId")]
        public string? QuestionId { get; set; }

        [JsonPropertyName("required")]
        public bool? Required { get; set; }

        [JsonPropertyName("textQuestion")]
        public GoogleFormsTextQuestion? TextQuestion { get; set; }

        [JsonPropertyName("choiceQuestion")]
        public GoogleFormsChoiceQuestion? ChoiceQuestion { get; set; }

        [JsonPropertyName("scaleQuestion")]
        public GoogleFormsScaleQuestion? ScaleQuestion { get; set; }

        [JsonPropertyName("dateQuestion")]
        public GoogleFormsDateQuestion? DateQuestion { get; set; }

        [JsonPropertyName("timeQuestion")]
        public GoogleFormsTimeQuestion? TimeQuestion { get; set; }

        [JsonPropertyName("ratingQuestion")]
        public GoogleFormsRatingQuestion? RatingQuestion { get; set; }
    }

    private sealed class GoogleFormsTextQuestion
    {
        [JsonPropertyName("paragraph")]
        public bool? Paragraph { get; set; }
    }

    private sealed class GoogleFormsChoiceQuestion
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }

    private sealed class GoogleFormsScaleQuestion
    {
    }

    private sealed class GoogleFormsDateQuestion
    {
        [JsonPropertyName("includeTime")]
        public bool? IncludeTime { get; set; }
    }

    private sealed class GoogleFormsTimeQuestion
    {
    }

    private sealed class GoogleFormsRatingQuestion
    {
    }

    private sealed class GoogleFormsResponsesApiResponse
    {
        [JsonPropertyName("responses")]
        public List<GoogleFormsResponse>? Responses { get; set; }

        [JsonPropertyName("nextPageToken")]
        public string? NextPageToken { get; set; }
    }

    private sealed class GoogleFormsResponse
    {
        [JsonPropertyName("responseId")]
        public string? ResponseId { get; set; }

        [JsonPropertyName("createTime")]
        public DateTimeOffset? CreateTime { get; set; }

        [JsonPropertyName("lastSubmittedTime")]
        public DateTimeOffset? LastSubmittedTime { get; set; }

        [JsonPropertyName("answers")]
        public Dictionary<string, GoogleFormsAnswer>? Answers { get; set; }
    }

    private sealed class GoogleFormsAnswer
    {
        [JsonPropertyName("textAnswers")]
        public GoogleFormsTextAnswers? TextAnswers { get; set; }
    }

    private sealed class GoogleFormsTextAnswers
    {
        [JsonPropertyName("answers")]
        public List<GoogleFormsTextAnswer>? Answers { get; set; }
    }

    private sealed class GoogleFormsTextAnswer
    {
        [JsonPropertyName("value")]
        public string? Value { get; set; }
    }
}
