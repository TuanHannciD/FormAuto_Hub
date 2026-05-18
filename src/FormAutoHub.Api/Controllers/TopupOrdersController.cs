using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Route("api/topup-orders")]
public sealed class TopupOrdersController(ITopupOrderService topupOrderService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TopupOrderResponse>> Create(
        CreateTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        var response = await topupOrderService.CreateAsync(request, cancellationToken);
        return response is null ? NotFound() : CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<TopupOrderListResponse>> GetMine(CancellationToken cancellationToken) =>
        Ok(await topupOrderService.GetMineAsync(cancellationToken));

    [HttpGet("recent")]
    public async Task<ActionResult<TopupOrderListResponse>> GetRecentMine(CancellationToken cancellationToken) =>
        Ok(await topupOrderService.GetRecentMineAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TopupOrderResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await topupOrderService.GetMineByIdAsync(id, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<CancelTopupOrderResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var response = await topupOrderService.CancelAsync(id, cancellationToken);
        return response is null ? Conflict() : Ok(response);
    }
}
