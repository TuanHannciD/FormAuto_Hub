using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/answer-rules")]
public sealed class AnswerRulesController(IAnswerRuleService answerRuleService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<AnswerRuleResponse>> Create(
        Guid projectId,
        UpsertAnswerRuleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await answerRuleService.CreateAsync(projectId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "Answer rule rejected", Detail = exception.Message });
        }
    }

    [HttpPut("{ruleId:guid}")]
    public async Task<ActionResult<AnswerRuleResponse>> Update(
        Guid projectId,
        Guid ruleId,
        UpsertAnswerRuleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await answerRuleService.UpdateAsync(projectId, ruleId, request, cancellationToken);
            return response is null ? NotFound() : Ok(response);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new ProblemDetails { Title = "Answer rule rejected", Detail = exception.Message });
        }
    }
}
