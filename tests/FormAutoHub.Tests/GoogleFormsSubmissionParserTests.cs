using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Integrations.GoogleForms;

namespace FormAutoHub.Tests;

public sealed class GoogleFormsSubmissionParserTests
{
    public const string Form = "https://docs.google.com/forms/d/e/synthetic/viewform";
    public const string Action = "https://docs.google.com/forms/d/e/synthetic/formResponse";
    public static string Document(int required = 1, int type = 0, string identity = "e/synthetic", string token = "one")
    {
        object?[] entry = [1, null, required];
        object?[] question = [123, "Synthetic", null, type, new object[] { entry }];
        object?[] form = [null, new object[] { question }];
        object?[] root = [null, form, "/forms", "Synthetic", null, null, null, "", null, 0, 0, null, "", 0, identity, 0, "[]", 0, 0, 1];
        return "<html><head></head><body><form id=\"mG61Hd\" action=\"" + Action + "\"><input type=\"hidden\" name=\"fbzx\" value=\"" + token + "\"></form><script>var FB_PUBLIC_LOAD_DATA_ = " + JsonSerializer.Serialize(root) + ";</script></body></html>";
    }
    [Fact]
    public void CompleteMetadataSupportsRequiredTextAndSemanticHashIgnoresSessionToken()
    {
        var a = GoogleFormsSubmissionParser.Parse(Form, Document());
        var b = GoogleFormsSubmissionParser.Parse(Form, Document(token: "two"));
        Assert.NotNull(a); Assert.NotNull(b); Assert.True(a.Questions.Single().Required);
        Assert.Equal(a.SemanticJson, b.SemanticJson);
        Assert.True(a.Accepts(new Dictionary<string, IReadOnlyList<string>> { ["entry.1"] = ["test"] }));
        Assert.False(a.Accepts(new Dictionary<string, IReadOnlyList<string>>()));
        Assert.False(a.Accepts(new Dictionary<string, IReadOnlyList<string>> { ["entry.2"] = ["test"] }));
    }
    [Theory]
    [InlineData(1, 13, "e/synthetic")]
    [InlineData(2, 0, "e/synthetic")]
    [InlineData(1, 0, "e/other")]
    public void UnsupportedOrForeignMetadataIsBlocked(int required, int type, string identity) =>
        Assert.Null(GoogleFormsSubmissionParser.Parse(Form, Document(required, type, identity)));
    [Fact]
    public void MissingOrDuplicatedInventoryAndScriptOnlyFormAreBlocked()
    {
        Assert.Null(GoogleFormsSubmissionParser.Parse(Form, "<html><body>entry.1</body></html>"));
        Assert.Null(GoogleFormsSubmissionParser.Parse(Form, Document().Replace("<form", "<!--<form").Replace("</form>", "</form>-->")));
        Assert.Null(GoogleFormsSubmissionParser.Parse(Form, Document().Replace("</body>", "<script>var FB_PUBLIC_LOAD_DATA_ = [];</script></body>")));
    }
    [Theory]
    [InlineData("settings")]
    [InlineData("question")]
    [InlineData("root16")]
    public void UnknownMetadataExtensionsAreNotCompleteEvidence(string mutation)
    {
        var html = Document();
        using var original = System.Text.Json.JsonDocument.Parse(System.Text.RegularExpressions.Regex.Match(html, @"FB_PUBLIC_LOAD_DATA_ = (.*?);</script>").Groups[1].Value);
        var root = System.Text.Json.Nodes.JsonNode.Parse(original.RootElement.GetRawText())!.AsArray();
        if (mutation == "root16") root[16] = "unknown";
        else if (mutation == "settings") { while (root[1]!.AsArray().Count <= 10) root[1]!.AsArray().Add(null); root[1]![10] = System.Text.Json.Nodes.JsonNode.Parse("[1,1,1,1,1,1,1,1,1,1,1,1,1]"); }
        else { var q = root[1]![1]![0]!.AsArray(); while(q.Count <= 11) q.Add(null); q[11] = System.Text.Json.Nodes.JsonNode.Parse("[1,2,3]"); }
        html = html.Replace(original.RootElement.GetRawText(), root.ToJsonString());
        Assert.Null(GoogleFormsSubmissionParser.Parse(Form, html));
    }

}
