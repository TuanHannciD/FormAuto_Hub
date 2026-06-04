using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace FormAutoHub.Tests;

public sealed class NckhPhase2PersistenceTests
{
    [Fact]
    public void ResearchModel_HasFilteredUniqueActiveModelPerFormIndex()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ResearchModel));

        Assert.NotNull(entity);
        var index = Assert.Single(entity.GetIndexes(), item =>
            item.Properties.Select(property => property.Name).SequenceEqual(new[] { nameof(ResearchModel.FormId) }));

        Assert.True(index.IsUnique);
        Assert.Equal("[Status] = 'Active'", index.GetFilter());
    }

    [Fact]
    public void ResearchVariable_HasModelScopedCodeUniqueIndexAndCascadeDelete()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ResearchVariable));

        Assert.NotNull(entity);
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(ResearchVariable.ModelId),
                nameof(ResearchVariable.Code)
            }));

        var modelForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(ResearchVariable.ModelId));
        Assert.Equal(DeleteBehavior.Cascade, modelForeignKey.DeleteBehavior);
    }

    [Fact]
    public void ObservedQuestionMapping_HasApprovedUniqueIndexesAndDeleteBehaviors()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ObservedQuestionMapping));

        Assert.NotNull(entity);
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(ObservedQuestionMapping.VariableId),
                nameof(ObservedQuestionMapping.FormQuestionId)
            }));
        Assert.Contains(entity.GetIndexes(), item =>
            item.IsUnique
            && item.Properties.Select(property => property.Name).SequenceEqual(new[]
            {
                nameof(ObservedQuestionMapping.VariableId),
                nameof(ObservedQuestionMapping.ObservedCode)
            }));

        var variableForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(ObservedQuestionMapping.VariableId));
        Assert.Equal(DeleteBehavior.Cascade, variableForeignKey.DeleteBehavior);

        var questionForeignKey = Assert.Single(entity.GetForeignKeys(), item =>
            item.Properties.Single().Name == nameof(ObservedQuestionMapping.FormQuestionId));
        Assert.Equal(DeleteBehavior.Restrict, questionForeignKey.DeleteBehavior);
    }

    private static FormAutoHubDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FormAutoHubDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new FormAutoHubDbContext(options);
    }
}
