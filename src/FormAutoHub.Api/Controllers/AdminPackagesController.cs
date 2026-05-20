using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/packages")]
public sealed class AdminPackagesController(IPackageService packageService, ICurrentUserContext currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CreditPackageListResponse>> GetPackages(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await packageService.GetAdminPackagesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<CreditPackageResponse>> CreatePackage(
        CreateCreditPackageRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await packageService.CreateAdminPackageAsync(request, cancellationToken);
        return Created($"/api/admin/packages/{response!.Id}", response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CreditPackageResponse>> UpdatePackage(
        Guid id,
        UpdateCreditPackageRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await packageService.UpdateAdminPackageAsync(id, request, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }
}
