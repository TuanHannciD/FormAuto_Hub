using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Route("api/forms")]
public sealed class FormsController(IFormProjectService formProjectService) : ControllerBase
{
    [HttpPost("analyze")]
    public async Task<ActionResult<AnalyzeFormResponse>> Analyze(
        AnalyzeFormRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await formProjectService.AnalyzeAsync(request, cancellationToken));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "Form analysis failed", Detail = exception.Message });
        }
    }

    [HttpGet("{projectId:guid}/questions")]
    public async Task<ActionResult<FormQuestionListResponse>> GetQuestions(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await formProjectService.GetQuestionsAsync(projectId, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}
