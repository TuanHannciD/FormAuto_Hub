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
