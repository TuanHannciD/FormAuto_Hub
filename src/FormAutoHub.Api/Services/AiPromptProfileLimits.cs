namespace FormAutoHub.Api.Services;

public static class AiPromptProfileLimits
{
    public const int MaxAudienceFieldLength = 200;
    public const int MaxGlobalPromptLength = 2_000;
    public const int MaxQuestionPromptLength = 1_000;
    public const int MaxTotalPromptPayloadLength = 20_000;
}
