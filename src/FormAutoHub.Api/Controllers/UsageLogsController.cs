using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/usage-logs")]
public sealed class UsageLogsController(IUsageLogService usageLogService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UsageLogListResponse>> GetMine(CancellationToken cancellationToken) =>
        Ok(await usageLogService.GetMineAsync(cancellationToken));

    [HttpGet("recent")]
    public async Task<ActionResult<UsageLogListResponse>> GetRecentMine(CancellationToken cancellationToken) =>
        Ok(await usageLogService.GetRecentMineAsync(cancellationToken));
}
