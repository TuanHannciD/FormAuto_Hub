namespace FormAutoHub.Api.Contracts;

public sealed record NckhCreateMappingRequest(
    Guid FormQuestionId,
    string ObservedCode,
    int SortOrder);

public sealed record NckhUpdateMappingRequest(
    Guid FormQuestionId,
    string ObservedCode,
    int SortOrder);

public sealed record NckhMappingResponse(
    Guid Id,
    Guid VariableId,
    Guid ModelId,
    Guid FormQuestionId,
    string ObservedCode,
    string QuestionText,
    string QuestionType,
    int SortOrder,
    DateTimeOffset CreatedAt);

public sealed record NckhMappingListResponse(
    List<NckhMappingResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
