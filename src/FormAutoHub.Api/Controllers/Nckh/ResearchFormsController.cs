using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services.Nckh;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers.Nckh;

[ApiController]
[Route("api/v1/nckh")]
[Authorize]
public sealed class ResearchFormsController(IResearchFormService researchFormService) : ControllerBase
{
    [HttpPost("auth/google-link")]
    public async Task<ActionResult<NckhGoogleLinkResponse>> LinkGoogle(
        NckhGoogleLinkRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await researchFormService.LinkGoogleAsync(userId, request, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost("forms/import")]
    public async Task<ActionResult<NckhImportFormResponse>> ImportForm(
        NckhImportFormRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await researchFormService.ImportFormAsync(userId, request, cancellationToken);
        return result.Status switch
        {
            ResearchFormServiceStatus.Success => CreatedAtAction(nameof(GetFormDetail), new { formId = result.Value?.Id }, result.Value),
            _ => ToActionResult(result)
        };
    }

    [HttpGet("forms")]
    public async Task<ActionResult<NckhFormListResponse>> ListForms(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var result = await researchFormService.ListFormsAsync(userId, status, page, pageSize, cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("forms/{formId:guid}")]
    public async Task<ActionResult<NckhFormDetailResponse>> GetFormDetail(
        Guid formId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await researchFormService.GetFormDetailAsync(userId, formId, cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost("models/{modelId:guid}/generate-form")]
    public async Task<ActionResult<NckhGenerateFormResponse>> GenerateForm(
        Guid modelId,
        NckhGenerateFormRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await researchFormService.GenerateFormAsync(userId, modelId, request, cancellationToken);
        return ToActionResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("sub")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var userId) ? userId : Guid.Empty;
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
            ResearchFormServiceStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, new { title = "Forbidden", detail = result.Message }),
            ResearchFormServiceStatus.NotFound => NotFound(new { title = "Not Found", detail = result.Message }),
            ResearchFormServiceStatus.Conflict => Conflict(new { title = "Conflict", detail = result.Message }),
            ResearchFormServiceStatus.ExternalError => StatusCode(StatusCodes.Status502BadGateway, new { title = "Bad Gateway", detail = result.Message }),
            _ => BadRequest()
        };
    }
}
