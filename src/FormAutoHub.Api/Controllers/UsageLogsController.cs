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
    public async Task<ActionResult<UsageLogPageResponse>> GetMine(
        [FromQuery] string? action,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await usageLogService.GetMineAsync(new UsageLogQuery(action, search, page, pageSize), cancellationToken));

    [HttpGet("recent")]
    public async Task<ActionResult<UsageLogListResponse>> GetRecentMine(CancellationToken cancellationToken) =>
        Ok(await usageLogService.GetRecentMineAsync(cancellationToken));
}
