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

public interface IGoogleFormsApiService
{
    Task<GoogleFormStructure?> GetFormStructureAsync(string accessToken, string formId, CancellationToken cancellationToken);
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
                var questionText = question.QuestionId ?? $"Question {orderIndex + 1}";
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
}
