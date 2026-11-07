using AngleSharp.Html.Parser;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using FormAutoHub.Api.Domain;

namespace FormAutoHub.Api.Integrations.GoogleForms;

// Deliberately narrower than import: no fallback, skipped questions or inferred required flags.
public static class GoogleFormsSubmissionParser
{
    private static MatchCollection Matches(string html, string pattern) => Regex.Matches(html, pattern,
        RegexOptions.Singleline | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, TimeSpan.FromSeconds(2));
    internal static string VisibleMarkup(string html) => Regex.Replace(html,
        @"<!--.*?-->|<script\b[^>]*>.*?</script\s*>|<style\b[^>]*>.*?</style\s*>", "",
        RegexOptions.Singleline | RegexOptions.IgnoreCase, TimeSpan.FromSeconds(2));
    internal static JsonDocument? LoadData(string html)
    {
        html = Regex.Replace(html, @"<!--.*?-->", "", RegexOptions.Singleline, TimeSpan.FromSeconds(2));
        var matches = Matches(html, @"<script\b[^>]*>\s*var\s+FB_PUBLIC_LOAD_DATA_\s*=\s*(?<data>\[.*?\]);\s*</script\s*>");
        if (matches.Count != 1) return null;
        try { return JsonDocument.Parse(matches[0].Groups["data"].Value); } catch (JsonException) { return null; }
    }
    internal static bool Identity(JsonElement root, string form) => root.ValueKind == JsonValueKind.Array && root.GetArrayLength() == 20 &&
        root[14].ValueKind == JsonValueKind.String && form == $"https://docs.google.com/forms/d/{root[14].GetString()}/viewform";
    private static bool Null(JsonElement value) => value.ValueKind == JsonValueKind.Null;
    private static bool Number(JsonElement value, int number) => value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var n) && n == number;

    private static bool RichLabel(JsonElement value) => Null(value) || value.ValueKind == JsonValueKind.Array && value.GetArrayLength() == 2 &&
        Null(value[0]) && value[1].ValueKind == JsonValueKind.String;
    private static bool KnownSettings(JsonElement form)
    {
        if (form.GetArrayLength() > 26) return false;
        for (var i = 2; i < form.GetArrayLength(); i++)
        {
            var value = form[i];
            if (Null(value)) continue;
            if (i == 8 && value.ValueKind == JsonValueKind.String || i == 9 && Number(value, 76) ||
                i == 10 && value.GetRawText() == "[null,null,null,2,null,null,1]" ||
                i == 15 && value.GetRawText() == "[2]" || i is 24 or 25 && RichLabel(value)) continue;
            return false; // Restrictive settings and unknown schema changes need an explicitly supported parser.
        }
        return true;
    }

    public static GoogleFormsSubmissionMetadata? Parse(string formUrl, string html)
    {
        if (html.Length > 1024 * 1024 || !GoogleFormIdentity.TryNormalize(formUrl, "viewform", out var form)) return null;
        try
        {
            using var htmlDocument = new HtmlParser(new HtmlParserOptions { IsScripting = true }).ParseDocument(html);
            if (htmlDocument.QuerySelector("iframe") is not null) return null;
            var forms = htmlDocument.QuerySelectorAll("form");
            var action = form.Replace("/viewform", "/formResponse", StringComparison.Ordinal);
            if (forms.Length != 1 || forms[0].Id != "mG61Hd" || forms[0].GetAttribute("action") != action) return null;
            var scripts = htmlDocument.QuerySelectorAll("script").Where(e => e.TextContent.TrimStart().StartsWith("var FB_PUBLIC_LOAD_DATA_", StringComparison.Ordinal)).ToArray();
            if (scripts.Length != 1) return null;
            using var data = LoadData(scripts[0].OuterHtml);
            if (data is null || !Identity(data.RootElement, form)) return null;
            var root = data.RootElement;
            if (!Number(root[9], 0) || !Number(root[10], 0) || !Number(root[13], 0) || !Number(root[15], 0) || !Number(root[17], 0) || !Number(root[18], 0) || !Number(root[19], 1) ||
                new[] { 0, 4, 5, 6, 8, 11 }.Any(i => !Null(root[i])) || root[2].GetString() != "/forms" ||
                root[7].GetString() != "" || root[12].GetString() != "" || root[16].GetString() != "[]") return null;
            var f = root[1];
            if (f.ValueKind != JsonValueKind.Array || f.GetArrayLength() < 2 || f[1].ValueKind != JsonValueKind.Array) return null;
            if (!KnownSettings(f)) return null;
            var questions = new List<GoogleFormQuestion>();
            var pages = 1;
            foreach (var q in f[1].EnumerateArray())
            {
                if (q.ValueKind != JsonValueKind.Array || q.GetArrayLength() < 5 || q.GetArrayLength() > 12 || !q[3].TryGetInt32(out var type) ||
                    q.GetArrayLength() > 11 && !RichLabel(q[11])) return null;
                if (type == 8) // Ordinary sequential section; explicit navigation targets are unsupported.
                {
                    if (!Null(q[4]) || q.EnumerateArray().Skip(5).Take(6).Any(x => !Null(x))) return null;
                    pages++; continue;
                }
                if (type is not (0 or 1 or 2 or 3 or 4) || q[4].ValueKind != JsonValueKind.Array || q[4].GetArrayLength() != 1 ||
                    q.EnumerateArray().Skip(5).Take(6).Any(x => !Null(x))) return null;
                var e = q[4][0];
                if (e.ValueKind != JsonValueKind.Array || e.GetArrayLength() < 3 || !e[0].TryGetInt64(out var id) || id <= 0 ||
                    !(Number(e[2], 0) || Number(e[2], 1))) return null;
                // Reject constraints, grid, date/time and any unknown extension of this schema.
                if (e.GetArrayLength() > 9 || e.EnumerateArray().Skip(3).Take(5).Any(x => !Null(x)) ||
                    e.GetArrayLength() == 9 && !Number(e[8], 0)) return null;
                var options = new List<string>();
                if (type is 0 or 1) { if (!Null(e[1]) || e.GetArrayLength() != 3) return null; }
                else
                {
                    if (e[1].ValueKind != JsonValueKind.Array || e[1].GetArrayLength() == 0) return null;
                    foreach (var o in e[1].EnumerateArray())
                    {
                        if (o.ValueKind != JsonValueKind.Array || o.GetArrayLength() < 1 || o.GetArrayLength() > 5 || o[0].ValueKind != JsonValueKind.String ||
                            o.EnumerateArray().Skip(1).Take(3).Any(x => !Null(x))) return null;
                        if (o.GetArrayLength() == 5 && Number(o[4], 1)) continue; // Recognize Other; never synthesize its free text field.
                        if (o.GetArrayLength() == 5 && !Number(o[4], 0)) return null;
                        var label = o[0].GetString()!;
                        if (string.IsNullOrWhiteSpace(label) || options.Contains(label, StringComparer.Ordinal)) return null;
                        options.Add(label);
                    }
                    if (options.Count == 0) return null;
                }
                var kind = type switch { 0 => FormQuestionTypes.ShortText, 1 => FormQuestionTypes.ParagraphText,
                    2 => FormQuestionTypes.MultipleChoice, 3 => FormQuestionTypes.Dropdown, _ => FormQuestionTypes.Checkbox };
                questions.Add(new(q[1].ValueKind == JsonValueKind.String ? q[1].GetString()! : "", $"entry.{id}", kind, options, Number(e[2], 1), questions.Count));
            }
            if (questions.Count == 0 || questions.Select(q => q.EntryId).Distinct().Count() != questions.Count) return null;
            var token = forms[0].QuerySelector("input[name=fbzx]")?.GetAttribute("value") ?? "";
            return new(form, action, questions, pages) { SessionToken = token };
        }
        catch (Exception e) when (e is JsonException or InvalidOperationException or IndexOutOfRangeException or RegexMatchTimeoutException) { return null; }
    }
}

public sealed record GoogleFormsSubmissionMetadata(string FormUrl, string ActionUrl, IReadOnlyList<GoogleFormQuestion> Questions, int Pages)
{
    public string SessionToken { get; init; } = "";
    public string SemanticJson => JsonSerializer.Serialize(new { Version = "google-public-supported-v1", FormUrl, ActionUrl, Pages,
        Questions = Questions.Select(q => new { q.EntryId, q.QuestionType, q.Required, q.Options }).ToArray() });
    public bool Accepts(IReadOnlyDictionary<string, IReadOnlyList<string>> answers) =>
        answers.Keys.All(key => Questions.Any(q => q.EntryId == key)) && Questions.All(q =>
        {
            answers.TryGetValue(q.EntryId, out var values);
            if (values is null || values.Count == 0) return !q.Required;
            if (values.Any(v => v is null) || values.Distinct(StringComparer.Ordinal).Count() != values.Count) return false;
            if (q.QuestionType != FormQuestionTypes.Checkbox && values.Count != 1) return false;
            return q.Options.Count > 0 ? values.All(v => q.Options.Contains(v, StringComparer.Ordinal)) : !q.Required || values.Any(v => !string.IsNullOrWhiteSpace(v));
        });
}
