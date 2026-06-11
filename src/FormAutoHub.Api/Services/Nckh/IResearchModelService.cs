using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchModelService
{
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> CreateModelAsync(
        Guid userId, NckhCreateResearchModelRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelListResponse>> ListModelsAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> GetModelAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> UpdateModelAsync(
        Guid userId, Guid modelId, NckhUpdateResearchModelRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> ActivateModelAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteModelAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
}
