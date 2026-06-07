using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchCanvasService
{
    Task<ResearchFormServiceResult<NckhRelationResponse>> CreateRelationAsync(
        Guid userId, Guid modelId, NckhCreateRelationRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRelationListResponse>> ListRelationsAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRelationResponse>> GetRelationAsync(
        Guid userId, Guid relationId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhRelationResponse>> UpdateRelationAsync(
        Guid userId, Guid relationId, NckhUpdateRelationRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteRelationAsync(
        Guid userId, Guid relationId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhPositionListResponse>> ListPositionsAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhPositionListResponse>> SavePositionsAsync(
        Guid userId, Guid modelId, NckhSavePositionsRequest request, CancellationToken cancellationToken);
}

public sealed class ResearchCanvasService(FormAutoHubDbContext dbContext) : IResearchCanvasService
{
    private const string DraftStatus = "Draft";
    private const string PositiveDirection = "Positive";
    private const string NegativeDirection = "Negative";
    private const string VariableNodeType = "Variable";
    private const string RelationNodeType = "Relation";

    public async Task<ResearchFormServiceResult<NckhRelationResponse>> CreateRelationAsync(
        Guid userId,
        Guid modelId,
        NckhCreateRelationRequest request,
        CancellationToken cancellationToken)
    {
        var model = await LoadOwnedModelAsync(userId, modelId, trackChanges: false, cancellationToken);
        if (model is null)
        {
            return NotFound<NckhRelationResponse>();
        }

        var validation = await ValidateRelationPayloadAsync(model, null, request.FromVariableId, request.ToVariableId, request.Direction, cancellationToken);
        if (validation is not null)
        {
            return validation;
        }

        var fromVariable = await dbContext.ResearchVariables.SingleAsync(item => item.Id == request.FromVariableId, cancellationToken);
        var toVariable = await dbContext.ResearchVariables.SingleAsync(item => item.Id == request.ToVariableId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var relation = new ModelRelation
        {
            Id = Guid.NewGuid(),
            ModelId = model.Id,
            FromVariableId = fromVariable.Id,
            ToVariableId = toVariable.Id,
            Direction = NormalizeDirection(request.Direction),
            SortOrder = request.SortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.ModelRelations.Add(relation);
        await RegenerateHypothesesAsync(model.Id, relation, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        relation.FromVariable = fromVariable;
        relation.ToVariable = toVariable;
        return Success(ToRelationResponse(relation));
    }

    public async Task<ResearchFormServiceResult<NckhRelationListResponse>> ListRelationsAsync(
        Guid userId,
        Guid modelId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var modelExists = await dbContext.ResearchModels
            .AnyAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);
        if (!modelExists)
        {
            return NotFound<NckhRelationListResponse>();
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.ModelRelations
            .AsNoTracking()
            .Include(item => item.FromVariable)
            .Include(item => item.ToVariable)
            .Where(item => item.ModelId == modelId);

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await query
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => ToRelationResponse(item))
            .ToListAsync(cancellationToken);

        return Success(new NckhRelationListResponse(items, page, pageSize, totalItems, totalPages));
    }

    public async Task<ResearchFormServiceResult<NckhRelationResponse>> GetRelationAsync(
        Guid userId,
        Guid relationId,
        CancellationToken cancellationToken)
    {
        var relation = await LoadOwnedRelationAsync(userId, relationId, trackChanges: false, cancellationToken);
        return relation is null ? NotFound<NckhRelationResponse>() : Success(ToRelationResponse(relation));
    }

    public async Task<ResearchFormServiceResult<NckhRelationResponse>> UpdateRelationAsync(
        Guid userId,
        Guid relationId,
        NckhUpdateRelationRequest request,
        CancellationToken cancellationToken)
    {
        var relation = await LoadOwnedRelationAsync(userId, relationId, trackChanges: true, cancellationToken);
        if (relation is null)
        {
            return NotFound<NckhRelationResponse>();
        }

        var validation = await ValidateRelationPayloadAsync(
            relation.Model,
            relation.Id,
            request.FromVariableId,
            request.ToVariableId,
            request.Direction,
            cancellationToken);
        if (validation is not null)
        {
            return validation;
        }

        var fromVariable = await dbContext.ResearchVariables.SingleAsync(item => item.Id == request.FromVariableId, cancellationToken);
        var toVariable = await dbContext.ResearchVariables.SingleAsync(item => item.Id == request.ToVariableId, cancellationToken);
        relation.FromVariableId = fromVariable.Id;
        relation.ToVariableId = toVariable.Id;
        relation.Direction = NormalizeDirection(request.Direction);
        relation.SortOrder = request.SortOrder;
        relation.UpdatedAt = DateTimeOffset.UtcNow;

        await RegenerateHypothesesAsync(relation.ModelId, null, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        relation.FromVariable = fromVariable;
        relation.ToVariable = toVariable;
        return Success(ToRelationResponse(relation));
    }

    public async Task<ResearchFormServiceResult<bool>> DeleteRelationAsync(
        Guid userId,
        Guid relationId,
        CancellationToken cancellationToken)
    {
        var relation = await LoadOwnedRelationAsync(userId, relationId, trackChanges: true, cancellationToken);
        if (relation is null)
        {
            return NotFound<bool>();
        }

        if (relation.Model.Status != DraftStatus)
        {
            return Invalid<bool>("Relations can be edited only while the model is Draft.");
        }

        dbContext.ModelRelations.Remove(relation);
        await dbContext.SaveChangesAsync(cancellationToken);
        await RegenerateHypothesesAsync(relation.ModelId, null, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Success(true);
    }

    public async Task<ResearchFormServiceResult<NckhPositionListResponse>> ListPositionsAsync(
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var modelExists = await dbContext.ResearchModels
            .AnyAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);
        if (!modelExists)
        {
            return NotFound<NckhPositionListResponse>();
        }

        var items = await dbContext.NodePositions
            .AsNoTracking()
            .Where(item => item.ModelId == modelId)
            .OrderBy(item => item.NodeType)
            .ThenBy(item => item.UpdatedAt)
            .Select(item => ToPositionResponse(item))
            .ToListAsync(cancellationToken);

        return Success(new NckhPositionListResponse(items));
    }

    public async Task<ResearchFormServiceResult<NckhPositionListResponse>> SavePositionsAsync(
        Guid userId,
        Guid modelId,
        NckhSavePositionsRequest request,
        CancellationToken cancellationToken)
    {
        var model = await LoadOwnedModelAsync(userId, modelId, trackChanges: false, cancellationToken);
        if (model is null)
        {
            return NotFound<NckhPositionListResponse>();
        }

        if (model.Status != DraftStatus)
        {
            return Invalid<NckhPositionListResponse>("Node positions can be edited only while the model is Draft.");
        }

        if (request.Positions is null)
        {
            return Invalid<NckhPositionListResponse>("Positions are required.");
        }

        var duplicateKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var now = DateTimeOffset.UtcNow;
        foreach (var item in request.Positions)
        {
            var normalizedNodeType = NormalizeNodeType(item.NodeType);
            if (normalizedNodeType is null)
            {
                return Invalid<NckhPositionListResponse>("NodeType must be Variable or Relation.");
            }

            var targetValidation = await ValidatePositionTargetAsync(model.Id, normalizedNodeType, item.VariableId, item.RelationId, cancellationToken);
            if (targetValidation is not null)
            {
                return targetValidation;
            }

            var key = normalizedNodeType == VariableNodeType
                ? $"{VariableNodeType}:{item.VariableId}"
                : $"{RelationNodeType}:{item.RelationId}";
            if (!duplicateKeys.Add(key))
            {
                return Conflict<NckhPositionListResponse>("Duplicate node position in request.");
            }

            var existing = normalizedNodeType == VariableNodeType
                ? await dbContext.NodePositions.SingleOrDefaultAsync(
                    position => position.ModelId == model.Id && position.NodeType == VariableNodeType && position.VariableId == item.VariableId,
                    cancellationToken)
                : await dbContext.NodePositions.SingleOrDefaultAsync(
                    position => position.ModelId == model.Id && position.NodeType == RelationNodeType && position.RelationId == item.RelationId,
                    cancellationToken);

            if (existing is null)
            {
                dbContext.NodePositions.Add(new NodePosition
                {
                    Id = Guid.NewGuid(),
                    ModelId = model.Id,
                    NodeType = normalizedNodeType,
                    VariableId = normalizedNodeType == VariableNodeType ? item.VariableId : null,
                    RelationId = normalizedNodeType == RelationNodeType ? item.RelationId : null,
                    PositionX = RoundCoordinate(item.PositionX),
                    PositionY = RoundCoordinate(item.PositionY),
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
            else
            {
                existing.PositionX = RoundCoordinate(item.PositionX);
                existing.PositionY = RoundCoordinate(item.PositionY);
                existing.UpdatedAt = now;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await ListPositionsAsync(userId, modelId, cancellationToken);
    }

    private async Task<ResearchFormServiceResult<NckhRelationResponse>?> ValidateRelationPayloadAsync(
        ResearchModel model,
        Guid? currentRelationId,
        Guid fromVariableId,
        Guid toVariableId,
        string direction,
        CancellationToken cancellationToken)
    {
        if (model.Status != DraftStatus)
        {
            return Invalid<NckhRelationResponse>("Relations can be edited only while the model is Draft.");
        }

        if (!IsValidDirection(direction))
        {
            return Invalid<NckhRelationResponse>("Direction must be Positive or Negative.");
        }

        if (fromVariableId == Guid.Empty || toVariableId == Guid.Empty)
        {
            return Invalid<NckhRelationResponse>("FromVariableId and ToVariableId are required.");
        }

        if (fromVariableId == toVariableId)
        {
            return Invalid<NckhRelationResponse>("Self-relation is not allowed.");
        }

        var variables = await dbContext.ResearchVariables
            .AsNoTracking()
            .Where(item => item.Id == fromVariableId || item.Id == toVariableId)
            .ToListAsync(cancellationToken);
        if (variables.Count != 2 || variables.Any(item => item.ModelId != model.Id))
        {
            return Invalid<NckhRelationResponse>("Both variables must belong to the same model.");
        }

        var duplicateQuery = dbContext.ModelRelations.Where(item =>
            item.ModelId == model.Id
            && item.FromVariableId == fromVariableId
            && item.ToVariableId == toVariableId);
        if (currentRelationId is not null)
        {
            duplicateQuery = duplicateQuery.Where(item => item.Id != currentRelationId.Value);
        }

        if (await duplicateQuery.AnyAsync(cancellationToken))
        {
            return Conflict<NckhRelationResponse>("This directed relation already exists in the model.");
        }

        return null;
    }

    private async Task<ResearchFormServiceResult<NckhPositionListResponse>?> ValidatePositionTargetAsync(
        Guid modelId,
        string nodeType,
        Guid? variableId,
        Guid? relationId,
        CancellationToken cancellationToken)
    {
        if (nodeType == VariableNodeType)
        {
            if (variableId is null || variableId == Guid.Empty || relationId is not null)
            {
                return Invalid<NckhPositionListResponse>("Variable node positions require only VariableId.");
            }

            var variableExists = await dbContext.ResearchVariables
                .AnyAsync(item => item.Id == variableId.Value && item.ModelId == modelId, cancellationToken);
            return variableExists ? null : Invalid<NckhPositionListResponse>("Variable position must reference a variable in the same model.");
        }

        if (relationId is null || relationId == Guid.Empty || variableId is not null)
        {
            return Invalid<NckhPositionListResponse>("Relation node positions require only RelationId.");
        }

        var relationExists = await dbContext.ModelRelations
            .AnyAsync(item => item.Id == relationId.Value && item.ModelId == modelId, cancellationToken);
        return relationExists ? null : Invalid<NckhPositionListResponse>("Relation position must reference a relation in the same model.");
    }

    private async Task RegenerateHypothesesAsync(Guid modelId, ModelRelation? pendingRelation, CancellationToken cancellationToken)
    {
        var relations = await dbContext.ModelRelations
            .Include(item => item.FromVariable)
            .Include(item => item.ToVariable)
            .Where(item => item.ModelId == modelId)
            .ToListAsync(cancellationToken);

        if (pendingRelation is not null && relations.All(item => item.Id != pendingRelation.Id))
        {
            relations.Add(pendingRelation);
        }

        var ordered = relations
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.CreatedAt)
            .ToList();

        for (var index = 0; index < ordered.Count; index++)
        {
            var relation = ordered[index];
            relation.HypothesisCode = $"H{index + 1}";
            relation.HypothesisText = relation.Direction == PositiveDirection
                ? $"{relation.FromVariable.Name} có ảnh hưởng tiêu cực đến {relation.ToVariable.Name}"
                : $"{relation.FromVariable.Name} có ảnh hưởng tiêu cực đến {relation.ToVariable.Name}";
            relation.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    private Task<ResearchModel?> LoadOwnedModelAsync(
        Guid userId,
        Guid modelId,
        bool trackChanges,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ResearchModels.Where(item => item.Id == modelId && item.UserId == userId);
        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return query.SingleOrDefaultAsync(cancellationToken);
    }

    private Task<ModelRelation?> LoadOwnedRelationAsync(
        Guid userId,
        Guid relationId,
        bool trackChanges,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ModelRelations
            .Include(item => item.Model)
            .Include(item => item.FromVariable)
            .Include(item => item.ToVariable)
            .Where(item => item.Id == relationId && item.Model.UserId == userId);
        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return query.SingleOrDefaultAsync(cancellationToken);
    }

    private static NckhRelationResponse ToRelationResponse(ModelRelation relation)
    {
        return new NckhRelationResponse(
            relation.Id,
            relation.ModelId,
            relation.FromVariableId,
            relation.FromVariable.Name,
            relation.FromVariable.Code,
            relation.ToVariableId,
            relation.ToVariable.Name,
            relation.ToVariable.Code,
            relation.Direction,
            relation.HypothesisCode,
            relation.HypothesisText,
            relation.SortOrder,
            relation.CreatedAt,
            relation.UpdatedAt);
    }

    private static NckhPositionResponse ToPositionResponse(NodePosition position)
    {
        return new NckhPositionResponse(
            position.Id,
            position.NodeType,
            position.VariableId,
            position.RelationId,
            position.PositionX,
            position.PositionY,
            position.UpdatedAt);
    }

    private static bool IsValidDirection(string direction)
    {
        return string.Equals(direction?.Trim(), PositiveDirection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(direction?.Trim(), NegativeDirection, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeDirection(string direction)
    {
        return string.Equals(direction.Trim(), PositiveDirection, StringComparison.OrdinalIgnoreCase)
            ? PositiveDirection
            : NegativeDirection;
    }

    private static string? NormalizeNodeType(string nodeType)
    {
        if (string.Equals(nodeType?.Trim(), VariableNodeType, StringComparison.OrdinalIgnoreCase))
        {
            return VariableNodeType;
        }

        if (string.Equals(nodeType?.Trim(), RelationNodeType, StringComparison.OrdinalIgnoreCase))
        {
            return RelationNodeType;
        }

        return null;
    }

    private static decimal RoundCoordinate(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    private static ResearchFormServiceResult<T> Success<T>(T value)
    {
        return new ResearchFormServiceResult<T>(ResearchFormServiceStatus.Success, value);
    }

    private static ResearchFormServiceResult<T> Invalid<T>(string message)
    {
        return new ResearchFormServiceResult<T>(ResearchFormServiceStatus.InvalidRequest, Message: message);
    }

    private static ResearchFormServiceResult<T> NotFound<T>()
    {
        return new ResearchFormServiceResult<T>(ResearchFormServiceStatus.NotFound);
    }

    private static ResearchFormServiceResult<T> Conflict<T>(string message)
    {
        return new ResearchFormServiceResult<T>(ResearchFormServiceStatus.Conflict, Message: message);
    }
}

