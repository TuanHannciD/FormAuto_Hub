namespace FormAutoHub.DbCompatibility;

public sealed record SchemaBaseline(string Origin, string SourceCommit, string ChainSha256,
    string CatalogSha256, string Server, string Database, string Collation, string[] Current, CatalogObject[] Catalog);
