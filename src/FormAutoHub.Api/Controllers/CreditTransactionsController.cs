using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/credit-transactions")]
public sealed class CreditTransactionsController(ICreditTransactionService creditTransactionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CreditTransactionPageResponse>> GetMine(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await creditTransactionService.GetMineAsync(
            new CreditTransactionQuery(type, search, page, pageSize),
            cancellationToken));
}
