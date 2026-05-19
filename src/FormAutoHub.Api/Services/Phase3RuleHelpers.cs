using System.Text.Json;
using System.Globalization;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;

namespace FormAutoHub.Api.Services;

internal static class Phase3RuleHelpers
{
    private const int PercentageTotal = 100;

    public static bool IsSupportedMode(string mode) =>
        mode is AnswerRuleModes.RandomEqually
            or AnswerRuleModes.RandomByPercentage
            or AnswerRuleModes.RandomByQuantity
            or AnswerRuleModes.SampleTextLines
            or AnswerRuleModes.DateRangeSequential
            or AnswerRuleModes.TimeRangeSequential;

    public static bool IsSupportedQuestionType(string questionType) =>
        questionType is FormQuestionTypes.ShortText
            or FormQuestionTypes.ParagraphText
            or FormQuestionTypes.MultipleChoice
            or FormQuestionTypes.Checkbox
            or FormQuestionTypes.Dropdown
            or FormQuestionTypes.LinearScale
            or FormQuestionTypes.Rating
            or FormQuestionTypes.MultipleChoiceGrid
            or FormQuestionTypes.CheckboxGrid
            or FormQuestionTypes.Date
            or FormQuestionTypes.Time;

    public static IReadOnlyList<string> ReadOptions(FormQuestion question)
    {
        if (string.IsNullOrWhiteSpace(question.OptionsJson))
        {
            return Array.Empty<string>();
        }

        return JsonSerializer.Deserialize<IReadOnlyList<string>>(question.OptionsJson) ?? Array.Empty<string>();
    }

    public static IReadOnlyList<string> GetValues(AnswerRule rule, FormQuestion question, int responseIndex)
    {
        using var document = JsonDocument.Parse(rule.ConfigJson);
        var root = document.RootElement;

        var values = rule.Mode switch
        {
            AnswerRuleModes.RandomEqually => PickEqually(root, question, responseIndex),
            AnswerRuleModes.RandomByPercentage => PickWeighted(root, question, responseIndex),
            AnswerRuleModes.RandomByQuantity => PickByQuantity(root, question, responseIndex),
            AnswerRuleModes.SampleTextLines => PickSample(root, responseIndex),
            AnswerRuleModes.DateRangeSequential => PickDateRange(root, question, responseIndex),
            AnswerRuleModes.TimeRangeSequential => PickTimeRange(root, question, responseIndex),
            _ => throw new InvalidOperationException("Unsupported answer rule mode.")
        };

        if (values.Count == 0 || values.Count > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            throw new InvalidOperationException("Generated answer value count is outside the safe range.");
        }

        if (values.Any(value => value.Length > Phase4SafetyLimits.MaxGeneratedAnswerValueLength))
        {
            throw new InvalidOperationException("Generated answer value is too long.");
        }

        return values;
    }

    public static bool HasValidConfig(AnswerRule rule, FormQuestion question)
    {
        try
        {
            _ = GetValues(rule, question, 0);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    private static IReadOnlyList<string> PickEqually(JsonElement root, FormQuestion question, int responseIndex)
    {
        var values = ReadStringArray(root, "values");
        if (values.Count == 0)
        {
            values = ReadOptions(question);
        }

        if (values.Count == 0)
        {
            throw new InvalidOperationException("RandomEqually requires values or question options.");
        }

        EnsureValuesMatchOptions(values, question);
        return PickChoiceValues(root, question, values, responseIndex);
    }

    private static IReadOnlyList<string> PickWeighted(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (!root.TryGetProperty("weights", out var weights) || weights.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException("RandomByPercentage requires weights.");
        }

        var entries = new List<(string Value, int Weight)>();
        var totalWeight = 0;
        foreach (var property in weights.EnumerateObject())
        {
            if (!property.Value.TryGetInt32(out var weight))
            {
                throw new InvalidOperationException("Weights must be integers.");
            }

            if (weight < 0)
            {
                throw new InvalidOperationException("Weights must not be negative.");
            }

            if (weight > 0)
            {
                entries.Add((property.Name, weight));
                totalWeight += weight;
            }
        }

        if (totalWeight == 0)
        {
            throw new InvalidOperationException("RandomByPercentage requires at least one positive weight.");
        }

        if (totalWeight > PercentageTotal)
        {
            throw new InvalidOperationException("RandomByPercentage total weight must not exceed 100.");
        }

        var expanded = ExpandWeightedValues(entries, PercentageTotal);
        EnsureValuesMatchOptions(entries.Select(entry => entry.Value).Distinct().ToList(), question);
        return PickChoiceValues(root, question, expanded, responseIndex);
    }

    private static IReadOnlyList<string> PickByQuantity(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (!root.TryGetProperty("quantities", out var quantities) || quantities.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException("RandomByQuantity requires quantities.");
        }

        var expanded = new List<string>();
        foreach (var property in quantities.EnumerateObject())
        {
            if (!property.Value.TryGetInt32(out var quantity))
            {
                throw new InvalidOperationException("Quantities must be integers.");
            }

            if (quantity < 0)
            {
                throw new InvalidOperationException("Quantities must not be negative.");
            }

            AddRepeatedValue(expanded, property.Name, quantity);
        }

        if (expanded.Count == 0)
        {
            throw new InvalidOperationException("RandomByQuantity requires at least one positive quantity.");
        }

        EnsureValuesMatchOptions(expanded.Distinct().ToList(), question);
        return PickChoiceValues(root, question, expanded, responseIndex);
    }

    private static IReadOnlyList<string> PickSample(JsonElement root, int responseIndex)
    {
        var samples = ReadStringArray(root, "samples");
        if (samples.Count == 0)
        {
            throw new InvalidOperationException("SampleTextLines requires samples.");
        }

        if (samples.Count > Phase4SafetyLimits.MaxSampleTextLines)
        {
            throw new InvalidOperationException("SampleTextLines exceeds the safe sample limit.");
        }

        return new[] { samples[responseIndex % samples.Count] };
    }

    private static IReadOnlyList<string> PickDateRange(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (question.QuestionType != FormQuestionTypes.Date)
        {
            throw new InvalidOperationException("DateRangeSequential requires a date question.");
        }

        var fromDate = ReadRequiredDate(root, "fromDate");
        var toDate = ReadRequiredDate(root, "toDate");
        if (fromDate > toDate)
        {
            throw new InvalidOperationException("Date range start must be before or equal to the end date.");
        }

        var days = toDate.DayNumber - fromDate.DayNumber + 1;
        if (days <= 0)
        {
            throw new InvalidOperationException("Date range requires at least one date.");
        }

        return new[] { fromDate.AddDays(responseIndex % days).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) };
    }

    private static IReadOnlyList<string> PickTimeRange(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (question.QuestionType != FormQuestionTypes.Time)
        {
            throw new InvalidOperationException("TimeRangeSequential requires a time question.");
        }

        var fromTime = ReadRequiredTime(root, "fromTime");
        var toTime = ReadRequiredTime(root, "toTime");
        if (fromTime > toTime)
        {
            throw new InvalidOperationException("Time range start must be before or equal to the end time.");
        }

        if (!root.TryGetProperty("stepMinutes", out var stepElement) ||
            !stepElement.TryGetInt32(out var stepMinutes) ||
            stepMinutes is < 5 or > 120)
        {
            throw new InvalidOperationException("Time range step must be between 5 and 120 minutes.");
        }

        var totalMinutes = (int)(toTime - fromTime).TotalMinutes;
        var slotCount = (totalMinutes / stepMinutes) + 1;
        if (slotCount <= 0)
        {
            throw new InvalidOperationException("Time range requires at least one time slot.");
        }

        return new[] { fromTime.AddMinutes((responseIndex % slotCount) * stepMinutes).ToString("HH:mm", CultureInfo.InvariantCulture) };
    }

    private static IReadOnlyList<string> ReadStringArray(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var element) || element.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<string>();
        }

        return element.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .ToList();
    }

    private static DateOnly ReadRequiredDate(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var element) ||
            element.ValueKind != JsonValueKind.String ||
            !DateOnly.TryParseExact(element.GetString(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new InvalidOperationException("Date range values must use yyyy-MM-dd format.");
        }

        return date;
    }

    private static TimeOnly ReadRequiredTime(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var element) ||
            element.ValueKind != JsonValueKind.String ||
            !TimeOnly.TryParseExact(element.GetString(), "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
        {
            throw new InvalidOperationException("Time range values must use HH:mm format.");
        }

        return time;
    }

    private static void AddRepeatedValue(List<string> values, string value, int count)
    {
        if (values.Count + count > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            throw new InvalidOperationException("Configured answer value count is outside the safe range.");
        }

        values.AddRange(Enumerable.Repeat(value, count));
    }

    private static IReadOnlyList<string> ExpandWeightedValues(IReadOnlyList<(string Value, int Weight)> entries, int targetTotal)
    {
        var expanded = new List<string>(targetTotal);
        foreach (var entry in entries)
        {
            expanded.AddRange(Enumerable.Repeat(entry.Value, entry.Weight));
        }

        if (expanded.Count == 0)
        {
            throw new InvalidOperationException("RandomByPercentage requires at least one positive weight.");
        }

        return expanded;
    }

    private static IReadOnlyList<string> PickChoiceValues(
        JsonElement root,
        FormQuestion question,
        IReadOnlyList<string> sourceValues,
        int responseIndex)
    {
        if (question.QuestionType != FormQuestionTypes.Checkbox)
        {
            return new[] { sourceValues[responseIndex % sourceValues.Count] };
        }

        var distinctValues = sourceValues.Distinct(StringComparer.Ordinal).ToList();
        if (distinctValues.Count == 0)
        {
            throw new InvalidOperationException("Checkbox requires at least one configured value.");
        }

        var minSelections = ReadOptionalSelectionCount(root, "minSelections", 1);
        var maxSelections = ReadOptionalSelectionCount(root, "maxSelections", 1);
        if (minSelections < 1)
        {
            throw new InvalidOperationException("Checkbox minSelections must be at least 1.");
        }

        if (maxSelections < minSelections)
        {
            throw new InvalidOperationException("Checkbox maxSelections must be greater than or equal to minSelections.");
        }

        if (maxSelections > distinctValues.Count)
        {
            throw new InvalidOperationException("Checkbox maxSelections must not exceed the configured option count.");
        }

        if (maxSelections > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            throw new InvalidOperationException("Checkbox maxSelections exceeds the generated answer value limit.");
        }

        var selectionCount = minSelections == maxSelections
            ? minSelections
            : minSelections + (responseIndex % (maxSelections - minSelections + 1));
        var selected = new List<string>(selectionCount);
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var cursor = responseIndex % sourceValues.Count;
        var attempts = 0;
        while (selected.Count < selectionCount && attempts < sourceValues.Count * 2)
        {
            var candidate = sourceValues[cursor % sourceValues.Count];
            if (seen.Add(candidate))
            {
                selected.Add(candidate);
            }

            cursor += 1;
            attempts += 1;
        }

        return selected;
    }

    private static int ReadOptionalSelectionCount(JsonElement root, string propertyName, int fallback)
    {
        if (!root.TryGetProperty(propertyName, out var element))
        {
            return fallback;
        }

        if (!element.TryGetInt32(out var value))
        {
            throw new InvalidOperationException("Checkbox selection counts must be integers.");
        }

        return value;
    }

    private static void EnsureValuesMatchOptions(IReadOnlyList<string> values, FormQuestion question)
    {
        var options = ReadOptions(question);
        if (options.Count == 0)
        {
            return;
        }

        if (values.Any(value => !options.Contains(value, StringComparer.Ordinal)))
        {
            throw new InvalidOperationException("Configured values must match question options.");
        }
    }
}
