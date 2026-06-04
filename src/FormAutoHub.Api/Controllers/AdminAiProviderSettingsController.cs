using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/ai-provider-settings")]
public sealed class AdminAiProviderSettingsController(
    IAiProviderSettingsService settingsService,
    ICurrentUserContext currentUser)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AiProviderSettingsResponse>> Get(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await settingsService.GetAsync(cancellationToken));
    }

    [HttpPut]
    public async Task<ActionResult<AiProviderSettingsResponse>> Update(
        UpdateAiProviderSettingsRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        try
        {
            return Ok(await settingsService.UpdateAsync(request, cancellationToken));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new ProblemDetails { Title = "AI provider settings rejected", Detail = exception.Message });
        }
    }

    [HttpPost("check")]
    public async Task<ActionResult<CheckAiProviderSettingsResponse>> Check(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await settingsService.CheckAsync(cancellationToken));
    }
}
