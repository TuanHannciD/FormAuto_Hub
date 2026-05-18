namespace FormAutoHub.Api.Integrations.GoogleForms;

public sealed record GoogleFormAnalysis(
    string Title,
    string ActionUrl,
    IReadOnlyList<GoogleFormQuestion> Questions);

public sealed record GoogleFormQuestion(
    string Label,
    string EntryId,
    string QuestionType,
    IReadOnlyList<string> Options,
    bool Required,
    int OrderIndex);

public sealed record GoogleFormSubmitResult(
    bool Success,
    string ErrorMessage);
