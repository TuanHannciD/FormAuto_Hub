using System.Text.Json;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities;

namespace FormAutoHub.Api.Services;

internal static class AuditLogWriter
{
    public static void Add(
        FormAutoHubDbContext dbContext,
        Guid userId,
        string action,
        string targetType,
        Guid? targetId,
        object metadata)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            MetadataJson = JsonSerializer.Serialize(metadata),
            CreatedAt = DateTimeOffset.UtcNow
        });
    }
}
