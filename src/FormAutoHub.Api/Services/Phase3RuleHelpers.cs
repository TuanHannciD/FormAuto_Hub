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
        if (root.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException("Cấu hình quy tắc phải là một đối tượng JSON.");
        }

        var values = rule.Mode switch
        {
            AnswerRuleModes.RandomEqually => PickEqually(root, question, responseIndex),
            AnswerRuleModes.RandomByPercentage => PickWeighted(root, question, responseIndex),
            AnswerRuleModes.RandomByQuantity => PickByQuantity(root, question, responseIndex),
            AnswerRuleModes.SampleTextLines => PickSample(root, responseIndex),
            AnswerRuleModes.DateRangeSequential => PickDateRange(root, question, responseIndex),
            AnswerRuleModes.TimeRangeSequential => PickTimeRange(root, question, responseIndex),
            _ => throw new InvalidOperationException("Chế độ tạo câu trả lời chưa được hỗ trợ.")
        };

        if (values.Count == 0 || values.Count > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            throw new InvalidOperationException("Số giá trị trả lời vượt giới hạn cho phép.");
        }

        if (values.Any(value => value.Length > Phase4SafetyLimits.MaxGeneratedAnswerValueLength))
        {
            throw new InvalidOperationException("Nội dung trả lời vượt độ dài cho phép.");
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
            throw new InvalidOperationException("Hãy nhập giá trị trả lời hoặc chọn câu hỏi có sẵn lựa chọn.");
        }

        EnsureValuesMatchOptions(values, question);
        return PickChoiceValues(root, question, values, responseIndex);
    }

    private static IReadOnlyList<string> PickWeighted(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (!root.TryGetProperty("weights", out var weights) || weights.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException("Hãy nhập tỷ lệ cho các lựa chọn bằng một đối tượng JSON.");
        }

        var entries = new List<(string Value, int Weight)>();
        var totalWeight = 0;
        foreach (var property in weights.EnumerateObject())
        {
            if (property.Value.ValueKind != JsonValueKind.Number || !property.Value.TryGetInt32(out var weight))
            {
                throw new InvalidOperationException("Tỷ lệ của mỗi lựa chọn phải là số nguyên.");
            }

            if (weight < 0)
            {
                throw new InvalidOperationException("Tỷ lệ của lựa chọn không được âm.");
            }

            if (weight > 0)
            {
                entries.Add((property.Name, weight));
                totalWeight += weight;
            }
        }

        if (totalWeight == 0)
        {
            throw new InvalidOperationException("Cần ít nhất một lựa chọn có tỷ lệ lớn hơn 0.");
        }

        if (totalWeight > PercentageTotal)
        {
            throw new InvalidOperationException("Tổng tỷ lệ của các lựa chọn không được vượt quá 100.");
        }

        var expanded = ExpandWeightedValues(entries, PercentageTotal);
        EnsureValuesMatchOptions(entries.Select(entry => entry.Value).Distinct().ToList(), question);
        return PickChoiceValues(root, question, expanded, responseIndex);
    }

    private static IReadOnlyList<string> PickByQuantity(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (!root.TryGetProperty("quantities", out var quantities) || quantities.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException("Hãy nhập số lượng cho các lựa chọn bằng một đối tượng JSON.");
        }

        var expanded = new List<string>();
        foreach (var property in quantities.EnumerateObject())
        {
            if (property.Value.ValueKind != JsonValueKind.Number || !property.Value.TryGetInt32(out var quantity))
            {
                throw new InvalidOperationException("Số lượng của mỗi lựa chọn phải là số nguyên.");
            }

            if (quantity < 0)
            {
                throw new InvalidOperationException("Số lượng của lựa chọn không được âm.");
            }

            AddRepeatedValue(expanded, property.Name, quantity);
        }

        if (expanded.Count == 0)
        {
            throw new InvalidOperationException("Cần ít nhất một lựa chọn có số lượng lớn hơn 0.");
        }

        EnsureValuesMatchOptions(expanded.Distinct().ToList(), question);
        return PickChoiceValues(root, question, expanded, responseIndex);
    }

    private static IReadOnlyList<string> PickSample(JsonElement root, int responseIndex)
    {
        var samples = ReadStringArray(root, "samples");
        if (samples.Count == 0)
        {
            throw new InvalidOperationException("Hãy nhập ít nhất một dòng câu trả lời mẫu.");
        }

        if (samples.Count > Phase4SafetyLimits.MaxSampleTextLines)
        {
            throw new InvalidOperationException("Số dòng câu trả lời mẫu vượt giới hạn cho phép.");
        }

        return new[] { samples[responseIndex % samples.Count] };
    }

    private static IReadOnlyList<string> PickDateRange(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (question.QuestionType != FormQuestionTypes.Date)
        {
            throw new InvalidOperationException("Chế độ khoảng ngày chỉ áp dụng cho câu hỏi ngày.");
        }

        var fromDate = ReadRequiredDate(root, "fromDate");
        var toDate = ReadRequiredDate(root, "toDate");
        if (fromDate > toDate)
        {
            throw new InvalidOperationException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
        }

        var days = toDate.DayNumber - fromDate.DayNumber + 1;
        if (days <= 0)
        {
            throw new InvalidOperationException("Khoảng ngày cần có ít nhất một ngày.");
        }

        return new[] { fromDate.AddDays(responseIndex % days).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) };
    }

    private static IReadOnlyList<string> PickTimeRange(JsonElement root, FormQuestion question, int responseIndex)
    {
        if (question.QuestionType != FormQuestionTypes.Time)
        {
            throw new InvalidOperationException("Chế độ khoảng giờ chỉ áp dụng cho câu hỏi giờ.");
        }

        var fromTime = ReadRequiredTime(root, "fromTime");
        var toTime = ReadRequiredTime(root, "toTime");
        if (fromTime > toTime)
        {
            throw new InvalidOperationException("Giờ bắt đầu phải trước hoặc bằng giờ kết thúc.");
        }

        if (!root.TryGetProperty("stepMinutes", out var stepElement) ||
            stepElement.ValueKind != JsonValueKind.Number ||
            !stepElement.TryGetInt32(out var stepMinutes) ||
            stepMinutes is < 5 or > 120)
        {
            throw new InvalidOperationException("Bước thời gian phải từ 5 đến 120 phút.");
        }

        var totalMinutes = (int)(toTime - fromTime).TotalMinutes;
        var slotCount = (totalMinutes / stepMinutes) + 1;
        if (slotCount <= 0)
        {
            throw new InvalidOperationException("Khoảng giờ cần có ít nhất một mốc giờ.");
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
            throw new InvalidOperationException("Ngày bắt đầu và kết thúc phải đúng định dạng yyyy-MM-dd.");
        }

        return date;
    }

    private static TimeOnly ReadRequiredTime(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var element) ||
            element.ValueKind != JsonValueKind.String ||
            !TimeOnly.TryParseExact(element.GetString(), "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
        {
            throw new InvalidOperationException("Giờ bắt đầu và kết thúc phải đúng định dạng HH:mm.");
        }

        return time;
    }

    private static void AddRepeatedValue(List<string> values, string value, int count)
    {
        if (values.Count + count > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            throw new InvalidOperationException("Số giá trị trả lời đã cấu hình vượt giới hạn cho phép.");
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
            throw new InvalidOperationException("Cần ít nhất một lựa chọn có tỷ lệ lớn hơn 0.");
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
            throw new InvalidOperationException("Câu hỏi chọn nhiều cần ít nhất một lựa chọn.");
        }

        var minSelections = ReadOptionalSelectionCount(root, "minSelections", 1);
        var maxSelections = ReadOptionalSelectionCount(root, "maxSelections", 1);
        if (minSelections < 1)
        {
            throw new InvalidOperationException("Số lựa chọn tối thiểu phải từ 1 trở lên.");
        }

        if (maxSelections < minSelections)
        {
            throw new InvalidOperationException("Số lựa chọn tối đa phải lớn hơn hoặc bằng số lựa chọn tối thiểu.");
        }

        if (maxSelections > distinctValues.Count)
        {
            throw new InvalidOperationException("Số lựa chọn tối đa không được vượt số lựa chọn đã cấu hình.");
        }

        if (maxSelections > Phase4SafetyLimits.MaxGeneratedAnswerValues)
        {
            throw new InvalidOperationException("Số lựa chọn tối đa vượt giới hạn giá trị trả lời.");
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

        if (element.ValueKind != JsonValueKind.Number || !element.TryGetInt32(out var value))
        {
            throw new InvalidOperationException("Số lựa chọn tối thiểu và tối đa phải là số nguyên.");
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
            throw new InvalidOperationException("Giá trị trả lời phải khớp với các lựa chọn của câu hỏi.");
        }
    }
}
