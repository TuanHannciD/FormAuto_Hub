using System.Net;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Integrations.GoogleForms;

namespace FormAutoHub.Tests;

public sealed class GoogleFormsReceiptTests
{
    // Reduced structural fixture derived from authorized 2026-11-07 live receipt.
    // Full response SHA256 b2b12834858fa8cf613c32d24df0131ed641651099f1a09497d38bef9f176843.
    public static string Receipt(string identity = "e/synthetic")
    {
        object?[] root = [null, Array.Empty<object>(), "/forms", "Synthetic", null, null, null, "", null, 0, 0, null, "", 0, identity, 0, "[]", 0, 0, 1];
        return "<html><head></head><body jscontroller=\"lN6Aje\"><div class=\"Uc2NEf\"><div class=\"RH5hzf RLS9Fe\"><div class=\"idZHHb\"><div class=\"pdLVYe LgNcQe\" role=\"heading\" aria-level=\"1\">Synthetic</div><div class=\"vHW8K\">Recorded</div><div class=\"c2gzEf\"><a href=\"https://docs.google.com/forms/d/" + identity + "/viewform?usp=form_confirm\">Another response</a></div></div></div></div><script>var FB_PUBLIC_LOAD_DATA_ = " + JsonSerializer.Serialize(root) + ";</script></body></html>";
    }
    [Fact]
    public void RealDerivedCompleteSameFormStructureConfirmsSuccess() => Assert.True(GoogleFormsReceiptClassifier.IsConfirmation(GoogleFormsSubmissionParserTests.Action, 200, Receipt()));
    [Theory]
    [InlineData("other")]
    [InlineData("comment")]
    [InlineData("script")]
    [InlineData("incomplete")]
    [InlineData("form")]
    [InlineData("template")]
    [InlineData("textarea")]
    [InlineData("noscript")]
    public void IncompleteForeignOrNonRenderedMarkersNeverConfirm(string mutation)
    {
        var html = mutation switch { "other" => Receipt("e/other"), "comment" => "<!--" + Receipt() + "-->",
            "template" or "textarea" or "noscript" => Receipt().Replace("<div class=\"Uc2NEf\">", "<" + mutation + "><div class=\"Uc2NEf\">").Replace("</body>", "</" + mutation + "></body>"),
            "script" => "<html><body><script>" + Receipt() + "</script></body></html>", "form" => Receipt().Replace("</body>", "<form></form></body>"), _ => Receipt().Replace("</html>", "") };
        Assert.False(GoogleFormsReceiptClassifier.IsConfirmation(GoogleFormsSubmissionParserTests.Action, 200, html));
    }
    [Fact]
    public void StatusOrLocalizedTextAloneNeverConfirms()
    {
        Assert.False(GoogleFormsReceiptClassifier.IsConfirmation(GoogleFormsSubmissionParserTests.Action, 400, Receipt()));
        Assert.False(GoogleFormsReceiptClassifier.IsConfirmation(GoogleFormsSubmissionParserTests.Action, 200, "<html><body>Your response has been recorded</body></html>"));
    }
}
