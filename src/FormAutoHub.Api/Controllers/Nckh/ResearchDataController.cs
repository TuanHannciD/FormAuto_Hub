using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers.Nckh;

[ApiController]
[Route("api/v1/nckh/models/{modelId:guid}")]
[Authorize]
public sealed class ResearchDataController(
    IResearchDataService researchDataService,
    IResearchExportService researchExportService,
    ICurrentUserContext currentUser) : ControllerBase
{
    [HttpPost("collect")]
    public async Task<ActionResult<NckhCollectResponsesResponse>> CollectResponses(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await researchDataService.CollectResponsesAsync(currentUser.UserId, modelId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("responses")]
    public async Task<ActionResult<NckhRawResponseListResponse>> ListResponses(
        Guid modelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await researchDataService.ListResponsesAsync(currentUser.UserId, modelId, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost("normalize")]
    public async Task<ActionResult<NckhNormalizeResponsesResponse>> NormalizeResponses(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await researchDataService.NormalizeResponsesAsync(currentUser.UserId, modelId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("dataset")]
    public async Task<ActionResult<NckhDatasetListResponse>> ListDataset(
        Guid modelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await researchDataService.ListDatasetAsync(currentUser.UserId, modelId, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        Guid modelId,
        [FromQuery] string? format,
        CancellationToken cancellationToken = default)
    {
        var result = await researchExportService.ExportAsync(currentUser.UserId, modelId, format, cancellationToken);
        if (result.Status == ResearchFormServiceStatus.Success && result.Value is not null)
        {
            return File(result.Value.Content, result.Value.ContentType, result.Value.FileName);
        }

        return ToActionResult(result);
    }

    private ActionResult ToActionResult<T>(ResearchFormServiceResult<T> result)
    {
        if (result.Status == ResearchFormServiceStatus.Success && result.Value is not null)
        {
            return Ok(result.Value);
        }

        return result.Status switch
        {
            ResearchFormServiceStatus.InvalidRequest => BadRequest(new { title = "Invalid Request", detail = result.Message }),
            ResearchFormServiceStatus.Unauthorized => Unauthorized(new { title = "Unauthorized", detail = result.Message }),
            ResearchFormServiceStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, new { title = "Forbidden", detail = result.Message }),
            ResearchFormServiceStatus.NotFound => NotFound(new { title = "Not Found", detail = result.Message }),
            ResearchFormServiceStatus.Conflict => Conflict(new { title = "Conflict", detail = result.Message }),
            ResearchFormServiceStatus.ExternalError => StatusCode(StatusCodes.Status502BadGateway, new { title = "Bad Gateway", detail = result.Message }),
            _ => BadRequest()
        };
    }
}
