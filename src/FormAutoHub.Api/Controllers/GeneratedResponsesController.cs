using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[Route("api/projects/{projectId:guid}/responses")]
public sealed class GeneratedResponsesController(IResponseGenerationService responseGenerationService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateResponsesResponse>> Generate(
        Guid projectId,
        GenerateResponsesRequest request,
        CancellationToken cancellationToken)
    {
        if (!await responseGenerationService.OwnsProjectAsync(projectId, cancellationToken)) return NotFound();
        if (GenerationContractFence.Check(this) is { } upgrade) return upgrade;
        try
        {
            var response = await responseGenerationService.GenerateAsync(projectId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "Preview generation failed", Detail = exception.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<GeneratedResponseListResponse>> GetProjectResponses(
        Guid projectId,
        [FromQuery] Guid[] ids,
        CancellationToken cancellationToken)
    {
        var response = await responseGenerationService.GetProjectResponsesAsync(projectId, ids, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}
