-- No business data or dynamic SQL. Default constraint names are system-generated;
-- their exact definitions and owning columns are captured instead.
IF HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION') <> 1
    THROW 51010, 'VIEW DEFINITION is required for a complete catalog comparison.', 1;

SELECT [Key], Signature FROM (
    SELECT N'table:' + SCHEMA_NAME(t.schema_id) + N'.' + t.name AS [Key],
        (SELECT t.temporal_type AS temporal, t.is_memory_optimized AS memoryOptimized,
            t.is_filetable AS fileTable, t.is_tracked_by_cdc AS cdc
         FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER) AS Signature
    FROM sys.tables t WHERE t.is_ms_shipped = 0
    UNION ALL
    SELECT N'column:' + SCHEMA_NAME(t.schema_id) + N'.' + t.name + N'.' + c.name,
        (SELECT ty.name AS [type], SCHEMA_NAME(ty.schema_id) AS typeSchema,
            c.max_length AS maxLength, c.precision AS [precision], c.scale AS scale,
            c.is_nullable AS nullable, c.is_identity AS [identity], c.is_computed AS computed,
            c.collation_name AS collation, c.is_sparse AS sparse, c.is_column_set AS columnSet,
            c.is_filestream AS filestream, c.is_hidden AS hidden,
            c.generated_always_type AS generated, c.encryption_type AS encryption,
            dc.definition AS [default], cc.definition AS computedSql,
            CONVERT(nvarchar(100), ic.seed_value) AS identitySeed,
            CONVERT(nvarchar(100), ic.increment_value) AS identityIncrement,
            c.rule_object_id AS ruleObjectId
         FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)
    FROM sys.tables t JOIN sys.columns c ON c.object_id = t.object_id
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
    LEFT JOIN sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
    LEFT JOIN sys.identity_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE t.is_ms_shipped = 0
    UNION ALL
    SELECT N'index:' + SCHEMA_NAME(t.schema_id) + N'.' + t.name + N'.' + i.name,
        (SELECT i.type_desc AS [type], i.is_unique AS [unique], i.is_primary_key AS primaryKey,
            i.is_unique_constraint AS uniqueConstraint, i.is_disabled AS disabled,
            i.is_hypothetical AS hypothetical, i.filter_definition AS filter,
            JSON_QUERY((SELECT c.name AS name, x.key_ordinal AS ordinal,
                x.is_descending_key AS descending, x.is_included_column AS included
                FROM sys.index_columns x JOIN sys.columns c
                  ON c.object_id = x.object_id AND c.column_id = x.column_id
                WHERE x.object_id = i.object_id AND x.index_id = i.index_id
                ORDER BY x.index_column_id FOR JSON PATH)) AS columns
         FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)
    FROM sys.tables t JOIN sys.indexes i ON i.object_id = t.object_id
    WHERE t.is_ms_shipped = 0 AND i.index_id > 0
    UNION ALL
    SELECT N'fk:' + SCHEMA_NAME(t.schema_id) + N'.' + t.name + N'.' + f.name,
        (SELECT SCHEMA_NAME(rt.schema_id) AS referencedSchema, rt.name AS referencedTable,
            f.delete_referential_action_desc AS deleteAction, f.update_referential_action_desc AS updateAction,
            f.is_disabled AS disabled, f.is_not_trusted AS untrusted,
            f.is_not_for_replication AS notForReplication,
            JSON_QUERY((SELECT pc.name AS name, rc.name AS referencedColumn, x.constraint_column_id AS ordinal
                FROM sys.foreign_key_columns x
                JOIN sys.columns pc ON pc.object_id = x.parent_object_id AND pc.column_id = x.parent_column_id
                JOIN sys.columns rc ON rc.object_id = x.referenced_object_id AND rc.column_id = x.referenced_column_id
                WHERE x.constraint_object_id = f.object_id ORDER BY x.constraint_column_id FOR JSON PATH)) AS columns
         FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)
    FROM sys.foreign_keys f JOIN sys.tables t ON t.object_id = f.parent_object_id
    JOIN sys.tables rt ON rt.object_id = f.referenced_object_id WHERE t.is_ms_shipped = 0
    UNION ALL
    SELECT N'check:' + SCHEMA_NAME(t.schema_id) + N'.' + t.name + N'.' + c.name,
        (SELECT c.definition AS definition, c.is_disabled AS disabled,
            c.is_not_trusted AS untrusted, c.is_not_for_replication AS notForReplication
         FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)
    FROM sys.check_constraints c JOIN sys.tables t ON t.object_id = c.parent_object_id WHERE t.is_ms_shipped = 0
    UNION ALL
    -- Anything else (views, triggers, procedures, functions, sequences, user types' constraints)
    -- is review-required rather than silently ignored. Parent table name is part of the key.
    SELECT N'object:' + SCHEMA_NAME(o.schema_id) + N'.' + COALESCE(OBJECT_NAME(o.parent_object_id) + N'.', N'') + o.name,
        (SELECT o.type AS [type], OBJECT_DEFINITION(o.object_id) AS definition
         FOR JSON PATH, INCLUDE_NULL_VALUES, WITHOUT_ARRAY_WRAPPER)
    FROM sys.objects o WHERE o.is_ms_shipped = 0 AND o.type NOT IN ('U', 'PK', 'UQ', 'F', 'C', 'D', 'IT', 'S')
) catalog ORDER BY [Key];
