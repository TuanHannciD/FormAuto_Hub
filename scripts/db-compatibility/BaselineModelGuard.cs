using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using FormAutoHub.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;

namespace FormAutoHub.DbCompatibility;

public static class BaselineModelGuard
{
    // Clean-chain catalog remains the authority for chain-created defaults and filters.
    // Independently reject a baseline with missing/extra tables/columns or wrong model storage.
    public static string[] Compare(FormAutoHubDbContext context, CatalogObject[] catalog)
    {
        var model = context.GetService<IDesignTimeModel>().Model.GetRelationalModel();
        var actual = catalog.ToDictionary(x => x.Key, StringComparer.Ordinal);
        HashSet<string> tables = ["table:dbo.__EFMigrationsHistory"];
        HashSet<string> columns = [];
        List<string> differences = [];
        foreach (var table in model.Tables)
        {
            var tableName = (table.Schema ?? "dbo") + "." + table.Name;
            tables.Add("table:" + tableName);
            if (!actual.ContainsKey("table:" + tableName)) differences.Add("Missing table " + tableName);
            foreach (var column in table.Columns)
            {
                var key = "column:" + tableName + "." + column.Name;
                columns.Add(key);
                if (!actual.TryGetValue(key, out var found)) { differences.Add("Missing " + key); continue; }
                var shape = JsonNode.Parse(found.Signature)!;
                var parsed = Regex.Match(column.StoreType, "\\A(?<type>\\w+)(?:\\((?<size>max|\\d+)(?:,(?<scale>\\d+))?\\))?\\z");
                var type = parsed.Groups["type"].Value;
                if (type == "rowversion") type = "timestamp";
                var matches = parsed.Success && shape["type"]?.GetValue<string>() == type &&
                    shape["typeSchema"]?.GetValue<string>() == "sys" && shape["nullable"]?.GetValue<bool>() == column.IsNullable;
                var size = parsed.Groups["size"].Value;
                if (type is "nvarchar" or "nchar" or "varchar" or "char" or "varbinary" or "binary")
                    matches &= size != "" && shape["maxLength"]?.GetValue<int>() ==
                        (size == "max" ? -1 : int.Parse(size) * (type is "nvarchar" or "nchar" ? 2 : 1));
                if (type is "decimal" or "numeric")
                    matches &= shape["precision"]?.GetValue<int>() == int.Parse(size) &&
                        shape["scale"]?.GetValue<int>() == int.Parse(parsed.Groups["scale"].Value);
                if (type is "datetimeoffset" or "datetime2" or "time")
                    matches &= shape["scale"]?.GetValue<int>() == (size == "" ? 7 : int.Parse(size));
                if (type == "timestamp") matches &= shape["maxLength"]?.GetValue<int>() == 8;
                if (!matches) differences.Add("Wrong model storage " + key);
            }
        }
        differences.AddRange(catalog.Where(x => x.Key.StartsWith("table:", StringComparison.Ordinal) && !tables.Contains(x.Key))
            .Select(x => "Extra baseline " + x.Key));
        differences.AddRange(catalog.Where(x => x.Key.StartsWith("column:", StringComparison.Ordinal) &&
            !x.Key.StartsWith("column:dbo.__EFMigrationsHistory.", StringComparison.Ordinal) && !columns.Contains(x.Key))
            .Select(x => "Extra baseline " + x.Key));
        return [.. differences];
    }
}
