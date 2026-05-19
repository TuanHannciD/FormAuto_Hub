using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/packages")]
public sealed class PackagesController(IPackageService packageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CreditPackageResponse>>> GetPackages(CancellationToken cancellationToken) =>
        Ok(await packageService.GetActivePackagesAsync(cancellationToken));
}
