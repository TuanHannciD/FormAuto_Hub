using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services.Nckh;

public interface IResearchModelService
{
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> CreateModelAsync(
        Guid userId, NckhCreateResearchModelRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelListResponse>> ListModelsAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> GetModelAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> UpdateModelAsync(
        Guid userId, Guid modelId, NckhUpdateResearchModelRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhResearchModelResponse>> ActivateModelAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteModelAsync(
        Guid userId, Guid modelId, CancellationToken cancellationToken);
}

public sealed class ResearchModelService(FormAutoHubDbContext dbContext) : IResearchModelService
{
    private const string DraftStatus = "Draft";
    private const string ActiveStatus = "Active";

    public async Task<ResearchFormServiceResult<NckhResearchModelResponse>> CreateModelAsync(
        Guid userId,
        NckhCreateResearchModelRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim();
        if (request.FormId == Guid.Empty || string.IsNullOrWhiteSpace(name))
        {
            return Invalid<NckhResearchModelResponse>("FormId and name are required.");
        }

        var form = await dbContext.ResearchForms
            .SingleOrDefaultAsync(item => item.Id == request.FormId && item.UserId == userId, cancellationToken);

        if (form is null)
        {
            return new ResearchFormServiceResult<NckhResearchModelResponse>(
                ResearchFormServiceStatus.NotFound,
                Message: "Imported form not found.");
        }

        var now = DateTimeOffset.UtcNow;
        var model = new ResearchModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FormId = form.Id,
            Name = name,
            Description = NormalizeOptional(request.Description),
            Status = DraftStatus,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.ResearchModels.Add(model);
        await dbContext.SaveChangesAsync(cancellationToken);

        model.Form = form;
        return Success(ToResponse(model, form.Title, 0, hasGeneratedForm: false));
    }

    public async Task<ResearchFormServiceResult<NckhResearchModelListResponse>> ListModelsAsync(
        Guid userId,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        if (!IsValidOptionalStatus(status))
        {
            return Invalid<NckhResearchModelListResponse>("Status must be Draft or Active.");
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.ResearchModels
            .AsNoTracking()
            .Where(item => item.UserId == userId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(item => item.Status == status);
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new NckhResearchModelResponse(
                item.Id,
                item.FormId,
                item.Name,
                item.Description,
                item.Status,
                item.Form.Title,
                item.Variables.Count,
                dbContext.ResearchForms.Any(form =>
                    form.UserId == userId
                    && form.GeneratedFromModelId == item.Id
                    && form.GenerationSource == "Generated"),
                item.CreatedAt,
                item.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhResearchModelListResponse>(
            ResearchFormServiceStatus.Success,
            new NckhResearchModelListResponse(items, page, pageSize, totalItems, totalPages));
    }

    public async Task<ResearchFormServiceResult<NckhResearchModelResponse>> GetModelAsync(
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await LoadOwnedModel(userId, modelId, trackChanges: false, cancellationToken);
        if (model is null)
        {
            return NotFound<NckhResearchModelResponse>();
        }

        return Success(ToResponse(model, model.Form.Title, model.Variables.Count, await HasGeneratedFormAsync(userId, model.Id, cancellationToken)));
    }

    public async Task<ResearchFormServiceResult<NckhResearchModelResponse>> UpdateModelAsync(
        Guid userId,
        Guid modelId,
        NckhUpdateResearchModelRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return Invalid<NckhResearchModelResponse>("Name is required.");
        }

        var model = await LoadOwnedModel(userId, modelId, trackChanges: true, cancellationToken);
        if (model is null)
        {
            return NotFound<NckhResearchModelResponse>();
        }

        model.Name = name;
        model.Description = NormalizeOptional(request.Description);
        model.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Success(ToResponse(model, model.Form.Title, model.Variables.Count, await HasGeneratedFormAsync(userId, model.Id, cancellationToken)));
    }

    public async Task<ResearchFormServiceResult<NckhResearchModelResponse>> ActivateModelAsync(
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await LoadOwnedModel(userId, modelId, trackChanges: true, cancellationToken);
        if (model is null)
        {
            return NotFound<NckhResearchModelResponse>();
        }

        if (model.Status == ActiveStatus)
        {
            return Success(ToResponse(model, model.Form.Title, model.Variables.Count, await HasGeneratedFormAsync(userId, model.Id, cancellationToken)));
        }

        if (model.Status != DraftStatus)
        {
            return Invalid<NckhResearchModelResponse>("Only Draft models can be activated.");
        }

        var activeExists = await dbContext.ResearchModels.AnyAsync(
            item => item.FormId == model.FormId && item.Status == ActiveStatus && item.Id != model.Id,
            cancellationToken);

        if (activeExists)
        {
            return new ResearchFormServiceResult<NckhResearchModelResponse>(
                ResearchFormServiceStatus.Conflict,
                Message: "Another active model already exists for this imported form.");
        }

        model.Status = ActiveStatus;
        model.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Success(ToResponse(model, model.Form.Title, model.Variables.Count, await HasGeneratedFormAsync(userId, model.Id, cancellationToken)));
    }

    public async Task<ResearchFormServiceResult<bool>> DeleteModelAsync(
        Guid userId,
        Guid modelId,
        CancellationToken cancellationToken)
    {
        var model = await dbContext.ResearchModels
            .Include(item => item.Variables)
            .ThenInclude(item => item.ObservedQuestionMappings)
            .SingleOrDefaultAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);

        if (model is null)
        {
            return NotFound<bool>();
        }

        dbContext.ResearchModels.Remove(model);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Success(true);
    }

    private Task<ResearchModel?> LoadOwnedModel(
        Guid userId,
        Guid modelId,
        bool trackChanges,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ResearchModels
            .Include(item => item.Form)
            .Include(item => item.Variables)
            .Where(item => item.Id == modelId && item.UserId == userId);

        if (!trackChanges)
        {
            query = query.AsNoTracking();
        }

        return query.SingleOrDefaultAsync(cancellationToken);
    }

    private Task<bool> HasGeneratedFormAsync(Guid userId, Guid modelId, CancellationToken cancellationToken)
    {
        return dbContext.ResearchForms.AnyAsync(
            item => item.UserId == userId
                && item.GeneratedFromModelId == modelId
                && item.GenerationSource == "Generated",
            cancellationToken);
    }

    private static NckhResearchModelResponse ToResponse(ResearchModel model, string formTitle, int variableCount, bool hasGeneratedForm)
    {
        return new NckhResearchModelResponse(
            model.Id,
            model.FormId,
            model.Name,
            model.Description,
            model.Status,
            formTitle,
            variableCount,
            hasGeneratedForm,
            model.CreatedAt,
            model.UpdatedAt);
    }

    private static bool IsValidOptionalStatus(string? status)
    {
        return string.IsNullOrWhiteSpace(status)
            || status == DraftStatus
            || status == ActiveStatus;
    }

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
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
}
