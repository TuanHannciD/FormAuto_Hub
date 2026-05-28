using System.Globalization;
using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;

namespace FormAutoHub.Api.Services;

public sealed class AiOutputValidator : IAiOutputValidator
{
    public AiOutputValidationResult Validate(string outputJson, IReadOnlyList<FormQuestion> projectQuestions)
    {
        if (string.IsNullOrWhiteSpace(outputJson))
        {
            return AiOutputValidationResult.Invalid("AI output must be structured JSON.");
        }

        var errors = new List<AiOutputValidationError>();
        var validAnswers = new List<GeneratedAnswerResponse>();

        try
        {
            using var document = JsonDocument.Parse(outputJson);
            if (!TryReadAnswerItems(document.RootElement, out var answerItems))
            {
                return AiOutputValidationResult.Invalid("AI output must contain an answers array.");
            }

            if (answerItems.Count == 0)
            {
                return AiOutputValidationResult.Invalid("AI output answers array must contain at least one item.");
            }

            var questionsById = projectQuestions.ToDictionary(question => question.Id);
            var seenQuestionIds = new HashSet<Guid>();
            var itemIndex = 0;
            foreach (var answerItem in answerItems)
            {
                ValidateAnswerItem(answerItem, itemIndex, questionsById, seenQuestionIds, validAnswers, errors);
                itemIndex++;
            }
        }
        catch (JsonException)
        {
            return AiOutputValidationResult.Invalid("AI output must be valid JSON.");
        }

        return new AiOutputValidationResult(validAnswers, errors);
    }

    private static bool TryReadAnswerItems(JsonElement root, out IReadOnlyList<JsonElement> answerItems)
    {
        answerItems = Array.Empty<JsonElement>();
        if (root.ValueKind != JsonValueKind.Object ||
            !root.TryGetProperty("answers", out var answers) ||
            answers.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        answerItems = answers.EnumerateArray().ToList();
        return true;
    }

    private static void ValidateAnswerItem(
        JsonElement answerItem,
        int itemIndex,
        IReadOnlyDictionary<Guid, FormQuestion> questionsById,
        ISet<Guid> seenQuestionIds,
        ICollection<GeneratedAnswerResponse> validAnswers,
        ICollection<AiOutputValidationError> errors)
    {
        if (answerItem.ValueKind != JsonValueKind.Object)
        {
            errors.Add(new AiOutputValidationError(null, $"answers[{itemIndex}] must be an object."));
            return;
        }

        if (!TryReadQuestionId(answerItem, out var questionId))
        {
            errors.Add(new AiOutputValidationError(null, $"answers[{itemIndex}].questionId must reference a valid question id."));
            return;
        }

        if (!questionsById.TryGetValue(questionId, out var question))
        {
            errors.Add(new AiOutputValidationError(questionId, "Question is not part of the current project."));
            return;
        }

        if (!seenQuestionIds.Add(questionId))
        {
            errors.Add(new AiOutputValidationError(questionId, "Question appears more than once in AI output."));
            return;
        }

        if (!TryReadValues(answerItem, out var values))
        {
            errors.Add(new AiOutputValidationError(questionId, "Answer values must be a non-empty string array."));
            return;
        }

        var validationError = ValidateValues(question, values);
        if (validationError is not null)
        {
            errors.Add(new AiOutputValidationError(questionId, validationError));
            return;
        }

        validAnswers.Add(new GeneratedAnswerResponse(
            question.Id,
            question.EntryId,
            question.Label,
            question.QuestionType,
            values));
    }

    private static bool TryReadQuestionId(JsonElement answerItem, out Guid questionId)
    {
        questionId = Guid.Empty;
        return answerItem.TryGetProperty("questionId", out var questionIdElement) &&
            questionIdElement.ValueKind == JsonValueKind.String &&
            Guid.TryParse(questionIdElement.GetString(), out questionId);
    }

    private static bool TryReadValues(JsonElement answerItem, out IReadOnlyList<string> values)
    {
        values = Array.Empty<string>();
        if (!answerItem.TryGetProperty("values", out var valuesElement) || valuesElement.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        var parsedValues = new List<string>();
        foreach (var valueElement in valuesElement.EnumerateArray())
        {
            if (valueElement.ValueKind != JsonValueKind.String)
            {
                return false;
            }

            var value = valueElement.GetString();
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            parsedValues.Add(value);
        }

        values = parsedValues;
        return parsedValues.Count > 0;
    }

    private static string? ValidateValues(FormQuestion question, IReadOnlyList<string> values)
    {
        if (values.Count > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            return "Answer value count is outside the safe range.";
        }

        if (values.Any(value => value.Length > Phase4SafetyLimits.MaxGeneratedAnswerValueLength))
        {
            return "Answer value is too long.";
        }

        if (values.Any(AiSafetyTextRules.ContainsUnsafeContent))
        {
            return "Answer value contains unsafe or forbidden content.";
        }

        return question.QuestionType switch
        {
            FormQuestionTypes.ShortText or FormQuestionTypes.ParagraphText => ValidateSingleValue(values),
            FormQuestionTypes.MultipleChoice
                or FormQuestionTypes.Dropdown
                or FormQuestionTypes.LinearScale
                or FormQuestionTypes.Rating => ValidateSingleOption(question, values),
            FormQuestionTypes.Checkbox => ValidateCheckboxOptions(question, values),
            FormQuestionTypes.MultipleChoiceGrid => ValidateSingleOption(question, values),
            FormQuestionTypes.CheckboxGrid => ValidateCheckboxOptions(question, values),
            FormQuestionTypes.Date => ValidateDate(values),
            FormQuestionTypes.Time => ValidateTime(values),
            _ => "Unsupported question type."
        };
    }

    private static string? ValidateSingleValue(IReadOnlyList<string> values) =>
        values.Count == 1 ? null : "Text answers must contain exactly one value.";

    private static string? ValidateSingleOption(FormQuestion question, IReadOnlyList<string> values)
    {
        if (values.Count != 1)
        {
            return "Choice-style answers must contain exactly one value.";
        }

        var options = ReadOptions(question);
        if (options.Count == 0 || !options.Contains(values[0], StringComparer.Ordinal))
        {
            return "Choice-style answers must match stored options exactly.";
        }

        return null;
    }

    private static string? ValidateCheckboxOptions(FormQuestion question, IReadOnlyList<string> values)
    {
        var options = ReadOptions(question);
        if (options.Count == 0)
        {
            return "Checkbox answers require stored options.";
        }

        if (values.Count != values.Distinct(StringComparer.Ordinal).Count())
        {
            return "Checkbox answers must not contain duplicate values.";
        }

        if (values.Any(value => !options.Contains(value, StringComparer.Ordinal)))
        {
            return "Checkbox answers must contain only stored options.";
        }

        return null;
    }

    private static string? ValidateDate(IReadOnlyList<string> values)
    {
        if (values.Count != 1)
        {
            return "Date answers must contain exactly one value.";
        }

        return DateOnly.TryParseExact(values[0], "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
            ? null
            : "Date answers must use yyyy-MM-dd format.";
    }

    private static string? ValidateTime(IReadOnlyList<string> values)
    {
        if (values.Count != 1)
        {
            return "Time answers must contain exactly one value.";
        }

        return TimeOnly.TryParseExact(values[0], "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
            ? null
            : "Time answers must use HH:mm format.";
    }

    private static IReadOnlyList<string> ReadOptions(FormQuestion question)
    {
        if (string.IsNullOrWhiteSpace(question.OptionsJson))
        {
            return Array.Empty<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<string>>(question.OptionsJson) ?? Array.Empty<string>();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }
}
