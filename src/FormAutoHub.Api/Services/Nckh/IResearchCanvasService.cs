using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchCanvasService
{
    Task<ResearchFormServiceResult<NckhRelationResponse>> CreateRelationAsync(
        Guid userId, Guid modelId, NckhCreateRelationRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRelationListResponse>> ListRelationsAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRelationResponse>> GetRelationAsync(
        Guid userId, Guid relationId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRelationResponse>> UpdateRelationAsync(
        Guid userId, Guid relationId, NckhUpdateRelationRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteRelationAsync(
        Guid userId, Guid relationId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhPositionListResponse>> ListPositionsAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhPositionListResponse>> SavePositionsAsync(
        Guid userId, Guid modelId, NckhSavePositionsRequest request, CancellationToken cancellationToken);
}
