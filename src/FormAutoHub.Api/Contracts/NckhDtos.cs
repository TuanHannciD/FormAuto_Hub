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

public sealed record NckhGenerateFormRequest(string Action);

public sealed record NckhGenerateFormResponse(
    Guid FormId,
    string GoogleFormId,
    string FormUrl,
    int QuestionsCreated,
    int QuestionsUpdated,
    int QuestionsDeleted,
    bool Reimported);

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
    bool HasGeneratedForm,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record NckhResearchModelListResponse(
    List<NckhResearchModelResponse> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
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
