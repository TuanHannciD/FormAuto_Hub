using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services.Nckh;

public sealed class ResearchExportService(FormAutoHubDbContext dbContext) : IResearchExportService
{
    private const string FormatCsv = "csv";
    private const string FormatCodebook = "codebook";
    private const string FormatSpss = "spss";
    private const string CsvFileSuffix = "dataset.csv";

    public async Task<ResearchFormServiceResult<NckhExportFileResponse>> ExportAsync(
        Guid userId,
        Guid modelId,
        string? format,
        CancellationToken cancellationToken)
    {
        var normalizedFormat = format?.Trim().ToLowerInvariant();
        if (normalizedFormat is not (FormatCsv or FormatCodebook or FormatSpss))
        {
            return Invalid("Unsupported export format. Use csv, codebook, or spss.");
        }

        var model = await dbContext.ResearchModels
            .AsNoTracking()
            .AsSplitQuery()
            .Include(item => item.Variables)
            .ThenInclude(item => item.ObservedQuestionMappings)
            .ThenInclude(item => item.FormQuestion)
            .SingleOrDefaultAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);

        if (model is null)
        {
            return NotFound();
        }

        var datasets = await dbContext.NormalizedDatasets
            .AsNoTracking()
            .Where(item => item.ModelId == modelId)
            .OrderBy(item => item.NormalizedAt)
            .ToListAsync(cancellationToken);

        if (datasets.Count == 0)
        {
            return Conflict("At least one normalized dataset row is required before export.");
        }

        if (datasets.Any(item => item.IsStale))
        {
            return Conflict("Normalized data is stale. Re-run normalization before export.");
        }

        var columns = BuildColumns(model);
        var filePrefix = $"nckh-model-{model.Id}";
        return normalizedFormat switch
        {
            FormatCsv => Success(new NckhExportFileResponse(
                $"{filePrefix}-{CsvFileSuffix}",
                "text/csv; charset=utf-8",
                BuildCsv(columns, datasets))),
            FormatCodebook => Success(new NckhExportFileResponse(
                $"{filePrefix}-codebook.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                BuildCodebook(model))),
            _ => Success(new NckhExportFileResponse(
                $"{filePrefix}-spss.sps",
                "text/plain; charset=utf-8",
                BuildSpss(model, columns, $"{filePrefix}-{CsvFileSuffix}")))
        };
    }

    private static byte[] BuildCsv(IReadOnlyList<string> columns, IReadOnlyList<NormalizedDataset> datasets)
    {
        var builder = new StringBuilder();
        builder.AppendLine(string.Join(',', columns.Select(EscapeCsv)));
        foreach (var dataset in datasets)
        {
            var values = DeserializeValues(dataset.NormalizedDataJson);
            var row = columns.Select(column => EscapeCsv(FormatCell(values.GetValueOrDefault(column))));
            builder.AppendLine(string.Join(',', row));
        }

        var csv = builder.ToString();
        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
    }

    private static byte[] BuildCodebook(ResearchModel model)
    {
        var exportedAt = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);
        var variables = new List<List<string>>
        {
            new() { "Code", "Name", "VariableType", "ScaleType", "ScalePoint", "MinValue", "MaxValue", "SortOrder" }
        };
        variables.AddRange(model.Variables
            .OrderBy(item => item.SortOrder)
            .Select(item => new List<string>
            {
                item.Code,
                item.Name,
                item.VariableType,
                item.ScaleType,
                item.ScalePoint?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                item.MinValue?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                item.MaxValue?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                item.SortOrder.ToString(CultureInfo.InvariantCulture)
            }));

        var mappings = new List<List<string>>
        {
            new() { "VariableCode", "ObservedCode", "GoogleQuestionId", "QuestionText", "QuestionType", "IsRequired", "SortOrder" }
        };
        mappings.AddRange(model.Variables
            .OrderBy(item => item.SortOrder)
            .SelectMany(variable => variable.ObservedQuestionMappings
                .OrderBy(mapping => mapping.SortOrder)
                .Select(mapping => new List<string>
                {
                    variable.Code,
                    mapping.ObservedCode,
                    mapping.FormQuestion.GoogleQuestionId,
                    mapping.FormQuestion.QuestionText,
                    mapping.FormQuestion.QuestionType,
                    mapping.FormQuestion.IsRequired ? "true" : "false",
                    mapping.SortOrder.ToString(CultureInfo.InvariantCulture)
                })));

        var notes = new List<List<string>>
        {
            new() { "Key", "Value" },
            new() { "ModelId", model.Id.ToString() },
            new() { "ExportedAtUtc", exportedAt },
            new() { "DatasetStale", "false" },
            new() { "Statistics", "Deferred: Phase 6 exports data and syntax only; it does not compute statistical results." }
        };

        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(archive, "[Content_Types].xml", ContentTypesXml());
            AddEntry(archive, "_rels/.rels", RootRelsXml());
            AddEntry(archive, "xl/workbook.xml", WorkbookXml());
            AddEntry(archive, "xl/_rels/workbook.xml.rels", WorkbookRelsXml());
            AddEntry(archive, "xl/styles.xml", StylesXml());
            AddEntry(archive, "xl/worksheets/sheet1.xml", WorksheetXml(variables));
            AddEntry(archive, "xl/worksheets/sheet2.xml", WorksheetXml(mappings));
            AddEntry(archive, "xl/worksheets/sheet3.xml", WorksheetXml(notes));
        }

        return stream.ToArray();
    }

    private static byte[] BuildSpss(ResearchModel model, IReadOnlyList<string> columns, string csvFileName)
    {
        var builder = new StringBuilder();
        builder.AppendLine("* NCKH Phase 6 SPSS syntax export.");
        builder.AppendLine("* Deferred: this syntax imports data only and does not run statistical analysis.");
        builder.AppendLine($"GET DATA /TYPE=TXT /FILE='{EscapeSpss(csvFileName)}'");
        builder.AppendLine("  /ENCODING='UTF8'");
        builder.AppendLine("  /DELCASE=LINE");
        builder.AppendLine("  /DELIMITERS=','");
        builder.AppendLine("  /QUALIFIER='\"'");
        builder.AppendLine("  /ARRANGEMENT=DELIMITED");
        builder.AppendLine("  /FIRSTCASE=2");
        builder.AppendLine("  /VARIABLES=");
        foreach (var column in columns)
        {
            builder.AppendLine($"  {SanitizeSpssName(column)} {SpssTypeForColumn(model, column)}");
        }

        builder.AppendLine(".");
        builder.AppendLine("VARIABLE LABELS");
        foreach (var column in columns)
        {
            builder.AppendLine($"  {SanitizeSpssName(column)} '{EscapeSpss(LabelForColumn(model, column))}'");
        }

        builder.AppendLine(".");
        return Encoding.UTF8.GetBytes(builder.ToString());
    }

    private static List<string> BuildColumns(ResearchModel model)
    {
        var columns = new List<string> { "RespondentId" };
        foreach (var variable in model.Variables.OrderBy(item => item.SortOrder))
        {
            columns.AddRange(variable.ObservedQuestionMappings
                .OrderBy(item => item.SortOrder)
                .Select(item => item.ObservedCode));
            if (IsNumericScale(variable.ScaleType) && variable.ObservedQuestionMappings.Count > 0)
            {
                columns.Add($"{variable.Code}_mean");
            }
        }

        return columns;
    }

    private static Dictionary<string, object?> DeserializeValues(string normalizedDataJson)
    {
        var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        using var document = JsonDocument.Parse(normalizedDataJson);
        foreach (var property in document.RootElement.EnumerateObject())
        {
            result[property.Name] = property.Value.ValueKind switch
            {
                JsonValueKind.Number when property.Value.TryGetDecimal(out var decimalValue) => decimalValue,
                JsonValueKind.String => property.Value.GetString(),
                JsonValueKind.Array => property.Value.EnumerateArray()
                    .Where(item => item.ValueKind == JsonValueKind.String)
                    .Select(item => item.GetString())
                    .Where(item => !string.IsNullOrWhiteSpace(item))
                    .ToList(),
                JsonValueKind.Null => null,
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                _ => property.Value.GetRawText()
            };
        }

        return result;
    }

    private static string FormatCell(object? value)
    {
        return value switch
        {
            null => string.Empty,
            decimal decimalValue => decimalValue.ToString(CultureInfo.InvariantCulture),
            int intValue => intValue.ToString(CultureInfo.InvariantCulture),
            long longValue => longValue.ToString(CultureInfo.InvariantCulture),
            double doubleValue => doubleValue.ToString(CultureInfo.InvariantCulture),
            float floatValue => floatValue.ToString(CultureInfo.InvariantCulture),
            bool boolValue => boolValue ? "true" : "false",
            IEnumerable<string> list => string.Join(';', list),
            _ => value.ToString() ?? string.Empty
        };
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\r') || value.Contains('\n') || value.Contains(';'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    private static void AddEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content);
    }

    private static string WorksheetXml(IReadOnlyList<List<string>> rows)
    {
        var builder = new StringBuilder();
        builder.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
        builder.Append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
        for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
        {
            builder.Append(CultureInfo.InvariantCulture, $"<row r=\"{rowIndex + 1}\">");
            for (var columnIndex = 0; columnIndex < rows[rowIndex].Count; columnIndex++)
            {
                var reference = $"{ColumnName(columnIndex)}{rowIndex + 1}";
                builder.Append(CultureInfo.InvariantCulture, $"<c r=\"{reference}\" t=\"inlineStr\"><is><t>{XmlEscape(rows[rowIndex][columnIndex])}</t></is></c>");
            }

            builder.Append("</row>");
        }

        builder.Append("</sheetData></worksheet>");
        return builder.ToString();
    }

    private static string ColumnName(int index)
    {
        var dividend = index + 1;
        var name = string.Empty;
        while (dividend > 0)
        {
            var modulo = (dividend - 1) % 26;
            name = Convert.ToChar('A' + modulo) + name;
            dividend = (dividend - modulo) / 26;
        }

        return name;
    }

    private static string ContentTypesXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
        "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
        "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
        "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
        "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
        "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
        "<Override PartName=\"/xl/worksheets/sheet2.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
        "<Override PartName=\"/xl/worksheets/sheet3.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
        "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
        "</Types>";

    private static string RootRelsXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
        "</Relationships>";

    private static string WorkbookXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
        "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
        "<sheets>" +
        "<sheet name=\"Variables\" sheetId=\"1\" r:id=\"rId1\"/>" +
        "<sheet name=\"Mappings\" sheetId=\"2\" r:id=\"rId2\"/>" +
        "<sheet name=\"Notes\" sheetId=\"3\" r:id=\"rId3\"/>" +
        "</sheets></workbook>";

    private static string WorkbookRelsXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
        "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet2.xml\"/>" +
        "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet3.xml\"/>" +
        "<Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
        "</Relationships>";

    private static string StylesXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
        "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
        "<fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts>" +
        "<fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>" +
        "<borders count=\"1\"><border/></borders>" +
        "<cellStyleXfs count=\"1\"><xf/></cellStyleXfs>" +
        "<cellXfs count=\"1\"><xf xfId=\"0\"/></cellXfs>" +
        "</styleSheet>";

    private static string SpssTypeForColumn(ResearchModel model, string column)
    {
        if (string.Equals(column, "RespondentId", StringComparison.OrdinalIgnoreCase))
        {
            return "A255";
        }

        if (column.EndsWith("_mean", StringComparison.OrdinalIgnoreCase))
        {
            return "F8.2";
        }

        var mapping = FindMapping(model, column);
        return mapping is not null && IsNumericScale(mapping.Variable.ScaleType) ? "F8.2" : "A255";
    }

    private static string LabelForColumn(ResearchModel model, string column)
    {
        if (string.Equals(column, "RespondentId", StringComparison.OrdinalIgnoreCase))
        {
            return "Respondent ID";
        }

        if (column.EndsWith("_mean", StringComparison.OrdinalIgnoreCase))
        {
            var variableCode = column[..^5];
            var variable = model.Variables.SingleOrDefault(item => string.Equals(item.Code, variableCode, StringComparison.OrdinalIgnoreCase));
            return variable is null ? column : $"{variable.Name} mean";
        }

        var mapping = FindMapping(model, column);
        return mapping is null ? column : $"{mapping.Variable.Name}: {mapping.Mapping.FormQuestion.QuestionText}";
    }

    private static MappingDraft? FindMapping(ResearchModel model, string observedCode)
    {
        return model.Variables
            .SelectMany(variable => variable.ObservedQuestionMappings.Select(mapping => new MappingDraft(variable, mapping)))
            .SingleOrDefault(item => string.Equals(item.Mapping.ObservedCode, observedCode, StringComparison.OrdinalIgnoreCase));
    }

    private static string SanitizeSpssName(string name)
    {
        var builder = new StringBuilder();
        foreach (var character in name)
        {
            builder.Append(char.IsLetterOrDigit(character) || character == '_' ? character : '_');
        }

        var sanitized = builder.ToString();
        if (string.IsNullOrWhiteSpace(sanitized))
        {
            return "VAR1";
        }

        if (char.IsDigit(sanitized[0]))
        {
            sanitized = $"V_{sanitized}";
        }

        return sanitized.Length <= 64 ? sanitized : sanitized[..64];
    }

    private static string EscapeSpss(string value) => value.Replace("'", "''");

    private static string XmlEscape(string value) =>
        value
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'", "&apos;");

    private static bool IsNumericScale(string scaleType)
    {
        return string.Equals(scaleType, "Likert", StringComparison.OrdinalIgnoreCase)
            || string.Equals(scaleType, "Scale", StringComparison.OrdinalIgnoreCase);
    }

    private static ResearchFormServiceResult<NckhExportFileResponse> Success(NckhExportFileResponse value) =>
        new(ResearchFormServiceStatus.Success, value);

    private static ResearchFormServiceResult<NckhExportFileResponse> Invalid(string message) =>
        new(ResearchFormServiceStatus.InvalidRequest, Message: message);

    private static ResearchFormServiceResult<NckhExportFileResponse> Conflict(string message) =>
        new(ResearchFormServiceStatus.Conflict, Message: message);

    private static ResearchFormServiceResult<NckhExportFileResponse> NotFound() =>
        new(ResearchFormServiceStatus.NotFound);

    private sealed record MappingDraft(ResearchVariable Variable, ObservedQuestionMapping Mapping);
}


