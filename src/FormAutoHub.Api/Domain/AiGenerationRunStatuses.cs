namespace FormAutoHub.Api.Domain;

public static class AiGenerationRunStatuses
{
    public const string Pending = "Pending";
    public const string Running = "Running";
    public const string Succeeded = "Succeeded";
    public const string Partial = "Partial";
    public const string Failed = "Failed";
}

public static class AiGenerationRunItemStatuses
{
    public const string Valid = "Valid";
    public const string Invalid = "Invalid";
}
