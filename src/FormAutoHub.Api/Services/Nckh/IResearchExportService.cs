using FormAutoHub.Api.Contracts;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchExportService
{
    Task<ResearchFormServiceResult<NckhExportFileResponse>> ExportAsync(
        Guid userId,
        Guid modelId,
        string? format,
        CancellationToken cancellationToken);
}
