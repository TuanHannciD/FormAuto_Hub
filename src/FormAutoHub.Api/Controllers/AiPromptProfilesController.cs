using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/projects/{projectId:guid}/ai-prompt-profile")]
public sealed class AiPromptProfilesController(IAiPromptProfileService promptProfileService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AiPromptProfileResponse>> Get(
        Guid projectId,
        [FromQuery] string mode = AiPromptProfileModes.Option2,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await promptProfileService.GetAsync(projectId, mode, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "AI prompt profile rejected", Detail = exception.Message });
        }
    }

    [HttpPut]
    public async Task<ActionResult<AiPromptProfileResponse>> Upsert(
        Guid projectId,
        UpsertAiPromptProfileRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await promptProfileService.UpsertProfileAsync(projectId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "AI prompt profile rejected", Detail = exception.Message });
        }
    }

    [HttpPut("questions/{questionId:guid}")]
    public async Task<ActionResult<AiQuestionPromptResponse>> UpsertQuestion(
        Guid projectId,
        Guid questionId,
        UpsertAiQuestionPromptRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await promptProfileService.UpsertQuestionPromptAsync(projectId, questionId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "AI question prompt rejected", Detail = exception.Message });
        }
    }

    [HttpPost("auto-fill")]
    public async Task<ActionResult<AiPromptAutoFillResponse>> AutoFill(
        Guid projectId,
        AiPromptAutoFillRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await promptProfileService.AutoFillAsync(projectId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "AI prompt auto-fill rejected", Detail = exception.Message });
        }
    }
}
