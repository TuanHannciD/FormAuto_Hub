namespace FormAutoHub.Api.Contracts;

public sealed record NckhCreateRelationRequest(
    Guid FromVariableId,
    Guid ToVariableId,
    string Direction,
    int SortOrder);

public sealed record NckhUpdateRelationRequest(
    Guid FromVariableId,
    Guid ToVariableId,
    string Direction,
    int SortOrder);

public sealed record NckhRelationResponse(
    Guid Id,
    Guid ModelId,
    Guid FromVariableId,
    string FromVariableName,
    string FromVariableCode,
    Guid ToVariableId,
    string ToVariableName,
    string ToVariableCode,
    string Direction,
    string HypothesisCode,
    string HypothesisText,
    int SortOrder,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record NckhRelationListResponse(
    List<NckhRelationResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed record NckhSavePositionsRequest(List<NckhSavePositionItem> Positions);

public sealed record NckhSavePositionItem(
    string NodeType,
    Guid? VariableId,
    Guid? RelationId,
    decimal PositionX,
    decimal PositionY);

public sealed record NckhPositionResponse(
    Guid Id,
    string NodeType,
    Guid? VariableId,
    Guid? RelationId,
    decimal PositionX,
    decimal PositionY,
    DateTimeOffset UpdatedAt);

public sealed record NckhPositionListResponse(List<NckhPositionResponse> Items);
