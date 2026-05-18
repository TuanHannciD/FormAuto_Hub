namespace FormAutoHub.Api.Services;

internal static class Phase4SafetyLimits
{
    public const int MaxFormUrlLength = 2048;
    public const int MaxProjectNameLength = 120;
    public const int MaxAnswerRuleConfigLength = 8192;
    public const int MaxPreviewResponsesPerRequest = 100;
    public const int MaxSubmissionResponsesPerRequest = 100;
    public const int MaxSubmissionBatchSize = 10;
    public const int MaxGeneratedAnswerValues = 10;
    public const int MaxSampleTextLines = 100;
    public const int MaxGeneratedAnswerValueLength = 500;
}
