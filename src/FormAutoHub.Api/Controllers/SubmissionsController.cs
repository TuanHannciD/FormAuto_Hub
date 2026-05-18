using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/submissions")]
public sealed class SubmissionsController(ISubmissionService submissionService) : ControllerBase
{
    [HttpPost("send")]
    public async Task<ActionResult<SubmissionJobResponse>> Send(
        Guid projectId,
        SendSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await submissionService.SendAsync(projectId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "Submission rejected", Detail = exception.Message });
        }
    }

    [HttpGet("jobs/{jobId:guid}")]
    public async Task<ActionResult<SubmissionJobResponse>> GetJob(
        Guid projectId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var response = await submissionService.GetJobAsync(projectId, jobId, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("jobs/{jobId:guid}/cancel")]
    public async Task<ActionResult<SubmissionJobResponse>> Cancel(
        Guid projectId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var response = await submissionService.CancelAsync(projectId, jobId, cancellationToken);
        return response is null ? Conflict() : Ok(response);
    }

    [HttpPost("jobs/{jobId:guid}/pause")]
    public async Task<ActionResult<SubmissionJobResponse>> Pause(
        Guid projectId,
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var response = await submissionService.PauseAsync(projectId, jobId, cancellationToken);
        return response is null ? Conflict() : Ok(response);
    }
}
