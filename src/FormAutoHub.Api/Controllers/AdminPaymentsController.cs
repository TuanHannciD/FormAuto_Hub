using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin")]
public sealed class AdminPaymentsController(
    IAdminPaymentReportService reportService,
    IPaymentProviderSettingsService settingsService,
    ICurrentUserContext currentUser)
    : ControllerBase
{
    [HttpGet("revenue/summary")]
    public async Task<ActionResult<AdminRevenueSummaryResponse>> GetRevenueSummary(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await reportService.GetRevenueSummaryAsync(cancellationToken));
    }

    [HttpGet("payments")]
    public async Task<ActionResult<AdminPaymentListResponse>> GetPayments(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await reportService.GetPaymentsAsync(cancellationToken));
    }

    [HttpGet("payments/{id:guid}")]
    public async Task<ActionResult<AdminPaymentResponse>> GetPayment(Guid id, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await reportService.GetPaymentByIdAsync(id, cancellationToken);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpGet("payment-providers/payos")]
    public async Task<ActionResult<PayosProviderSettingsResponse>> GetPayosSettings(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await settingsService.GetPayosAsync(cancellationToken));
    }

    [HttpPut("payment-providers/payos")]
    public async Task<ActionResult<PayosProviderSettingsResponse>> UpdatePayosSettings(
        UpdatePayosProviderSettingsRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await settingsService.UpdatePayosAsync(request, cancellationToken));
    }

    [HttpPost("payment-providers/payos/check")]
    public async Task<ActionResult<CheckPayosProviderSettingsResponse>> CheckPayosSettings(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await settingsService.CheckPayosAsync(cancellationToken));
    }
}
