using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers.Nckh;

[ApiController]
[Route("api/v1/nckh")]
[Authorize]
public sealed class ResearchCanvasController(
    IResearchCanvasService researchCanvasService,
    ICurrentUserContext currentUser) : ControllerBase
{
    [HttpPost("models/{modelId:guid}/relations")]
    public async Task<ActionResult<NckhRelationResponse>> CreateRelation(
        Guid modelId,
        NckhCreateRelationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchCanvasService.CreateRelationAsync(currentUser.UserId, modelId, request, cancellationToken);
        return result.Status == ResearchFormServiceStatus.Success && result.Value is not null
            ? CreatedAtAction(nameof(GetRelation), new { relationId = result.Value.Id }, result.Value)
            : ToActionResult(result);
    }

    [HttpGet("models/{modelId:guid}/relations")]
    public async Task<ActionResult<NckhRelationListResponse>> ListRelations(
        Guid modelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await researchCanvasService.ListRelationsAsync(currentUser.UserId, modelId, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("relations/{relationId:guid}")]
    public async Task<ActionResult<NckhRelationResponse>> GetRelation(
        Guid relationId,
        CancellationToken cancellationToken)
    {
        var result = await researchCanvasService.GetRelationAsync(currentUser.UserId, relationId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("relations/{relationId:guid}")]
    public async Task<ActionResult<NckhRelationResponse>> UpdateRelation(
        Guid relationId,
        NckhUpdateRelationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchCanvasService.UpdateRelationAsync(currentUser.UserId, relationId, request, cancellationToken);
        return ToActionResult(result);
    }

    [HttpDelete("relations/{relationId:guid}")]
    public async Task<IActionResult> DeleteRelation(
        Guid relationId,
        CancellationToken cancellationToken)
    {
        var result = await researchCanvasService.DeleteRelationAsync(currentUser.UserId, relationId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("models/{modelId:guid}/positions")]
    public async Task<ActionResult<NckhPositionListResponse>> ListPositions(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await researchCanvasService.ListPositionsAsync(currentUser.UserId, modelId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("models/{modelId:guid}/positions")]
    public async Task<ActionResult<NckhPositionListResponse>> SavePositions(
        Guid modelId,
        NckhSavePositionsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchCanvasService.SavePositionsAsync(currentUser.UserId, modelId, request, cancellationToken);
        return ToActionResult(result);
    }

    private ActionResult<T> ToActionResult<T>(ResearchFormServiceResult<T> result)
    {
        if (result.Status == ResearchFormServiceStatus.Success && result.Value is not null)
        {
            return Ok(result.Value);
        }

        return result.Status switch
        {
            ResearchFormServiceStatus.InvalidRequest => BadRequest(new { title = "Invalid Request", detail = result.Message }),
            ResearchFormServiceStatus.Unauthorized => Unauthorized(new { title = "Unauthorized", detail = result.Message }),
            ResearchFormServiceStatus.NotFound => NotFound(new { title = "Not Found", detail = result.Message }),
            ResearchFormServiceStatus.Conflict => Conflict(new { title = "Conflict", detail = result.Message }),
            _ => BadRequest()
        };
    }

    private IActionResult ToActionResult(ResearchFormServiceResult<bool> result)
    {
        return result.Status switch
        {
            ResearchFormServiceStatus.Success => NoContent(),
            ResearchFormServiceStatus.InvalidRequest => BadRequest(new { title = "Invalid Request", detail = result.Message }),
            ResearchFormServiceStatus.Unauthorized => Unauthorized(new { title = "Unauthorized", detail = result.Message }),
            ResearchFormServiceStatus.NotFound => NotFound(new { title = "Not Found", detail = result.Message }),
            ResearchFormServiceStatus.Conflict => Conflict(new { title = "Conflict", detail = result.Message }),
            _ => BadRequest()
        };
    }
}
