using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using FormAutoHub.Api.Domain;

namespace FormAutoHub.Api.Integrations.GoogleForms;

public interface IGoogleFormsClient
{
    Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken);
    Task<GoogleFormSubmitResult> SubmitAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken cancellationToken);
}

public sealed partial class GoogleFormsClient(HttpClient httpClient) : IGoogleFormsClient
{
    public async Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(formUrl, UriKind.Absolute, out var formUri) ||
            (formUri.Scheme != Uri.UriSchemeHttp && formUri.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException("Invalid form URL.");
        }

        if (!string.Equals(formUri.Host, "docs.google.com", StringComparison.OrdinalIgnoreCase) ||
            !formUri.AbsolutePath.Contains("/forms/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only public Google Forms URLs are supported.");
        }

        var html = await httpClient.GetStringAsync(formUri, cancellationToken);
        if (!html.Contains("entry.", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("No supported Google Form entries were detected.");
        }

        var title = WebUtility.HtmlDecode(TitleRegex().Match(html).Groups["title"].Value).Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            title = "Untitled Google Form";
        }

        var actionMatch = FormActionRegex().Match(html);
        if (!actionMatch.Success)
        {
            throw new InvalidOperationException("Google Form action URL was not detected.");
        }

        var actionUrl = WebUtility.HtmlDecode(actionMatch.Groups["action"].Value);

        if (Uri.TryCreate(formUri, actionUrl, out var resolvedAction))
        {
            actionUrl = resolvedAction.ToString();
        }

        if (!Uri.TryCreate(actionUrl, UriKind.Absolute, out var actionUri) ||
            !string.Equals(actionUri.Host, "docs.google.com", StringComparison.OrdinalIgnoreCase) ||
            !actionUri.AbsolutePath.Contains("/formResponse", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Detected Google Form action URL is not supported.");
        }

        var questions = TryParsePublicLoadData(html);
        if (questions.Count == 0)
        {
            questions = EntryRegex().Matches(html)
                .Select(match => match.Groups["entry"].Value)
                .Distinct()
                .Select((entryId, index) => new GoogleFormQuestion(
                    Label: $"Question {index + 1}",
                    EntryId: entryId,
                    QuestionType: FormQuestionTypes.ShortText,
                    Options: Array.Empty<string>(),
                    Required: false,
                    OrderIndex: index))
                .ToList();
        }

        if (questions.Count == 0)
        {
            throw new InvalidOperationException("No supported Google Form entries were detected.");
        }

        return new GoogleFormAnalysis(title, actionUrl, questions);
    }

    public async Task<GoogleFormSubmitResult> SubmitAsync(
        string actionUrl,
        IReadOnlyDictionary<string, IReadOnlyList<string>> answers,
        CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(actionUrl, UriKind.Absolute, out var actionUri))
        {
            return new GoogleFormSubmitResult(false, "Invalid form action URL.");
        }

        var pairs = answers.SelectMany(answer =>
            answer.Value.Select(value => new KeyValuePair<string, string>(answer.Key, value)));

        using var content = new FormUrlEncodedContent(pairs);
        using var response = await httpClient.PostAsync(actionUri, content, cancellationToken);

        return response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Found
            ? new GoogleFormSubmitResult(true, string.Empty)
            : new GoogleFormSubmitResult(false, $"Google Form returned HTTP {(int)response.StatusCode}.");
    }

    [GeneratedRegex("<title>(?<title>.*?)</title>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex TitleRegex();

    [GeneratedRegex("<form[^>]+action=[\"'](?<action>[^\"']+)[\"']", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex FormActionRegex();

    [GeneratedRegex("name=[\"'](?<entry>entry\\.\\d+)(?:_[A-Za-z0-9]+)?[\"']", RegexOptions.IgnoreCase)]
    private static partial Regex EntryRegex();

    private static IReadOnlyList<GoogleFormQuestion> TryParsePublicLoadData(string html)
    {
        var match = PublicLoadDataRegex().Match(html);
        if (!match.Success)
        {
            return [];
        }

        try
        {
            using var document = JsonDocument.Parse(match.Groups["data"].Value);
            var root = document.RootElement;
            if (!TryGetArrayItem(root, 1, out var formData) ||
                !TryGetArrayItem(formData, 1, out var questionList) ||
                questionList.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            var questions = new List<GoogleFormQuestion>();
            var orderIndex = 0;
            var sourceIndex = 0;
            foreach (var questionData in questionList.EnumerateArray())
            {
                sourceIndex++;
                if (questionData.ValueKind != JsonValueKind.Array ||
                    !TryGetArrayItem(questionData, 3, out var typeElement) ||
                    !typeElement.TryGetInt32(out var typeCode) ||
                    !TryGetArrayItem(questionData, 4, out var entryList) ||
                    entryList.ValueKind != JsonValueKind.Array ||
                    entryList.GetArrayLength() == 0)
                {
                    continue;
                }

                var baseLabel = TryGetArrayItem(questionData, 1, out var labelElement) &&
                    TryGetString(labelElement, out var detectedLabel)
                        ? detectedLabel
                        : $"Question {sourceIndex}";

                foreach (var entryData in entryList.EnumerateArray())
                {
                    if (entryData.ValueKind != JsonValueKind.Array ||
                        !TryGetArrayItem(entryData, 0, out var entryIdElement) ||
                        !entryIdElement.TryGetInt64(out var entryId))
                    {
                        continue;
                    }

                    var questionType = MapQuestionType(typeCode, entryData);
                    if (!IsSupportedQuestionType(questionType))
                    {
                        continue;
                    }

                    var rowLabel = ReadRowLabel(entryData);
                    var label = string.IsNullOrWhiteSpace(rowLabel) ? baseLabel : $"{baseLabel} - {rowLabel}";
                    var options = ReadOptions(entryData);

                    questions.Add(new GoogleFormQuestion(
                        Label: label,
                        EntryId: $"entry.{entryId}",
                        QuestionType: questionType,
                        Options: options,
                        Required: false,
                        OrderIndex: orderIndex++));
                }
            }

            return questions;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string MapQuestionType(int typeCode, JsonElement entryData) =>
        typeCode switch
        {
            0 => FormQuestionTypes.ShortText,
            1 => FormQuestionTypes.ParagraphText,
            2 => FormQuestionTypes.MultipleChoice,
            3 => FormQuestionTypes.Dropdown,
            4 => FormQuestionTypes.Checkbox,
            5 => FormQuestionTypes.LinearScale,
            7 => IsCheckboxGridEntry(entryData) ? FormQuestionTypes.CheckboxGrid : FormQuestionTypes.MultipleChoiceGrid,
            9 => FormQuestionTypes.Date,
            10 => FormQuestionTypes.Time,
            18 => FormQuestionTypes.Rating,
            _ => string.Empty
        };

    private static bool IsSupportedQuestionType(string questionType) =>
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

    private static IReadOnlyList<string> ReadOptions(JsonElement entryData)
    {
        if (!TryGetArrayItem(entryData, 1, out var optionsElement) ||
            optionsElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return optionsElement
            .EnumerateArray()
            .Where(option => option.ValueKind == JsonValueKind.Array)
            .Select(option => TryGetArrayItem(option, 0, out var optionLabel) && TryGetString(optionLabel, out var value) ? value : string.Empty)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct()
            .ToList();
    }

    private static string ReadRowLabel(JsonElement entryData)
    {
        if (TryGetArrayItem(entryData, 3, out var rowElement) &&
            rowElement.ValueKind == JsonValueKind.Array &&
            rowElement.GetArrayLength() > 0 &&
            TryGetString(rowElement[0], out var rowLabel))
        {
            return rowLabel;
        }

        return string.Empty;
    }

    private static bool IsCheckboxGridEntry(JsonElement entryData)
    {
        if (!TryGetArrayItem(entryData, 11, out var gridMode) ||
            gridMode.ValueKind != JsonValueKind.Array ||
            gridMode.GetArrayLength() == 0 ||
            !gridMode[0].TryGetInt32(out var mode))
        {
            return false;
        }

        return mode == 1;
    }

    private static bool TryGetArrayItem(JsonElement element, int index, out JsonElement item)
    {
        item = default;
        if (element.ValueKind != JsonValueKind.Array || element.GetArrayLength() <= index)
        {
            return false;
        }

        item = element[index];
        return true;
    }

    private static bool TryGetString(JsonElement element, out string value)
    {
        value = string.Empty;
        if (element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = WebUtility.HtmlDecode(element.GetString() ?? string.Empty).Trim();
        return !string.IsNullOrWhiteSpace(value);
    }

    [GeneratedRegex("FB_PUBLIC_LOAD_DATA_\\s*=\\s*(?<data>\\[.*?\\]);\\s*</script>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex PublicLoadDataRegex();
}
