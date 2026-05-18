namespace FormAutoHub.Api.Entities;

public sealed class FormQuestion
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string EntryId { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string OptionsJson { get; set; } = string.Empty;
    public bool Required { get; set; }
    public int OrderIndex { get; set; }
}
