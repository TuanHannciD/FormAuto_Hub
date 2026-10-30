using FormAutoHub.DbCompatibility;

namespace FormAutoHub.Tests;

public sealed class BaselineModelGuardTests
{
    [Theory]
    [InlineData(400, false, "nvarchar", true)]
    [InlineData(-1, false, "nvarchar", false)]
    [InlineData(200, false, "nvarchar", false)]
    [InlineData(400, true, "nvarchar", false)]
    [InlineData(200, false, "varchar", false)]
    public void BaselineFilename_UsesByteLengthAndRequiredUnicodeShape(int bytes, bool nullable, string type, bool valid)
    {
        using var context = TopupEvidenceSchemaMigrationTests.Context();
        var signature = System.Text.Json.JsonSerializer.Serialize(new { type, typeSchema = "sys", maxLength = bytes, nullable });
        var result = BaselineModelGuard.Compare(context,
            [new("column:dbo.TopupOrderEvidenceFiles.OriginalFileName", signature)]);
        Assert.Equal(!valid, result.Contains("Wrong model storage column:dbo.TopupOrderEvidenceFiles.OriginalFileName"));
        Assert.Contains("Missing column:dbo.TopupOrderEvidenceFiles.ContentType", result);
    }

    [Fact]
    public void ExtraBaselineTableAndColumn_AreRejected()
    {
        using var context = TopupEvidenceSchemaMigrationTests.Context();
        var result = BaselineModelGuard.Compare(context,
            [new("table:dbo.Unknown", "{}"), new("column:dbo.TopupOrderEvidenceFiles.Unknown", "{}")]);
        Assert.Contains("Extra baseline table:dbo.Unknown", result);
        Assert.Contains("Extra baseline column:dbo.TopupOrderEvidenceFiles.Unknown", result);
    }
}
