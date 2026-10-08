using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/credit-operations")]
public sealed class AdminCreditOperationsController(AdminCreditOperationsService service) : ControllerBase
{
    [HttpGet("users")]
    public async Task<ActionResult<AdminCreditUserOptionListResponse>> Users([FromQuery] string? search, CancellationToken ct) =>
        Ok(await service.SearchAsync(search, ct));

    [HttpGet("manual-grants")]
    public async Task<ActionResult<ManualCreditHistoryResponse>> History(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await service.HistoryAsync(search, page, pageSize, ct));

    [HttpPost("manual-grants")]
    public async Task<ActionResult<ManualCreditGrantResponse>> Grant(ManualCreditGrantRequest request, CancellationToken ct)
    {
        try
        {
            var result = await service.GrantAsync(request, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Title = ex.Message }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new ProblemDetails { Title = "Số dư vừa thay đổi. Hãy tải lại trước khi cộng credit." }); }
    }
}
