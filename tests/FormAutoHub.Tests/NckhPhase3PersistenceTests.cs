using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Tests;

public sealed class NckhPhase3PersistenceTests
{
    [Fact]
    public void ModelRelation_HasApprovedIndexesAndDeleteBehaviors()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ModelRelation));

        Assert.NotNull(entity);
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(ModelRelation.ModelId),
                nameof(ModelRelation.FromVariableId),
                nameof(ModelRelation.ToVariableId)
            }));
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(ModelRelation.ModelId),
                nameof(ModelRelation.HypothesisCode)
            }));

        var modelForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(ModelRelation.ModelId));
        Assert.Equal(DeleteBehavior.Cascade, modelForeignKey.DeleteBehavior);

        var fromForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(ModelRelation.FromVariableId));
        Assert.Equal(DeleteBehavior.Restrict, fromForeignKey.DeleteBehavior);

        var toForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(ModelRelation.ToVariableId));
        Assert.Equal(DeleteBehavior.Restrict, toForeignKey.DeleteBehavior);
    }

    [Fact]
    public void NodePosition_HasApprovedFilteredIndexesPrecisionAndDeleteBehaviors()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(NodePosition));

        Assert.NotNull(entity);
        Assert.Equal("decimal(18,2)", entity.FindProperty(nameof(NodePosition.PositionX))!.GetColumnType());
        Assert.Equal("decimal(18,2)", entity.FindProperty(nameof(NodePosition.PositionY))!.GetColumnType());
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.GetFilter() == "[VariableId] IS NOT NULL"
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(NodePosition.ModelId),
                nameof(NodePosition.NodeType),
                nameof(NodePosition.VariableId)
            }));
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.GetFilter() == "[RelationId] IS NOT NULL"
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(NodePosition.ModelId),
                nameof(NodePosition.NodeType),
                nameof(NodePosition.RelationId)
            }));

        var modelForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(NodePosition.ModelId));
        Assert.Equal(DeleteBehavior.Restrict, modelForeignKey.DeleteBehavior);

        var variableForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(NodePosition.VariableId));
        Assert.Equal(DeleteBehavior.Restrict, variableForeignKey.DeleteBehavior);

        var relationForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(NodePosition.RelationId));
        Assert.Equal(DeleteBehavior.Cascade, relationForeignKey.DeleteBehavior);
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=FormAutoHub_MetadataOnly;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;

        return new FormAutoHubDbContext(options);
    }
}


