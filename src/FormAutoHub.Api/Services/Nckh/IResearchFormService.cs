using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchFormService
{
    Task<ResearchFormServiceResult<NckhGoogleLinkResponse>> LinkGoogleAsync(
        Guid userId, NckhGoogleLinkRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhImportFormResponse>> ImportFormAsync(
        Guid userId, NckhImportFormRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhFormListResponse>> ListFormsAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhFormDetailResponse>> GetFormDetailAsync(
        Guid userId, Guid formId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhGenerateFormResponse>> GenerateFormAsync(
        Guid userId, Guid modelId, NckhGenerateFormRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhVariableResponse>> CreateVariableAsync(
        Guid userId, Guid modelId, NckhCreateVariableRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhVariableListResponse>> ListVariablesAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhVariableResponse>> UpdateVariableAsync(
        Guid userId, Guid variableId, NckhUpdateVariableRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteVariableAsync(
        Guid userId, Guid variableId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingResponse>> CreateMappingAsync(
        Guid userId, Guid variableId, NckhCreateMappingRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingListResponse>> ListVariableMappingsAsync(
        Guid userId, Guid variableId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingListResponse>> ListModelMappingsAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingResponse>> UpdateMappingAsync(
        Guid userId, Guid mappingId, NckhUpdateMappingRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteMappingAsync(
        Guid userId, Guid mappingId, CancellationToken cancellationToken);
}
