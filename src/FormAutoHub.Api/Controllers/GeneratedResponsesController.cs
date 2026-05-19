using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects/{projectId:guid}/responses")]
public sealed class GeneratedResponsesController(IResponseGenerationService responseGenerationService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateResponsesResponse>> Generate(
        Guid projectId,
        GenerateResponsesRequest request,
        CancellationToken cancellationToken)
    {
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
        CancellationToken cancellationToken)
    {
        var response = await responseGenerationService.GetProjectResponsesAsync(projectId, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}
