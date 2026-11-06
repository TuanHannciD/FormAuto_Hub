using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/generation-history")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class GenerationHistoryController(IGenerationHistoryService history) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<GenerationHistoryPageResponse>> GetMine(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        Response.Headers.CacheControl = "no-store";
        if (page < 1 || pageSize is < 1 or > 20)
            return BadRequest(new ProblemDetails { Title = "Invalid pagination", Status = 400 });
        return Ok(await history.GetMineAsync(page, pageSize, cancellationToken));
    }

    [HttpGet("{batchId:guid}")]
    public async Task<ActionResult<GenerationHistoryDetailResponse>> GetDetail(Guid batchId, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var detail = await history.GetDetailAsync(batchId, cancellationToken);
        return detail is null ? NotFound() : Ok(detail);
    }
}
