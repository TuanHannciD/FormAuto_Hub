using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Route("api/credit-transactions")]
public sealed class CreditTransactionsController(ICreditTransactionService creditTransactionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<CreditTransactionListResponse>> GetMine(CancellationToken cancellationToken) =>
        Ok(await creditTransactionService.GetMineAsync(cancellationToken));
}
