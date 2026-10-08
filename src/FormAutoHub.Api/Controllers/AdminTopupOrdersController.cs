using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/topup-orders")]
public sealed class AdminTopupOrdersController(
    IAdminTopupOrderService adminTopupOrderService,
    ICurrentUserContext currentUser,
    TopupEvidenceService evidenceService)
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

    [HttpGet("manual")]
    public async Task<ActionResult<IReadOnlyList<AdminTopupOrderResponse>>> GetManual(CancellationToken ct) =>
        Ok(await adminTopupOrderService.GetManualAsync(ct));

    [HttpGet("evidence/{id:guid}")]
    public async Task<IActionResult> GetEvidence(Guid id, CancellationToken ct)
    {
        var evidence = await evidenceService.GetAttachedAsync(id, ct);
        if (evidence is null) return NotFound();
        Response.Headers.CacheControl = "no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(evidence.Content, evidence.ContentType);
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

        try
        {
            var response = await adminTopupOrderService.ApproveAsync(id, request, cancellationToken);
            return response is null ? Conflict(new ProblemDetails { Title = "Đơn không còn chờ duyệt hoặc không phải đơn thủ công." }) : Ok(response);
        }
        catch (DbUpdateConcurrencyException) { return Conflict(new ProblemDetails { Title = "Đơn hoặc số dư vừa thay đổi. Hãy tải lại trước khi xử lý." }); }
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

        try
        {
            var response = await adminTopupOrderService.RejectAsync(id, request, cancellationToken);
            return response is null ? Conflict(new ProblemDetails { Title = "Đơn không còn chờ xử lý hoặc không phải đơn thủ công." }) : Ok(response);
        }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Title = ex.Message }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new ProblemDetails { Title = "Đơn vừa thay đổi. Hãy tải lại trước khi xử lý." }); }
    }
}
