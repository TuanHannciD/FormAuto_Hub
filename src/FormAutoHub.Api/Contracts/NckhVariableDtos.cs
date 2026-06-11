namespace FormAutoHub.Api.Contracts;

public sealed record NckhCreateVariableRequest(
    string Name,
    string Code,
    string VariableType,
    string ScaleType,
    int? ScalePoint,
    decimal? MinValue,
    decimal? MaxValue,
    int SortOrder);

public sealed record NckhUpdateVariableRequest(
    string Name,
    string Code,
    string VariableType,
    string ScaleType,
    int? ScalePoint,
    decimal? MinValue,
    decimal? MaxValue,
    int SortOrder);

public sealed record NckhVariableResponse(
    Guid Id,
    Guid ModelId,
    string Name,
    string Code,
    string VariableType,
    string ScaleType,
    int? ScalePoint,
    decimal? MinValue,
    decimal? MaxValue,
    int SortOrder,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record NckhVariableListResponse(
    List<NckhVariableResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
