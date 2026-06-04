using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers.Nckh;

[ApiController]
[Route("api/v1/nckh/models")]
[Authorize]
public sealed class ResearchModelsController : ControllerBase
{
    private readonly ICurrentUserContext _currentUser;
    private readonly IResearchModelService _researchModelService;

    public ResearchModelsController(IResearchModelService researchModelService, ICurrentUserContext currentUser)
    {
        _currentUser = currentUser;
        _researchModelService = researchModelService;
    }

    [HttpPost]
    public async Task<ActionResult<NckhResearchModelResponse>> CreateModel(
        NckhCreateResearchModelRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _researchModelService.CreateModelAsync(_currentUser.UserId, request, cancellationToken);
        return result.Status switch
        {
            ResearchFormServiceStatus.Success => CreatedAtAction(
                nameof(GetModel),
                new { modelId = result.Value?.Id },
                result.Value),
            _ => ToActionResult(result)
        };
    }

    [HttpGet]
    public async Task<ActionResult<NckhResearchModelListResponse>> ListModels(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _researchModelService.ListModelsAsync(
            _currentUser.UserId,
            status,
            page,
            pageSize,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpGet("{modelId:guid}")]
    public async Task<ActionResult<NckhResearchModelResponse>> GetModel(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await _researchModelService.GetModelAsync(_currentUser.UserId, modelId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("{modelId:guid}")]
    public async Task<ActionResult<NckhResearchModelResponse>> UpdateModel(
        Guid modelId,
        NckhUpdateResearchModelRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _researchModelService.UpdateModelAsync(_currentUser.UserId, modelId, request, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost("{modelId:guid}/activate")]
    public async Task<ActionResult<NckhResearchModelResponse>> ActivateModel(
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var result = await _researchModelService.ActivateModelAsync(_currentUser.UserId, modelId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpDelete("{modelId:guid}")]
    public async Task<ActionResult<bool>> DeleteModel(Guid modelId, CancellationToken cancellationToken)
    {
        var result = await _researchModelService.DeleteModelAsync(_currentUser.UserId, modelId, cancellationToken);
        if (result.Status == ResearchFormServiceStatus.Success)
        {
            return NoContent();
        }

        return ToErrorActionResult(result);
    }

    private ActionResult<T> ToActionResult<T>(ResearchFormServiceResult<T> result)
    {
        if (result.Status == ResearchFormServiceStatus.Success && result.Value is not null)
        {
            return Ok(result.Value);
        }

        return ToErrorActionResult(result);
    }

    private ActionResult<T> ToErrorActionResult<T>(ResearchFormServiceResult<T> result)
    {
        return result.Status switch
        {
            ResearchFormServiceStatus.InvalidRequest => BadRequest(new { title = "Invalid Request", detail = result.Message }),
            ResearchFormServiceStatus.Unauthorized => Unauthorized(new { title = "Unauthorized", detail = result.Message }),
            ResearchFormServiceStatus.NotFound => NotFound(new { title = "Not Found", detail = result.Message }),
            ResearchFormServiceStatus.Conflict => Conflict(new { title = "Conflict", detail = result.Message }),
            _ => BadRequest()
        };
    }
}
