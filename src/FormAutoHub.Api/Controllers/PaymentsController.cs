using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
public sealed class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [Authorize]
    [HttpPost("api/topup-orders/payos")]
    public async Task<ActionResult<CreatePayosTopupOrderResponse>> CreatePayosTopupOrder(
        CreatePayosTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        var result = await paymentService.CreatePayosTopupOrderAsync(request, cancellationToken);
        return result.Success && result.Value is not null ? Ok(result.Value) : Conflict(result.ErrorMessage);
    }

    [HttpPost("api/payments/payos/webhook")]
    public async Task<ActionResult<PayosWebhookResponse>> HandlePayosWebhook(
        PayosWebhookRequest request,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.HandlePayosWebhookAsync(request, cancellationToken);
        return Ok(response);
    }
}
