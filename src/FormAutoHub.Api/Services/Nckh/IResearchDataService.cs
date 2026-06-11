using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchDataService
{
    Task<ResearchFormServiceResult<NckhCollectResponsesResponse>> CollectResponsesAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRawResponseListResponse>> ListResponsesAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhNormalizeResponsesResponse>> NormalizeResponsesAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhDatasetListResponse>> ListDatasetAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
}
