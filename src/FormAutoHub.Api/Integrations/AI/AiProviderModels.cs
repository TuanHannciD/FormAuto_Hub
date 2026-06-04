using System.Text.Json.Serialization;

namespace FormAutoHub.Api.Integrations.AI;

public sealed record AiProviderGenerateRequest(
    Guid ProjectId,
    string Mode,
    int Count,
    string Provider,
    string Model,
    string PromptSnapshotJson,
    string QuestionSnapshotJson,
    string BaseUrl = "",
    [property: JsonIgnore] string ApiKey = "");

public sealed record AiProviderGenerateResult(
    string RawProviderRequestJson,
    string RawProviderResponseJson,
    IReadOnlyList<string> OutputJsons);
