using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers.Nckh;

[ApiController]
[Route("api/v1/nckh")]
[Authorize]
public sealed class ResearchVariablesController(
    IResearchFormService researchFormService,
    ICurrentUserContext currentUser) : ControllerBase
{
    [HttpPost("models/{modelId:guid}/variables")]
    public async Task<ActionResult<NckhVariableResponse>> CreateVariable(
        Guid modelId,
        NckhCreateVariableRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchFormService.CreateVariableAsync(currentUser.UserId, modelId, request, cancellationToken);
        return result.Status == ResearchFormServiceStatus.Success && result.Value is not null
            ? CreatedAtAction(nameof(ListVariables), new { modelId }, result.Value)
            : ToActionResult(result);
    }

    [HttpGet("models/{modelId:guid}/variables")]
    public async Task<ActionResult<NckhVariableListResponse>> ListVariables(
        Guid modelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await researchFormService.ListVariablesAsync(currentUser.UserId, modelId, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("variables/{variableId:guid}")]
    public async Task<ActionResult<NckhVariableResponse>> UpdateVariable(
        Guid variableId,
        NckhUpdateVariableRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchFormService.UpdateVariableAsync(currentUser.UserId, variableId, request, cancellationToken);
        return ToActionResult(result);
    }

    [HttpDelete("variables/{variableId:guid}")]
    public async Task<IActionResult> DeleteVariable(
        Guid variableId,
        CancellationToken cancellationToken)
    {
        var result = await researchFormService.DeleteVariableAsync(currentUser.UserId, variableId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost("variables/{variableId:guid}/mappings")]
    public async Task<ActionResult<NckhMappingResponse>> CreateMapping(
        Guid variableId,
        NckhCreateMappingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchFormService.CreateMappingAsync(currentUser.UserId, variableId, request, cancellationToken);
        return result.Status == ResearchFormServiceStatus.Success && result.Value is not null
            ? CreatedAtAction(nameof(ListVariableMappings), new { variableId }, result.Value)
            : ToActionResult(result);
    }

    [HttpGet("variables/{variableId:guid}/mappings")]
    public async Task<ActionResult<NckhMappingListResponse>> ListVariableMappings(
        Guid variableId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await researchFormService.ListVariableMappingsAsync(currentUser.UserId, variableId, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("models/{modelId:guid}/mappings")]
    public async Task<ActionResult<NckhMappingListResponse>> ListModelMappings(
        Guid modelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await researchFormService.ListModelMappingsAsync(currentUser.UserId, modelId, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("mappings/{mappingId:guid}")]
    public async Task<ActionResult<NckhMappingResponse>> UpdateMapping(
        Guid mappingId,
        NckhUpdateMappingRequest request,
        CancellationToken cancellationToken)
    {
        var result = await researchFormService.UpdateMappingAsync(currentUser.UserId, mappingId, request, cancellationToken);
        return ToActionResult(result);
    }

    [HttpDelete("mappings/{mappingId:guid}")]
    public async Task<IActionResult> DeleteMapping(
        Guid mappingId,
        CancellationToken cancellationToken)
    {
        var result = await researchFormService.DeleteMappingAsync(currentUser.UserId, mappingId, cancellationToken);
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
