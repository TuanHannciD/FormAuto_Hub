using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public sealed class TopupEvidenceService(FormAutoHubDbContext db, ICurrentUserContext currentUser)
{
    public const int MaxBytes = 5 * 1024 * 1024;

    public async Task<UploadTopupEvidenceResponse> UploadAsync(string fileName, byte[] content, CancellationToken ct)
    {
        if (content.Length == 0 || content.Length > MaxBytes)
            throw new ArgumentException("Ảnh minh chứng phải có dung lượng từ 1 byte đến 5 MB.");
        var type = DetectType(content);
        if (type is null) throw new ArgumentException("Chỉ nhận ảnh PNG, JPEG hoặc WebP.");
        var safeName = Path.GetFileName(fileName.Replace('\\', '/'));
        if (string.IsNullOrWhiteSpace(safeName)) safeName = "minh-chung";
        var evidence = new TopupEvidence
        {
            Id = Guid.NewGuid(), UserId = currentUser.UserId,
            FileName = safeName[..Math.Min(safeName.Length, 200)], ContentType = type,
            Content = content, Length = content.LongLength, CreatedAt = DateTimeOffset.UtcNow
        };
        db.TopupEvidence.Add(evidence);
        await db.SaveChangesAsync(ct);
        return new(evidence.Id, evidence.FileName, type, content.LongLength, evidence.CreatedAt);
    }

    public Task<TopupEvidence?> GetMineAsync(Guid id, CancellationToken ct) =>
        db.TopupEvidence.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.UserId == currentUser.UserId, ct);

    public Task<TopupEvidence?> GetAttachedAsync(Guid id, CancellationToken ct) =>
        db.TopupEvidence.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && db.TopupOrders.Any(o => o.EvidenceFileId == id && o.PaymentMethod == "Manual"), ct);

    private static string? DetectType(byte[] bytes)
    {
        if (bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (bytes.Length >= 3 && bytes[0] == 255 && bytes[1] == 216 && bytes[2] == 255) return "image/jpeg";
        if (bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
