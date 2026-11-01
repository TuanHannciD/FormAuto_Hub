using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FormAutoHub.DbCompatibility;

public static class OfflineScripts
{
    public static void Write(string directory, string sourceCommit)
    {
        using var context = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseSqlServer("Server=localhost;Database=OfflineScriptOnly;Integrated Security=true;TrustServerCertificate=true").Options);
        var current = context.Database.GetMigrations().ToArray();
        var previous = current.TakeWhile(x => x != CompatibilityPolicy.PlannedMigration).Last();
        var migrator = context.GetService<IMigrator>();
        var scripts = new Dictionary<string, string>
        {
            ["normalization-only.sql"] = migrator.GenerateScript(previous, CompatibilityPolicy.PlannedMigration),
            ["current-chain-idempotent.sql"] = migrator.GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent)
        };
        Directory.CreateDirectory(directory);
        foreach (var (name, script) in scripts)
        {
            using var output = new FileStream(Path.Combine(directory, name), FileMode.CreateNew, FileAccess.Write);
            output.Write(Encoding.UTF8.GetBytes(script));
        }
        var manifest = new { sourceCommit, migration = CompatibilityPolicy.PlannedMigration, previous,
            modelPending = context.Database.HasPendingModelChanges(), current,
            scripts = scripts.Select(x => new { file = x.Key, sha256 = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(x.Value))) }) };
        using var file = new FileStream(Path.Combine(directory, "sql-manifest.json"), FileMode.CreateNew, FileAccess.Write);
        JsonSerializer.Serialize(file, manifest, new JsonSerializerOptions { WriteIndented = true });
        Console.WriteLine(JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true }));
    }
}
