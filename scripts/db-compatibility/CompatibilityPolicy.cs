using System.Text.Json.Nodes;

namespace FormAutoHub.DbCompatibility;

public sealed record CatalogObject(string Key, string Signature);
public sealed record CompatibilityResult(string State, string[] Blocking, string[] Information, string[] RawDifferences);

public static class CompatibilityPolicy
{
    public const string PlannedMigration = "20261029142938_NormalizeTopupEvidenceColumnLengths";
    public const string LegacyMigration = "20260601083335_Phase10ManualCreditOperations";

    public static CompatibilityResult Evaluate(string mode, string[] current, string[] applied, string[] pending,
        bool modelPending, CatalogObject[] baseline, CatalogObject[] actual,
        long oversizeNames = 0, long oversizeContentTypes = 0)
    {
        List<string> blocking = [], information = [], differences = [];
        if (mode is not ("pre-sync" or "post-sync")) blocking.Add("Unknown verification mode.");
        if (modelPending) blocking.Add("EF HasPendingModelChanges is true.");
        if (oversizeNames != 0 || oversizeContentTypes != 0)
            blocking.Add($"Evidence exceeds canonical byte limits: filenameRows={oversizeNames}, contentTypeRows={oversizeContentTypes}.");
        if (!current.Contains(PlannedMigration, StringComparer.Ordinal)) blocking.Add("Planned migration is absent from source.");
        if (current.Distinct(StringComparer.Ordinal).Count() != current.Length ||
            applied.Distinct(StringComparer.Ordinal).Count() != applied.Length)
            blocking.Add("Duplicate migration identifiers.");

        var missing = current.Except(applied, StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
        if (!pending.Order(StringComparer.Ordinal).SequenceEqual(missing, StringComparer.Ordinal))
            blocking.Add("GetPendingMigrations disagrees with source/applied sets.");
        var plannedPending = pending.SequenceEqual([PlannedMigration], StringComparer.Ordinal) &&
            missing.SequenceEqual([PlannedMigration], StringComparer.Ordinal);
        if (mode == "pre-sync" && plannedPending)
            information.Add("Expected planned migration pending; this is authorization preflight, not compatibility.");
        else if (mode == "pre-sync" || pending.Length != 0 || missing.Length != 0)
            blocking.Add("Unexpected pending/missing current migrations: " + string.Join(",", missing));

        foreach (var extra in applied.Except(current, StringComparer.Ordinal))
        {
            if (extra == LegacyMigration) information.Add("Known legacy history retained: " + extra);
            else blocking.Add("Unknown history-only migration: " + extra);
        }

        var expected = baseline.ToDictionary(x => x.Key, StringComparer.Ordinal);
        var observed = actual.ToDictionary(x => x.Key, StringComparer.Ordinal);
        foreach (var item in expected.Values)
        {
            if (!observed.TryGetValue(item.Key, out var found))
            {
                differences.Add("Missing: " + item.Key);
                blocking.Add("Required object missing: " + item.Key);
            }
            else if (item.Signature != found.Signature)
            {
                differences.Add($"Changed {item.Key}: expected={item.Signature}; actual={found.Signature}");
                if (mode == "pre-sync" && plannedPending && IsPlannedMaxBaseline(item, found))
                    information.Add("Expected max column before planned sync: " + item.Key);
                else blocking.Add("Required shape differs: " + item.Key);
            }
        }
        foreach (var extra in observed.Values.Where(x => !expected.ContainsKey(x.Key)))
        {
            differences.Add($"Extra {extra.Key}: {extra.Signature}");
            if (IsKnownLegacyIndex(extra)) information.Add("Exact optional legacy index retained: " + extra.Key);
            else blocking.Add("Unknown extra object or wrong legacy index signature: " + extra.Key);
        }
        return new(blocking.Count > 0 ? "blocking" : mode == "pre-sync" ? "ready-for-planned-sync" : "compatible",
            [.. blocking], [.. information], [.. differences]);
    }

    private static bool IsPlannedMaxBaseline(CatalogObject expected, CatalogObject actual)
    {
        var bytes = expected.Key switch
        {
            "column:dbo.TopupOrderEvidenceFiles.OriginalFileName" => 400,
            "column:dbo.TopupOrderEvidenceFiles.ContentType" => 100,
            _ => 0
        };
        if (bytes == 0) return false;
        var expectedJson = JsonNode.Parse(expected.Signature)!;
        var actualJson = JsonNode.Parse(actual.Signature)!;
        if (expectedJson["maxLength"]?.GetValue<int>() != bytes || actualJson["maxLength"]?.GetValue<int>() != -1)
            return false;
        actualJson["maxLength"] = bytes;
        return JsonNode.DeepEquals(expectedJson, actualJson);
    }

    private static bool IsKnownLegacyIndex(CatalogObject item)
    {
        // Compare every captured signature field, not just a name or SQL substring.
        var expected = item.Key switch
        {
            "index:dbo.TopupOrderEvidenceFiles.IX_TopupOrderEvidenceFiles_TopupOrderId" =>
                """{"type":"NONCLUSTERED","unique":true,"primaryKey":false,"uniqueConstraint":false,"disabled":false,"hypothetical":false,"filter":"([TopupOrderId] IS NOT NULL)","columns":[{"name":"TopupOrderId","ordinal":1,"descending":false,"included":false}]}""",
            "index:dbo.TopupOrderEvidenceFiles.IX_TopupOrderEvidenceFiles_UserId_TopupOrderId" =>
                """{"type":"NONCLUSTERED","unique":false,"primaryKey":false,"uniqueConstraint":false,"disabled":false,"hypothetical":false,"filter":null,"columns":[{"name":"UserId","ordinal":1,"descending":false,"included":false},{"name":"TopupOrderId","ordinal":2,"descending":false,"included":false}]}""",
            _ => null
        };
        return expected is not null && JsonNode.DeepEquals(JsonNode.Parse(expected), JsonNode.Parse(item.Signature));
    }
}
