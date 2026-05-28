using System.Text.Json;
using FormAutoHub.Api.Domain;

namespace FormAutoHub.Api.Integrations.AI;

public sealed class DeterministicAiProviderAdapter : IAiProviderAdapter
{
    public Task<AiProviderGenerateResult> GenerateAsync(
        AiProviderGenerateRequest request,
        CancellationToken cancellationToken)
    {
        using var document = JsonDocument.Parse(request.QuestionSnapshotJson);
        var questions = document.RootElement
            .EnumerateArray()
            .Select(ReadQuestion)
            .ToList();

        var outputJsons = new List<string>();
        var rawResponses = new List<object>();
        for (var index = 0; index < request.Count; index++)
        {
            var answers = questions
                .Select(question => new
                {
                    questionId = question.Id,
                    values = BuildValues(question, index)
                })
                .ToList();

            rawResponses.Add(new { answers });
            outputJsons.Add(JsonSerializer.Serialize(new { answers }));
        }

        var rawResponseJson = JsonSerializer.Serialize(new
        {
            provider = request.Provider,
            model = request.Model,
            responses = rawResponses
        });

        return Task.FromResult(new AiProviderGenerateResult(
            JsonSerializer.Serialize(request),
            rawResponseJson,
            outputJsons));
    }

    private static DeterministicQuestion ReadQuestion(JsonElement element)
    {
        var options = Array.Empty<string>();
        if (element.TryGetProperty("options", out var optionsElement) &&
            optionsElement.ValueKind == JsonValueKind.Array)
        {
            options = optionsElement
                .EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString() ?? string.Empty)
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .ToArray();
        }

        return new DeterministicQuestion(
            element.GetProperty("id").GetGuid(),
            element.GetProperty("label").GetString() ?? string.Empty,
            element.GetProperty("questionType").GetString() ?? string.Empty,
            options);
    }

    private static IReadOnlyList<string> BuildValues(DeterministicQuestion question, int index) =>
        question.QuestionType switch
        {
            FormQuestionTypes.ShortText or FormQuestionTypes.ParagraphText =>
                [$"AI answer {index + 1} for {question.Label}"],
            FormQuestionTypes.MultipleChoice
                or FormQuestionTypes.Dropdown
                or FormQuestionTypes.LinearScale
                or FormQuestionTypes.Rating =>
                [question.Options.FirstOrDefault() ?? "AI answer"],
            FormQuestionTypes.Checkbox =>
                [question.Options.FirstOrDefault() ?? "AI answer"],
            FormQuestionTypes.Date =>
                [DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(index)).ToString("yyyy-MM-dd")],
            FormQuestionTypes.Time =>
                [new TimeOnly(9, 0).AddMinutes(index).ToString("HH:mm")],
            FormQuestionTypes.MultipleChoiceGrid or FormQuestionTypes.CheckboxGrid =>
                [question.Options.FirstOrDefault() ?? "AI answer"],
            _ => ["AI answer"]
        };

    private sealed record DeterministicQuestion(
        Guid Id,
        string Label,
        string QuestionType,
        IReadOnlyList<string> Options);
}
