using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Contracts;
using System.Security.Cryptography;
using System.Text;

namespace FormAutoHub.Api.Integrations.GoogleForms;

public interface IGoogleFormsClient
{
    Task<GoogleFormsSubmissionMetadata?> GetSubmissionMetadataAsync(string formUrl, CancellationToken ct) => Task.FromResult<GoogleFormsSubmissionMetadata?>(null);
    Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken);
    Task<GoogleFormSubmitResult> SubmitAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken cancellationToken);
    Task<Func<CancellationToken, Task<VerifiedSubmissionOutcome>>?> PrepareSubmissionAsync(string actionUrl,
        IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct, string? expectedSemanticJson = null) =>
        Task.FromResult<Func<CancellationToken, Task<VerifiedSubmissionOutcome>>?>(token => SubmitVerifiedAsync(actionUrl, answers, token));
    async Task<VerifiedSubmissionOutcome> SubmitVerifiedAsync(string actionUrl, IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct)
    {
        // A legacy bool has no receipt provenance, including a true bool.
        _ = await SubmitAsync(actionUrl, answers, ct);
        return GoogleSubmissionEvidence.Unknown("UnverifiedLegacyResult", "legacy-result");
    }
}

public sealed partial class GoogleFormsClient(HttpClient httpClient, IConfiguration? configuration = null) : IGoogleFormsClient
{
    public async Task<GoogleFormAnalysis> AnalyzeAsync(string formUrl, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(formUrl, UriKind.Absolute, out var formUri) ||
            (formUri.Scheme != Uri.UriSchemeHttp && formUri.Scheme != Uri.UriSchemeHttps))
        {
            throw new AnalysisException("Đường dẫn biểu mẫu không hợp lệ. Hãy nhập đường dẫn Google Forms đầy đủ.");
        }

        if (!string.Equals(formUri.Host, "docs.google.com", StringComparison.OrdinalIgnoreCase) ||
            !formUri.AbsolutePath.Contains("/forms/", StringComparison.OrdinalIgnoreCase))
        {
            throw new AnalysisException("Chỉ hỗ trợ đường dẫn biểu mẫu Google Forms công khai.");
        }

        var html = await httpClient.GetStringAsync(formUri, cancellationToken);
        if (!html.Contains("entry.", StringComparison.OrdinalIgnoreCase))
        {
            throw new AnalysisException("Không tìm thấy câu hỏi được hỗ trợ. Hãy kiểm tra biểu mẫu và quyền truy cập công khai.");
        }

        var title = WebUtility.HtmlDecode(TitleRegex().Match(html).Groups["title"].Value).Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            title = "Untitled Google Form";
        }

        var actionMatch = FormActionRegex().Match(html);
        if (!actionMatch.Success)
        {
            throw new AnalysisException("Không tìm thấy địa chỉ gửi câu trả lời của biểu mẫu. Hãy kiểm tra đường dẫn Google Forms.");
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
            throw new AnalysisException("Địa chỉ gửi câu trả lời của biểu mẫu không được hỗ trợ. Hãy kiểm tra đường dẫn Google Forms.");
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
            throw new AnalysisException("Không tìm thấy câu hỏi được hỗ trợ. Hãy kiểm tra biểu mẫu và quyền truy cập công khai.");
        }

        return new GoogleFormAnalysis(title, actionUrl, questions);
    }

    public async Task<GoogleFormSubmitResult> SubmitAsync(
        string actionUrl,
        IReadOnlyDictionary<string, IReadOnlyList<string>> answers,
        CancellationToken cancellationToken)
    {
        var outcome = await SubmitVerifiedAsync(actionUrl, answers, cancellationToken);
        return new(false, outcome.Evidence.Code);
    }

    public async Task<GoogleFormsSubmissionMetadata?> GetSubmissionMetadataAsync(string formUrl, CancellationToken ct)
    {
        if (!GoogleFormIdentity.TryNormalize(formUrl, "viewform", out var form)) return null;
        try
        {
            using var response = await httpClient.GetAsync(form, HttpCompletionOption.ResponseHeadersRead, ct);
            if (response.StatusCode != HttpStatusCode.OK || response.Headers.Location is not null) return null;
            var body = await ReadBoundedAsync(response, ct);
            return body is null ? null : GoogleFormsSubmissionParser.Parse(form, Encoding.UTF8.GetString(body));
        }
        catch (Exception e) when (e is HttpRequestException or IOException or OperationCanceledException) { return null; }
    }

    public async Task<VerifiedSubmissionOutcome> SubmitVerifiedAsync(string actionUrl,
        IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct)
    {
        if (!GoogleFormIdentity.TryNormalize(actionUrl, "formResponse", out _)) return GoogleSubmissionEvidence.Unknown("UnsupportedTarget", "invalid-target");
        var prepared = await PrepareSubmissionAsync(actionUrl, answers, ct);
        return prepared is null ? GoogleSubmissionEvidence.Unknown("FormEvidenceUnavailable", actionUrl) : await prepared(ct);
    }

    public async Task<Func<CancellationToken, Task<VerifiedSubmissionOutcome>>?> PrepareSubmissionAsync(string actionUrl,
        IReadOnlyDictionary<string, IReadOnlyList<string>> answers, CancellationToken ct, string? expectedSemanticJson = null)
    {
        if (!GoogleFormIdentity.TryNormalize(actionUrl, "formResponse", out var action)) return null;
        var metadata = await GetSubmissionMetadataAsync(action.Replace("/formResponse", "/viewform", StringComparison.Ordinal), ct);
        if (metadata is null || !metadata.Accepts(answers) || expectedSemanticJson is not null && metadata.SemanticJson != expectedSemanticJson) return null;
        // Snapshot caller values before granting the runner its single dispatch capability.
        var snapshot = answers.ToDictionary(x => x.Key, x => (IReadOnlyList<string>)x.Value.ToArray());
        return token => SubmitPreparedAsync(action, snapshot, metadata, token);
    }

    private async Task<VerifiedSubmissionOutcome> SubmitPreparedAsync(string action,
        IReadOnlyDictionary<string, IReadOnlyList<string>> answers, GoogleFormsSubmissionMetadata metadata, CancellationToken ct)
    {
        var trace = new StringBuilder();
        try
        {
            var pairs = answers.SelectMany(x => x.Value.Select(value => new KeyValuePair<string, string>(x.Key, value))).ToList();
            pairs.Add(new("fvv", "1"));
            pairs.Add(new("pageHistory", string.Join(",", Enumerable.Range(0, metadata.Pages))));
            if (!string.IsNullOrWhiteSpace(metadata.SessionToken)) pairs.Add(new("fbzx", metadata.SessionToken));
            using var content = new FormUrlEncodedContent(pairs);
            var payloadHash = Convert.ToHexStringLower(SHA256.HashData(await content.ReadAsByteArrayAsync(ct)));
            using var request = new HttpRequestMessage(HttpMethod.Post, action) { Content = content };
            using var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            trace.Append((int)response.StatusCode).Append('|').Append(action);
            if (response.Headers.Location is { } location)
                return GoogleSubmissionEvidence.Unknown("UnverifiedRedirect", trace.Append('|').Append(location).ToString());
            var bytes = await ReadBoundedAsync(response, ct);
            if (bytes is null) return GoogleSubmissionEvidence.Unknown("ResponseTooLarge", trace.ToString());
            var html = Encoding.UTF8.GetString(bytes);
            var confirmed = GoogleFormsReceiptClassifier.IsConfirmation(action, (int)response.StatusCode, html);
            var id = Guid.NewGuid();
            var artifact = JsonSerializer.SerializeToUtf8Bytes(new { EvidenceId = id, ActionUrl = action, PayloadSha256 = payloadHash,
                Status = (int)response.StatusCode, ResponseSha256 = Convert.ToHexStringLower(SHA256.HashData(bytes)),
                Classifier = GoogleFormsReceiptClassifier.Version, ObservedAt = DateTimeOffset.UtcNow, ResponseBase64 = Convert.ToBase64String(bytes) });
            var root = configuration?["GoogleForms:EvidencePath"] ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FormAutoHub", "submission-evidence");
            Directory.CreateDirectory(root);
            if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(root, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            var path = Path.Combine(root, id.ToString("N") + ".json");
            await using (var file = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
                await file.WriteAsync(artifact, CancellationToken.None);
                await file.FlushAsync(CancellationToken.None);
                file.Flush(flushToDisk: true);
            }
            return new(confirmed ? SubmissionOutcomeKind.ConfirmedSuccess : SubmissionOutcomeKind.Unknown,
                new(id, confirmed ? "GoogleConfirmationDocument" : "ReceiptEvidenceUnavailable", GoogleFormsReceiptClassifier.Version,
                    $"internal:google-evidence:{id:N}", Convert.ToHexStringLower(SHA256.HashData(artifact)), DateTimeOffset.UtcNow, null, null));
        }
        catch (Exception e) when (e is HttpRequestException or IOException or OperationCanceledException or UnauthorizedAccessException)
        {
            return GoogleSubmissionEvidence.Unknown("TransportUncertain", trace.Append('|').Append(e.GetType().Name).ToString());
        }
    }

    private static async Task<byte[]?> ReadBoundedAsync(HttpResponseMessage response, CancellationToken ct)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var bytes = new byte[1024 * 1024 + 1]; var read = 0;
        while (read < bytes.Length)
        {
            var next = await stream.ReadAsync(bytes.AsMemory(read), ct);
            if (next == 0) break;
            read += next;
        }
        return read == bytes.Length ? null : bytes[..read];
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

    internal sealed class AnalysisException(string message) : InvalidOperationException(message);
}
