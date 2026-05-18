using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Route("api/admin/topup-orders")]
public sealed class AdminTopupOrdersController(
    IAdminTopupOrderService adminTopupOrderService,
    ICurrentUserContext currentUser)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminTopupOrderResponse>>> GetAll(CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        return Ok(await adminTopupOrderService.GetAllAsync(cancellationToken));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<ApproveTopupOrderResponse>> Approve(
        Guid id,
        ApproveTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await adminTopupOrderService.ApproveAsync(id, request, cancellationToken);
        return response is null ? Conflict() : Ok(response);
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<RejectTopupOrderResponse>> Reject(
        Guid id,
        RejectTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (!currentUser.IsAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var response = await adminTopupOrderService.RejectAsync(id, request, cancellationToken);
        return response is null ? Conflict() : Ok(response);
    }
}
