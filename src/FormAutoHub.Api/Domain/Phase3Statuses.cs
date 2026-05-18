namespace FormAutoHub.Api.Domain;

public static class FormProjectStatuses
{
    public const string Analyzed = "Analyzed";
    public const string Unsupported = "Unsupported";
    public const string Failed = "Failed";
}

public static class GeneratedResponseStatuses
{
    public const string Previewed = "Previewed";
    public const string Submitted = "Submitted";
    public const string Failed = "Failed";
}

public static class SubmissionJobStatuses
{
    public const string Pending = "Pending";
    public const string Running = "Running";
    public const string Paused = "Paused";
    public const string Completed = "Completed";
    public const string Failed = "Failed";
    public const string Cancelled = "Cancelled";
}

public static class SubmissionLogStatuses
{
    public const string Success = "Success";
    public const string Failed = "Failed";
}

public static class FormQuestionTypes
{
    public const string ShortText = "ShortText";
    public const string ParagraphText = "ParagraphText";
    public const string MultipleChoice = "MultipleChoice";
    public const string Checkbox = "Checkbox";
    public const string Dropdown = "Dropdown";
    public const string LinearScale = "LinearScale";
    public const string Rating = "Rating";
    public const string MultipleChoiceGrid = "MultipleChoiceGrid";
    public const string CheckboxGrid = "CheckboxGrid";
    public const string Date = "Date";
    public const string Time = "Time";
}

public static class AnswerRuleModes
{
    public const string RandomEqually = "RandomEqually";
    public const string RandomByPercentage = "RandomByPercentage";
    public const string RandomByQuantity = "RandomByQuantity";
    public const string SampleTextLines = "SampleTextLines";
    public const string DateRangeSequential = "DateRangeSequential";
    public const string TimeRangeSequential = "TimeRangeSequential";
}
