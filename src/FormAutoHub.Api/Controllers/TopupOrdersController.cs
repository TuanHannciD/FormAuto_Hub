using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/topup-orders")]
public sealed class TopupOrdersController(ITopupOrderService topupOrderService, TopupEvidenceService evidenceService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TopupOrderResponse>> Create(
        CreateTopupOrderRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await topupOrderService.CreateAsync(request, cancellationToken);
            return response is null ? NotFound() : CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Title = ex.Message }); }
    }

    [HttpPost("evidence")]
    [RequestSizeLimit(TopupEvidenceService.MaxBytes + 65536)]
    public async Task<ActionResult<UploadTopupEvidenceResponse>> UploadEvidence(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0 || file.Length > TopupEvidenceService.MaxBytes)
            return BadRequest(new ProblemDetails { Title = "Ảnh minh chứng tối đa 5 MB và không được rỗng." });
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, ct);
        try { return Ok(await evidenceService.UploadAsync(file.FileName, stream.ToArray(), ct)); }
        catch (ArgumentException ex) { return BadRequest(new ProblemDetails { Title = ex.Message }); }
    }

    [HttpGet("evidence/{id:guid}")]
    public async Task<IActionResult> GetEvidence(Guid id, CancellationToken ct)
    {
        var evidence = await evidenceService.GetMineAsync(id, ct);
        if (evidence is null) return NotFound();
        Response.Headers.CacheControl = "no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(evidence.Content, evidence.ContentType);
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
        try
        {
            var response = await topupOrderService.CancelAsync(id, cancellationToken);
            return response is null ? Conflict() : Ok(response);
        }
        catch (DbUpdateConcurrencyException) { return Conflict(new ProblemDetails { Title = "Đơn vừa được xử lý. Hãy tải lại trước khi hủy." }); }
    }
}
