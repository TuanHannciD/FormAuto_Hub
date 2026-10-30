using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using FormAutoHub.Api.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FormAutoHub.DbCompatibility;

internal static class Program
{
    private static readonly JsonSerializerOptions Json = new() { WriteIndented = true };

    private static async Task<int> Main(string[] args)
    {
        try { return await RunAsync(args); }
        catch (Exception error)
        {
            // Technical failure remains failure (exit 1); never continue or call it compatible.
            // SQL text/values and connection strings are deliberately not printed.
            Console.Error.WriteLine(JsonSerializer.Serialize(new { state = "technical-error", error = error.GetType().Name,
                message = error.Message, sqlErrors = error is SqlException sql
                    ? sql.Errors.Cast<SqlError>().Select(x => new { x.Number, x.State, x.Class, x.Procedure, x.LineNumber, x.Message }).ToArray()
                    : null }, Json));
            return 1;
        }
    }

    private static async Task<int> RunAsync(string[] args)
    {
        var values = Parse(args);
        string Required(string name) => values.TryGetValue(name, out var value) ? value : throw new ArgumentException("Missing " + name);
        var commit = Required("--source-commit");
        if (!Regex.IsMatch(commit, "\\A[0-9a-f]{40}\\z")) throw new ArgumentException("Expected full source commit.");
        if (values.TryGetValue("--write-scripts", out var scriptDirectory))
        {
            if (values.Count != 2) throw new ArgumentException("Offline script export accepts only --write-scripts and --source-commit.");
            OfflineScripts.Write(scriptDirectory, commit);
            return 0;
        }
        var server = Required("--server");
        var database = Required("--database");
        var localNames = new[] { ".", "localhost", Environment.MachineName };
        if (!localNames.Contains(server.Split('\\')[0], StringComparer.OrdinalIgnoreCase) || server.Contains(';'))
            throw new ArgumentException("Only an explicit local SQL Server instance is allowed.");
        if (string.IsNullOrWhiteSpace(database) || new[] { "master", "model", "msdb", "tempdb" }.Contains(database, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException("An explicit application or owned test database is required.");

        var connectionString = new SqlConnectionStringBuilder { DataSource = server, InitialCatalog = database,
            IntegratedSecurity = true, TrustServerCertificate = true, ConnectTimeout = 15, ApplicationName = "FormAutoHub.DbCompatibility.ReadOnly" }.ConnectionString;
        await using var context = new FormAutoHubDbContext(new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseSqlServer(connectionString, x => x.CommandTimeout(30)).Options);
        await context.Database.OpenConnectionAsync();
        var connection = (SqlConnection)context.Database.GetDbConnection();
        var identity = await CatalogReader.IdentityAsync(connection);
        var expectedServer = server is "." or "localhost" ? Environment.MachineName : server;
        if (!identity.Machine.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase) ||
            !identity.Server.Equals(expectedServer, StringComparison.OrdinalIgnoreCase) ||
            !identity.Database.Equals(database, StringComparison.Ordinal))
            throw new InvalidOperationException("Actual SQL target identity differs from explicit local target.");

        var current = context.Database.GetMigrations().ToArray();
        var applied = (await context.Database.GetAppliedMigrationsAsync()).ToArray();
        var pending = (await context.Database.GetPendingMigrationsAsync()).ToArray();
        var modelPending = context.Database.HasPendingModelChanges();
        var catalog = await CatalogReader.ReadAsync(connection);
        // Missing columns remain classified by the catalog policy; do not query nonexistent objects.
        var canReadLengths = new[] { "OriginalFileName", "ContentType" }.All(name =>
            catalog.Any(x => x.Key == "column:dbo.TopupOrderEvidenceFiles." + name));
        var sizes = canReadLengths ? await CatalogReader.OversizeCountsAsync(connection) : (Names: 0L, ContentTypes: 0L);
        var migrator = context.GetService<IMigrator>();
        var chainHash = Hash(migrator.GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent));
        var previous = current.TakeWhile(x => x != CompatibilityPolicy.PlannedMigration).Last();
        var plannedHash = Hash(migrator.GenerateScript(previous, CompatibilityPolicy.PlannedMigration));
        var assemblyHash = Convert.ToHexStringLower(SHA256.HashData(await File.ReadAllBytesAsync(typeof(FormAutoHubDbContext).Assembly.Location)));

        if (values.TryGetValue("--capture-baseline", out var output))
        {
            if (values.ContainsKey("--baseline") || values.ContainsKey("--mode") || values.ContainsKey("--planned-sha256"))
                throw new ArgumentException("Baseline capture cannot be combined with verification options.");
            if (database != "FormAutoHub_FAHERR001_clean_20261029_a19f7a2" ||
                pending.Length != 0 || modelPending || !applied.SequenceEqual(current, StringComparer.Ordinal) ||
                catalog.Any(x => x.Key.Contains("IX_TopupOrderEvidenceFiles_TopupOrderId", StringComparison.Ordinal) ||
                                 x.Key.Contains("IX_TopupOrderEvidenceFiles_UserId_TopupOrderId", StringComparison.Ordinal)))
                throw new InvalidOperationException("Baseline must be an owned clean current-chain database, without legacy extras or pending/model changes.");
            AssertCanonicalEvidence(catalog);
            var modelDifferences = BaselineModelGuard.Compare(context, catalog);
            if (modelDifferences.Length != 0)
                throw new InvalidOperationException("Clean-chain baseline differs from current relational model: " + string.Join("; ", modelDifferences));
            var baseline = new SchemaBaseline("clean-current-chain", commit, chainHash,
                Hash(JsonSerializer.Serialize(catalog)), identity.Server, database, identity.Collation, current, catalog);
            // CreateNew preserves any previous evidence; operator supplies a unique path.
            await using var file = new FileStream(output, FileMode.CreateNew, FileAccess.Write);
            await JsonSerializer.SerializeAsync(file, baseline, Json);
            Console.WriteLine(JsonSerializer.Serialize(new { state = "baseline-captured", identity.Server, identity.Database,
                identity.Collation, sourceCommit = commit, chainHash, plannedHash, assemblyHash, current, applied, pending, modelPending }, Json));
            return 0;
        }

        var mode = values.GetValueOrDefault("--mode", "post-sync");
        var baselineBytes = await File.ReadAllBytesAsync(Required("--baseline"));
        var expectedBaselineHash = Required("--baseline-sha256");
        if (!Convert.ToHexStringLower(SHA256.HashData(baselineBytes)).Equals(expectedBaselineHash, StringComparison.Ordinal))
            throw new InvalidOperationException("Baseline file hash differs from reviewed manifest.");
        var expected = JsonSerializer.Deserialize<SchemaBaseline>(baselineBytes) ?? throw new InvalidOperationException("Baseline missing.");
        if (expected.Origin != "clean-current-chain" || expected.SourceCommit != commit || expected.ChainSha256 != chainHash ||
            expected.CatalogSha256 != Hash(JsonSerializer.Serialize(expected.Catalog)) ||
            expected.Collation != identity.Collation || !expected.Current.SequenceEqual(current, StringComparer.Ordinal))
            throw new InvalidOperationException("Baseline provenance/source chain/collation does not match.");
        AssertCanonicalEvidence(expected.Catalog);
        if (mode == "pre-sync" && Required("--planned-sha256") != plannedHash)
            throw new InvalidOperationException("Planned migration SQL hash differs from reviewed manifest.");

        var result = CompatibilityPolicy.Evaluate(mode, current, applied, pending, modelPending, expected.Catalog, catalog,
            sizes.Names, sizes.ContentTypes);
        Console.WriteLine(JsonSerializer.Serialize(new { state = result.State, mode, identity.Server, identity.Database,
            identity.Collation, sourceCommit = commit, chainHash, plannedHash, assemblyHash, baselineSha256 = expectedBaselineHash,
            current, applied, pending, historyOnly = applied.Except(current, StringComparer.Ordinal), modelPending,
            oversizeFileNames = sizes.Names, oversizeContentTypes = sizes.ContentTypes,
            blocking = result.Blocking, information = result.Information, rawDifferences = result.RawDifferences }, Json));
        return result.Blocking.Length == 0 ? 0 : 2;
    }

    private static void AssertCanonicalEvidence(CatalogObject[] catalog)
    {
        foreach (var (name, bytes) in new[] { ("OriginalFileName", 400), ("ContentType", 100) })
        {
            var column = catalog.Single(x => x.Key == "column:dbo.TopupOrderEvidenceFiles." + name);
            var shape = JsonNode.Parse(column.Signature)!;
            if (shape["type"]?.GetValue<string>() != "nvarchar" || shape["maxLength"]?.GetValue<int>() != bytes ||
                shape["nullable"]?.GetValue<bool>() != false)
                throw new InvalidOperationException("Baseline evidence column is not canonical: " + name);
        }
    }

    private static Dictionary<string, string> Parse(string[] args)
    {
        string[] allowed = ["--server", "--database", "--source-commit", "--baseline", "--baseline-sha256", "--mode", "--planned-sha256", "--capture-baseline", "--write-scripts"];
        if (args.Length % 2 != 0) throw new ArgumentException("Expected explicit option/value pairs.");
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        for (var i = 0; i < args.Length; i += 2)
            if (!allowed.Contains(args[i], StringComparer.Ordinal) || !result.TryAdd(args[i], args[i + 1]))
                throw new ArgumentException("Unknown or duplicate option: " + args[i]);
        return result;
    }

    private static string Hash(string text) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(text)));
}
