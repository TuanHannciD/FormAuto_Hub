namespace FormAutoHub.Api.Contracts;

public sealed record NckhGoogleLinkRequest(string AuthorizationCode, string RedirectUri);

public sealed record NckhGoogleLinkResponse(bool Linked, string Email);

public sealed record NckhImportFormRequest(string FormUrl);

public sealed record NckhImportFormResponse(
    Guid Id,
    string GoogleFormId,
    string FormUrl,
    string Title,
    string Status,
    int QuestionCount,
    DateTimeOffset ImportedAt);

public sealed record NckhFormDetailResponse(
    Guid Id,
    string GoogleFormId,
    string Title,
    List<NckhFormQuestionResponse> Questions);

public sealed record NckhFormQuestionResponse(
    Guid Id,
    string GoogleQuestionId,
    string QuestionText,
    string QuestionType,
    bool IsRequired,
    int OrderIndex);

public sealed record NckhFormListResponse(
    List<NckhFormListItem> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);

public sealed record NckhFormListItem(
    Guid Id,
    string GoogleFormId,
    string Title,
    string Status,
    int QuestionCount,
    DateTimeOffset ImportedAt);

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
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record NckhResearchModelListResponse(
    List<NckhResearchModelResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
