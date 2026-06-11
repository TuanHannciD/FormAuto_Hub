namespace FormAutoHub.Api.Contracts;

public sealed record NckhCollectResponsesResponse(
    Guid LogId,
    int ResponsesCollected,
    int ResponsesSkipped,
    string Status,
    string? ErrorMessage);

public sealed record NckhRawResponseListResponse(
    List<NckhRawResponseListItem> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed record NckhRawResponseListItem(
    Guid Id,
    string GoogleResponseId,
    string? RespondentId,
    DateTimeOffset? ResponseTimestamp,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record NckhNormalizeResponsesResponse(
    int RespondentsProcessed,
    int VariablesComputed,
    int MissingDataCount,
    int StaleDatasetsMarked);

public sealed record NckhDatasetListResponse(
    List<string> Columns,
    bool HasStaleData,
    List<NckhDatasetListItem> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed record NckhDatasetListItem(
    string? RespondentId,
    Dictionary<string, object?> Values,
    bool IsStale,
    DateTimeOffset NormalizedAt);

public sealed record NckhExportFileResponse(
    string FileName,
    string ContentType,
    byte[] Content);
