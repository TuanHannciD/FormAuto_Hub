using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects/{projectId:guid}/ai-responses")]
public sealed class AiResponsesController(IAiGenerationService generationService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<ActionResult<AiGenerateResponsesResponse>> Generate(
        Guid projectId,
        AiGenerateResponsesRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await generationService.GenerateAsync(projectId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "AI preview generation failed", Detail = exception.Message });
        }
    }
}
