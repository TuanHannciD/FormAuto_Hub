using System.Globalization;
using System.Text.Json;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services.Nckh;

public sealed class ResearchDataService(
    FormAutoHubDbContext dbContext,
    IGoogleOAuthService googleOAuthService,
    IGoogleFormsApiService googleFormsApiService) : IResearchDataService
{
    private const string GoogleProvider = "Google";
    private const string FormsResponsesReadScope = "https://www.googleapis.com/auth/forms.responses.readonly";
    private const string StatusSuccess = "Success";
    private const string StatusFailed = "Failed";

    public async Task<ResearchFormServiceResult<NckhCollectResponsesResponse>> CollectResponsesAsync(
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await LoadOwnedModelAsync(userId, modelId, cancellationToken);
        if (model is null)
        {
            return NotFound<NckhCollectResponsesResponse>();
        }

        var log = new DataCollectionLog
        {
            Id = Guid.NewGuid(),
            ModelId = model.Id,
            Status = StatusFailed,
            StartedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow
        };
        dbContext.DataCollectionLogs.Add(log);

        var login = await dbContext.UserExternalLogins
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == userId && item.Provider == GoogleProvider, cancellationToken);

        if (login is null)
        {
            return await CompleteFailedCollectAsync(log, "Google account not linked. Please link your Google account.", ResearchFormServiceStatus.Unauthorized, cancellationToken);
        }

        var scopes = login.Scopes?.Split(' ', StringSplitOptions.RemoveEmptyEntries) ?? [];
        if (!HasScope(scopes, FormsResponsesReadScope))
        {
            return await CompleteFailedCollectAsync(
                log,
                "Google Forms response read scope is required. Please re-consent with Forms responses permission.",
                ResearchFormServiceStatus.Forbidden,
                cancellationToken);
        }

        var accessToken = await googleOAuthService.GetValidAccessTokenAsync(userId, cancellationToken);
        if (accessToken is null)
        {
            return await CompleteFailedCollectAsync(
                log,
                "Google account not linked or token expired. Please re-link your Google account.",
                ResearchFormServiceStatus.Unauthorized,
                cancellationToken);
        }

        var googleResponses = await googleFormsApiService.ListResponsesAsync(accessToken, model.Form.GoogleFormId, cancellationToken);
        if (googleResponses is null)
        {
            return await CompleteFailedCollectAsync(
                log,
                "Unable to read Google Form responses.",
                ResearchFormServiceStatus.ExternalError,
                cancellationToken);
        }

        var existing = await dbContext.SurveyResponses
            .Where(item => item.ModelId == model.Id)
            .ToDictionaryAsync(item => item.GoogleResponseId, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var collected = 0;
        var skipped = 0;
        var now = DateTimeOffset.UtcNow;

        foreach (var googleResponse in googleResponses)
        {
            var rawJson = SerializeRawResponse(googleResponse);
            if (existing.TryGetValue(googleResponse.ResponseId, out var surveyResponse))
            {
                if (surveyResponse.RawDataJson == rawJson && surveyResponse.ResponseTimestamp == googleResponse.ResponseTimestamp)
                {
                    skipped++;
                    continue;
                }

                surveyResponse.RawDataJson = rawJson;
                surveyResponse.ResponseTimestamp = googleResponse.ResponseTimestamp;
                surveyResponse.UpdatedAt = now;
                collected++;
                continue;
            }

            dbContext.SurveyResponses.Add(new SurveyResponse
            {
                Id = Guid.NewGuid(),
                ModelId = model.Id,
                GoogleResponseId = googleResponse.ResponseId,
                RespondentId = null,
                RawDataJson = rawJson,
                ResponseTimestamp = googleResponse.ResponseTimestamp,
                CreatedAt = now,
                UpdatedAt = now
            });
            collected++;
        }

        log.Status = StatusSuccess;
        log.ResponsesCollected = collected;
        log.ResponsesSkipped = skipped;
        log.CompletedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Success(new NckhCollectResponsesResponse(log.Id, collected, skipped, StatusSuccess, null));
    }

    public async Task<ResearchFormServiceResult<NckhRawResponseListResponse>> ListResponsesAsync(
        Guid userId,
        Guid modelId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (!await OwnsModelAsync(userId, modelId, cancellationToken))
        {
            return NotFound<NckhRawResponseListResponse>();
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.SurveyResponses
            .AsNoTracking()
            .Where(item => item.ModelId == modelId);

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await query
            .OrderByDescending(item => item.ResponseTimestamp ?? item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new NckhRawResponseListItem(
                item.Id,
                item.GoogleResponseId,
                item.RespondentId,
                item.ResponseTimestamp,
                item.CreatedAt,
                item.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Success(new NckhRawResponseListResponse(items, page, pageSize, totalItems, totalPages));
    }

    public async Task<ResearchFormServiceResult<NckhNormalizeResponsesResponse>> NormalizeResponsesAsync(
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await dbContext.ResearchModels
            .AsSplitQuery()
            .Include(item => item.Variables)
            .ThenInclude(item => item.ObservedQuestionMappings)
            .ThenInclude(item => item.FormQuestion)
            .SingleOrDefaultAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);

        if (model is null)
        {
            return NotFound<NckhNormalizeResponsesResponse>();
        }

        var mappings = model.Variables
            .SelectMany(variable => variable.ObservedQuestionMappings.Select(mapping => new MappingDraft(variable, mapping)))
            .OrderBy(item => item.Variable.SortOrder)
            .ThenBy(item => item.Mapping.SortOrder)
            .ToList();

        if (mappings.Count == 0)
        {
            return Invalid<NckhNormalizeResponsesResponse>("At least one observed mapping is required before normalization.");
        }

        var responses = await dbContext.SurveyResponses
            .Where(item => item.ModelId == model.Id)
            .OrderBy(item => item.ResponseTimestamp ?? item.CreatedAt)
            .ToListAsync(cancellationToken);

        var existingDatasets = await dbContext.NormalizedDatasets
            .Where(item => item.ModelId == model.Id)
            .ToDictionaryAsync(item => item.SurveyResponseId, cancellationToken);

        var staleDatasetsMarked = existingDatasets.Values.Count(item => item.IsStale);
        var missingDataCount = 0;
        var now = DateTimeOffset.UtcNow;

        foreach (var response in responses)
        {
            var raw = DeserializeRawResponse(response.RawDataJson);
            var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
            {
                ["RespondentId"] = response.RespondentId
            };
            var variableValues = new Dictionary<string, List<decimal>>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in mappings)
            {
                raw.TryGetValue(item.Mapping.FormQuestion.GoogleQuestionId, out var rawValues);
                var value = rawValues?.FirstOrDefault();
                if (string.IsNullOrWhiteSpace(value))
                {
                    values[item.Mapping.ObservedCode] = null;
                    missingDataCount++;
                    continue;
                }

                if (IsNumericScale(item.Variable.ScaleType))
                {
                    if (decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var numeric))
                    {
                        values[item.Mapping.ObservedCode] = numeric;
                        if (!variableValues.TryGetValue(item.Variable.Code, out var list))
                        {
                            list = [];
                            variableValues[item.Variable.Code] = list;
                        }

                        list.Add(numeric);
                    }
                    else
                    {
                        values[item.Mapping.ObservedCode] = null;
                        missingDataCount++;
                    }

                    continue;
                }

                values[item.Mapping.ObservedCode] = rawValues is { Count: > 1 } ? rawValues : value;
            }

            foreach (var variable in model.Variables)
            {
                if (variableValues.TryGetValue(variable.Code, out var list) && list.Count > 0)
                {
                    values[$"{variable.Code}_mean"] = Math.Round(list.Average(), 4);
                }
            }

            var normalizedJson = JsonSerializer.Serialize(values);
            if (existingDatasets.TryGetValue(response.Id, out var dataset))
            {
                dataset.RespondentId = response.RespondentId;
                dataset.NormalizedDataJson = normalizedJson;
                dataset.IsStale = false;
                dataset.NormalizedAt = now;
                dataset.UpdatedAt = now;
                continue;
            }

            dbContext.NormalizedDatasets.Add(new NormalizedDataset
            {
                Id = Guid.NewGuid(),
                ModelId = model.Id,
                SurveyResponseId = response.Id,
                RespondentId = response.RespondentId,
                NormalizedDataJson = normalizedJson,
                IsStale = false,
                NormalizedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var variableCount = model.Variables.Count(variable =>
            mappings.Any(item => item.Variable.Id == variable.Id));

        return Success(new NckhNormalizeResponsesResponse(
            responses.Count,
            variableCount,
            missingDataCount,
            staleDatasetsMarked));
    }

    public async Task<ResearchFormServiceResult<NckhDatasetListResponse>> ListDatasetAsync(
        Guid userId,
        Guid modelId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var model = await dbContext.ResearchModels
            .AsNoTracking()
            .Include(item => item.Variables)
            .ThenInclude(item => item.ObservedQuestionMappings)
            .SingleOrDefaultAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);

        if (model is null)
        {
            return NotFound<NckhDatasetListResponse>();
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.NormalizedDatasets
            .AsNoTracking()
            .Where(item => item.ModelId == modelId);

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var hasStaleData = await query.AnyAsync(item => item.IsStale, cancellationToken);
        var datasets = await query
            .OrderByDescending(item => item.NormalizedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var columns = BuildColumns(model);
        var items = datasets.Select(item => new NckhDatasetListItem(
            item.RespondentId,
            DeserializeValues(item.NormalizedDataJson),
            item.IsStale,
            item.NormalizedAt)).ToList();

        return Success(new NckhDatasetListResponse(columns, hasStaleData, items, page, pageSize, totalItems, totalPages));
    }

    private async Task<ResearchFormServiceResult<NckhCollectResponsesResponse>> CompleteFailedCollectAsync(
        DataCollectionLog log,
        string message,
        ResearchFormServiceStatus status,
        CancellationToken cancellationToken)
    {
        log.Status = StatusFailed;
        log.ErrorMessage = message;
        log.CompletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ResearchFormServiceResult<NckhCollectResponsesResponse>(status, Message: message);
    }

    private async Task<ResearchModel?> LoadOwnedModelAsync(Guid userId, Guid modelId, CancellationToken cancellationToken)
    {
        return await dbContext.ResearchModels
            .Include(item => item.Form)
            .SingleOrDefaultAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);
    }

    private Task<bool> OwnsModelAsync(Guid userId, Guid modelId, CancellationToken cancellationToken)
    {
        return dbContext.ResearchModels.AnyAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);
    }

    private static string SerializeRawResponse(GoogleFormResponseItem response)
    {
        var payload = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["responseId"] = response.ResponseId,
            ["answers"] = response.Answers
        };
        return JsonSerializer.Serialize(payload);
    }

    private static Dictionary<string, List<string>> DeserializeRawResponse(string rawDataJson)
    {
        using var document = JsonDocument.Parse(rawDataJson);
        var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        if (!document.RootElement.TryGetProperty("answers", out var answers) || answers.ValueKind != JsonValueKind.Object)
        {
            return result;
        }

        foreach (var answer in answers.EnumerateObject())
        {
            var values = new List<string>();
            if (answer.Value.ValueKind == JsonValueKind.Array)
            {
                values.AddRange(answer.Value.EnumerateArray()
                    .Where(item => item.ValueKind == JsonValueKind.String)
                    .Select(item => item.GetString()!)
                    .Where(item => !string.IsNullOrWhiteSpace(item)));
            }

            result[answer.Name] = values;
        }

        return result;
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
                _ => property.Value.GetRawText()
            };
        }

        return result;
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

    private static bool IsNumericScale(string scaleType)
    {
        return string.Equals(scaleType, "Likert", StringComparison.OrdinalIgnoreCase)
            || string.Equals(scaleType, "Scale", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasScope(IEnumerable<string> scopes, string requiredScope)
    {
        return scopes.Any(scope => string.Equals(scope, requiredScope, StringComparison.OrdinalIgnoreCase));
    }

    private static ResearchFormServiceResult<T> Success<T>(T value) =>
        new(ResearchFormServiceStatus.Success, value);

    private static ResearchFormServiceResult<T> Invalid<T>(string message) =>
        new(ResearchFormServiceStatus.InvalidRequest, Message: message);

    private static ResearchFormServiceResult<T> NotFound<T>() =>
        new(ResearchFormServiceStatus.NotFound);

    private sealed record MappingDraft(ResearchVariable Variable, ObservedQuestionMapping Mapping);
}


