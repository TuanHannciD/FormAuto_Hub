using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class AiAnalyticsController(IAiAnalyticsService aiAnalyticsService) : ControllerBase
{
    [HttpGet("ai-usage")]
    public async Task<ActionResult<AiUsageStatsResponse>> GetMyAiUsage(CancellationToken cancellationToken) =>
        Ok(await aiAnalyticsService.GetMyStatsAsync(cancellationToken));
}

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public sealed class AdminAiAnalyticsController(IAiAnalyticsService aiAnalyticsService) : ControllerBase
{
    [HttpGet("ai-usage")]
    public async Task<ActionResult<AdminAiUsageStatsResponse>> GetAdminAiUsage(CancellationToken cancellationToken) =>
        Ok(await aiAnalyticsService.GetAdminStatsAsync(cancellationToken));

    [HttpGet("ai-usage/runs")]
    public async Task<ActionResult<PagedAiRunResponse>> GetAdminAiRuns(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? mode = null,
        [FromQuery] string? provider = null,
        [FromQuery] string? model = null,
        [FromQuery] DateTimeOffset? fromDate = null,
        [FromQuery] DateTimeOffset? toDate = null,
        CancellationToken cancellationToken = default) =>
        Ok(await aiAnalyticsService.GetAdminRunsAsync(
            page, pageSize, status, mode, provider, model,
            fromDate, toDate, cancellationToken));
}
