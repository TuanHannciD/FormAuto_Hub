using AngleSharp.Html.Parser;

namespace FormAutoHub.Api.Integrations.GoogleForms;

// Signature pinned to authorized live receipt in FAH-HISTORY-SEND-001. Parse with scripting
// enabled but never execute scripts or load resources; inert/raw-text nodes cannot be proof.
public static class GoogleFormsReceiptClassifier
{
    public const string Version = "google-confirmation-20261107-v1";
    public static bool IsConfirmation(string actionUrl, int status, string html)
    {
        if (status != 200 || html.Length > 1024 * 1024 || !html.TrimEnd().EndsWith("</html>", StringComparison.OrdinalIgnoreCase) ||
            !html.Contains("</body>", StringComparison.OrdinalIgnoreCase) || !GoogleFormIdentity.TryNormalize(actionUrl, "formResponse", out var action)) return false;
        try
        {
            var form = action.Replace("/formResponse", "/viewform", StringComparison.Ordinal);
            using var doc = new HtmlParser(new HtmlParserOptions { IsScripting = true }).ParseDocument(html);
            if (doc.QuerySelector("form,input,iframe,template,textarea,noscript,[hidden],[style]") is not null || doc.Body?.GetAttribute("jscontroller") != "lN6Aje") return false;
            var scripts = doc.QuerySelectorAll("script").Where(e => e.TextContent.TrimStart().StartsWith("var FB_PUBLIC_LOAD_DATA_", StringComparison.Ordinal)).ToArray();
            if (scripts.Length != 1) return false;
            using var data = GoogleFormsSubmissionParser.LoadData(scripts[0].OuterHtml);
            if (data is null || !GoogleFormsSubmissionParser.Identity(data.RootElement, form) ||
                data.RootElement[1].ValueKind != System.Text.Json.JsonValueKind.Array || data.RootElement[1].GetArrayLength() != 0) return false;
            var panels = doc.QuerySelectorAll("body > div.Uc2NEf div.RH5hzf.RLS9Fe > div.idZHHb");
            if (panels.Length != 1) return false;
            var children = panels[0].Children;
            var message = children.SingleOrDefault(e => e.ClassName == "vHW8K");
            var link = panels[0].QuerySelector("div.c2gzEf > a");
            return message is not null && !string.IsNullOrWhiteSpace(message.TextContent) && message.Children.Length == 0 &&
                children.Any(e => e.Matches("div.pdLVYe.LgNcQe[role=heading][aria-level='1']")) &&
                link?.GetAttribute("href") == form + "?usp=form_confirm";
        }
        catch (Exception e) when (e is System.Text.Json.JsonException or InvalidOperationException or System.Text.RegularExpressions.RegexMatchTimeoutException) { return false; }
    }
}
