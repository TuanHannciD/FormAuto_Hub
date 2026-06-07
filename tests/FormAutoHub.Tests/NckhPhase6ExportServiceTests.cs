using System.IO.Compression;
using System.Text;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FormAutoHub.Tests;

public sealed class NckhPhase6ExportServiceTests
{
    [Fact]
    public async Task ExportAsync_Csv_ExportsNormalizedDatasetWithoutRawJson()
    {
        await using var context = CreateContext();
        var seed = await SeedExportModelAsync(context);
        var service = new ResearchExportService(context);

        var result = await service.ExportAsync(TestUserId, seed.ModelId, "csv", CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Equal($"nckh-model-{seed.ModelId}-dataset.csv", result.Value!.FileName);
        Assert.Equal("text/csv; charset=utf-8", result.Value.ContentType);
        var bom = Encoding.UTF8.GetPreamble();
        Assert.True(result.Value.Content.Take(bom.Length).SequenceEqual(bom));

        var csv = Encoding.UTF8.GetString(result.Value.Content.Skip(bom.Length).ToArray());
        Assert.Contains("RespondentId,TH1,TH2,TH_mean", csv);
        Assert.Contains("respondent-1,5,4,4.5", csv);
        Assert.DoesNotContain("RawDataJson", csv, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("responseId", csv, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExportAsync_Codebook_GeneratesWorkbookSheets()
    {
        await using var context = CreateContext();
        var seed = await SeedExportModelAsync(context);
        var service = new ResearchExportService(context);

        var result = await service.ExportAsync(TestUserId, seed.ModelId, "codebook", CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Equal($"nckh-model-{seed.ModelId}-codebook.xlsx", result.Value!.FileName);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", result.Value.ContentType);

        using var stream = new MemoryStream(result.Value.Content);
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
        Assert.NotNull(archive.GetEntry("xl/worksheets/sheet1.xml"));
        Assert.NotNull(archive.GetEntry("xl/worksheets/sheet2.xml"));
        Assert.NotNull(archive.GetEntry("xl/worksheets/sheet3.xml"));
        var workbook = ReadEntry(archive, "xl/workbook.xml");
        Assert.Contains("Variables", workbook);
        Assert.Contains("Mappings", workbook);
        Assert.Contains("Notes", workbook);
        Assert.Contains("Self-study skill", ReadEntry(archive, "xl/worksheets/sheet1.xml"));
        Assert.Contains("Question 1", ReadEntry(archive, "xl/worksheets/sheet2.xml"));
    }

    [Fact]
    public async Task ExportAsync_Spss_GeneratesImportSyntaxWithoutStatistics()
    {
        await using var context = CreateContext();
        var seed = await SeedExportModelAsync(context);
        var service = new ResearchExportService(context);

        var result = await service.ExportAsync(TestUserId, seed.ModelId, "spss", CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Success, result.Status);
        Assert.Equal($"nckh-model-{seed.ModelId}-spss.sps", result.Value!.FileName);
        Assert.Equal("text/plain; charset=utf-8", result.Value.ContentType);

        var syntax = Encoding.UTF8.GetString(result.Value.Content);
        Assert.Contains($"GET DATA /TYPE=TXT /FILE='nckh-model-{seed.ModelId}-dataset.csv'", syntax);
        Assert.Contains("TH1 F8.2", syntax);
        Assert.Contains("TH_mean F8.2", syntax);
        Assert.Contains("VARIABLE LABELS", syntax);
        Assert.DoesNotContain("EXECUTE", syntax, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("RELIABILITY", syntax, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("REGRESSION", syntax, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExportAsync_ReturnsConflictWhenDatasetIsStale()
    {
        await using var context = CreateContext();
        var seed = await SeedExportModelAsync(context, isStale: true);
        var service = new ResearchExportService(context);

        var result = await service.ExportAsync(TestUserId, seed.ModelId, "csv", CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Conflict, result.Status);
        Assert.Contains("stale", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExportAsync_ReturnsConflictWhenNoDatasetExists()
    {
        await using var context = CreateContext();
        var seed = await SeedExportModelAsync(context, includeDataset: false);
        var service = new ResearchExportService(context);

        var result = await service.ExportAsync(TestUserId, seed.ModelId, "csv", CancellationToken.None);

        Assert.Equal(ResearchFormServiceStatus.Conflict, result.Status);
        Assert.Contains("normalized dataset", result.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static readonly Guid TestUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static async Task<SeedIds> SeedExportModelAsync(
        FormAutoHubDbContext context,
        bool isStale = false,
        bool includeDataset = true)
    {
        var now = DateTimeOffset.UtcNow;
        var formId = Guid.NewGuid();
        var modelId = Guid.NewGuid();
        var variableId = Guid.NewGuid();
        var question1Id = Guid.NewGuid();
        var question2Id = Guid.NewGuid();
        var surveyResponseId = Guid.NewGuid();

        context.ResearchForms.Add(new ResearchForm
        {
            Id = formId,
            UserId = TestUserId,
            GoogleFormId = "google-source-form",
            FormUrl = "https://docs.google.com/forms/d/google-source-form/edit",
            Title = "Source form",
            Status = "Draft",
            ImportedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ResearchModels.Add(new ResearchModel
        {
            Id = modelId,
            UserId = TestUserId,
            FormId = formId,
            Name = "Export survey",
            Status = "Active",
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ResearchFormQuestions.AddRange(
            new ResearchFormQuestion
            {
                Id = question1Id,
                FormId = formId,
                GoogleQuestionId = "q1",
                QuestionText = "Question 1",
                QuestionType = "linearScale",
                IsRequired = true,
                OrderIndex = 0,
                CreatedAt = now
            },
            new ResearchFormQuestion
            {
                Id = question2Id,
                FormId = formId,
                GoogleQuestionId = "q2",
                QuestionText = "Question 2",
                QuestionType = "linearScale",
                IsRequired = true,
                OrderIndex = 1,
                CreatedAt = now
            });

        context.ResearchVariables.Add(new ResearchVariable
        {
            Id = variableId,
            ModelId = modelId,
            Name = "Self-study skill",
            Code = "TH",
            VariableType = "Independent",
            ScaleType = "Likert",
            ScalePoint = 5,
            SortOrder = 1,
            CreatedAt = now,
            UpdatedAt = now
        });

        context.ObservedQuestionMappings.AddRange(
            new ObservedQuestionMapping
            {
                Id = Guid.NewGuid(),
                VariableId = variableId,
                FormQuestionId = question1Id,
                ObservedCode = "TH1",
                SortOrder = 1,
                CreatedAt = now
            },
            new ObservedQuestionMapping
            {
                Id = Guid.NewGuid(),
                VariableId = variableId,
                FormQuestionId = question2Id,
                ObservedCode = "TH2",
                SortOrder = 2,
                CreatedAt = now
            });

        context.SurveyResponses.Add(new SurveyResponse
        {
            Id = surveyResponseId,
            ModelId = modelId,
            GoogleResponseId = "response-1",
            RespondentId = "respondent-1",
            RawDataJson = "{\"responseId\":\"response-1\",\"answers\":{\"q1\":[\"5\"]}}",
            CreatedAt = now,
            UpdatedAt = now
        });

        if (includeDataset)
        {
            context.NormalizedDatasets.Add(new NormalizedDataset
            {
                Id = Guid.NewGuid(),
                ModelId = modelId,
                SurveyResponseId = surveyResponseId,
                RespondentId = "respondent-1",
                NormalizedDataJson = "{\"RespondentId\":\"respondent-1\",\"TH1\":5,\"TH2\":4,\"TH_mean\":4.5}",
                IsStale = isStale,
                NormalizedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await context.SaveChangesAsync();
        return new SeedIds(modelId);
    }

    private static string ReadEntry(ZipArchive archive, string name)
    {
        var entry = archive.GetEntry(name) ?? throw new InvalidOperationException($"Missing {name}");
        using var reader = new StreamReader(entry.Open());
        return reader.ReadToEnd();
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new FormAutoHubDbContext(options);
    }

    private sealed record SeedIds(Guid ModelId);
}
