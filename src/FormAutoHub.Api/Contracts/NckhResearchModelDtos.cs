namespace FormAutoHub.Api.Contracts;

public sealed record NckhCreateResearchModelRequest(
    Guid FormId,
    string Name,
    string? Description);

public sealed record NckhUpdateResearchModelRequest(
    string Name,
    string? Description);

public sealed record NckhResearchModelResponse(
    Guid Id,
    Guid FormId,
    string Name,
    string? Description,
    string Status,
    string FormTitle,
    int VariableCount,
    bool HasGeneratedForm,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record NckhResearchModelListResponse(
    List<NckhResearchModelResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
