using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public sealed class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> Get(CancellationToken cancellationToken)
    {
        var response = await profileService.GetAsync(cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPut]
    public async Task<ActionResult<UpdateProfileResponse>> Update(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.UpdateAsync(request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPut("change-password")]
    public async Task<ActionResult<ChangePasswordResponse>> ChangePassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.ChangePasswordAsync(request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}
