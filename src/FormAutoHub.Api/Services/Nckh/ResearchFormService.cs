using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace FormAutoHub.Api.Services.Nckh;

public enum ResearchFormServiceStatus
{
    Success,
    InvalidRequest,
    Unauthorized,
    NotFound,
    Conflict
}

public sealed record ResearchFormServiceResult<T>(ResearchFormServiceStatus Status, T? Value = default, string? Message = null);

public interface IResearchFormService
{
    Task<ResearchFormServiceResult<NckhGoogleLinkResponse>> LinkGoogleAsync(
        Guid userId, NckhGoogleLinkRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhImportFormResponse>> ImportFormAsync(
        Guid userId, NckhImportFormRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhFormListResponse>> ListFormsAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhFormDetailResponse>> GetFormDetailAsync(
        Guid userId, Guid formId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhVariableResponse>> CreateVariableAsync(
        Guid userId, Guid modelId, NckhCreateVariableRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhVariableListResponse>> ListVariablesAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhVariableResponse>> UpdateVariableAsync(
        Guid userId, Guid variableId, NckhUpdateVariableRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteVariableAsync(
        Guid userId, Guid variableId, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingResponse>> CreateMappingAsync(
        Guid userId, Guid variableId, NckhCreateMappingRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingListResponse>> ListVariableMappingsAsync(
        Guid userId, Guid variableId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingListResponse>> ListModelMappingsAsync(
        Guid userId, Guid modelId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<NckhMappingResponse>> UpdateMappingAsync(
        Guid userId, Guid mappingId, NckhUpdateMappingRequest request, CancellationToken cancellationToken);
    Task<ResearchFormServiceResult<bool>> DeleteMappingAsync(
        Guid userId, Guid mappingId, CancellationToken cancellationToken);
}

public sealed class ResearchFormService(
    FormAutoHubDbContext dbContext,
    IGoogleOAuthService googleOAuthService,
    IGoogleFormsApiService googleFormsApiService) : IResearchFormService
{
    private const string GoogleProvider = "Google";
    private static readonly string[] RequiredScopes = { "https://www.googleapis.com/auth/forms.body.readonly" };
    private static readonly string[] AllowedVariableTypes = { "Independent", "Dependent", "Mediator", "Moderator", "Control" };
    private static readonly string[] AllowedScaleTypes = { "Likert", "Nominal", "Ordinal", "Scale" };
    private static readonly Regex CodePattern = new("^[A-Za-z][A-Za-z0-9_]*$", RegexOptions.Compiled);

    public async Task<ResearchFormServiceResult<NckhGoogleLinkResponse>> LinkGoogleAsync(
        Guid userId,
        NckhGoogleLinkRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.AuthorizationCode))
        {
            return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                ResearchFormServiceStatus.InvalidRequest, Message: "Authorization code is required.");
        }

        var tokens = await googleOAuthService.ExchangeCodeAsync(request.AuthorizationCode, request.RedirectUri, cancellationToken);
        if (tokens is null)
        {
            return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                ResearchFormServiceStatus.InvalidRequest, Message: "Failed to exchange authorization code.");
        }

        var grantedScopes = tokens.Scope.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var hasRequiredScopes = RequiredScopes.All(required =>
            grantedScopes.Any(granted => string.Equals(granted, required, StringComparison.OrdinalIgnoreCase)));

        if (!hasRequiredScopes)
        {
            return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                ResearchFormServiceStatus.InvalidRequest,
                Message: "Google account must grant Forms read permission.");
        }

        if (string.IsNullOrWhiteSpace(tokens.Email))
        {
            return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                ResearchFormServiceStatus.InvalidRequest, Message: "Unable to verify Google account email.");
        }

        var existingLogin = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.Provider == GoogleProvider,
                cancellationToken);

        if (existingLogin is not null)
        {
            await googleOAuthService.StoreTokensAsync(existingLogin.Id, tokens, cancellationToken);
            return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                ResearchFormServiceStatus.Success, new NckhGoogleLinkResponse(true, tokens.Email));
        }

        var crossUserLogin = await dbContext.UserExternalLogins
            .SingleOrDefaultAsync(
                item => item.Provider == GoogleProvider && item.ProviderUserId == tokens.ProviderUserId && item.UserId != userId,
                cancellationToken);

        if (crossUserLogin is not null)
        {
            return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                ResearchFormServiceStatus.Conflict, Message: "This Google account is already linked to another user.");
        }

        var login = new global::FormAutoHub.Api.Entities.UserExternalLogin
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Provider = GoogleProvider,
            ProviderUserId = tokens.ProviderUserId,
            Email = tokens.Email,
            EmailVerified = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        dbContext.UserExternalLogins.Add(login);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is Microsoft.Data.SqlClient.SqlException sqlEx
                  && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
        {
            var existingByProviderId = await dbContext.UserExternalLogins
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    item => item.Provider == GoogleProvider && item.ProviderUserId == tokens.ProviderUserId,
                    cancellationToken);

            if (existingByProviderId is not null)
            {
                if (existingByProviderId.UserId == userId)
                {
                    await googleOAuthService.StoreTokensAsync(existingByProviderId.Id, tokens, cancellationToken);
                    return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                        ResearchFormServiceStatus.Success, new NckhGoogleLinkResponse(true, tokens.Email));
                }

                return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
                    ResearchFormServiceStatus.Conflict,
                    Message: "This Google account is already linked to another user.");
            }

            return await LinkGoogleAsync(userId, request, cancellationToken);
        }

        await googleOAuthService.StoreTokensAsync(login.Id, tokens, cancellationToken);
        return new ResearchFormServiceResult<NckhGoogleLinkResponse>(
            ResearchFormServiceStatus.Success, new NckhGoogleLinkResponse(true, tokens.Email));
    }

    public async Task<ResearchFormServiceResult<NckhImportFormResponse>> ImportFormAsync(
        Guid userId,
        NckhImportFormRequest request,
        CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(request.FormUrl, UriKind.Absolute, out var formUri) ||
            !string.Equals(formUri.Host, "docs.google.com", StringComparison.OrdinalIgnoreCase))
        {
            return new ResearchFormServiceResult<NckhImportFormResponse>(
                ResearchFormServiceStatus.InvalidRequest, Message: "Invalid Google Form URL.");
        }

        var formId = ExtractFormId(formUri);
        if (string.IsNullOrWhiteSpace(formId))
        {
            return new ResearchFormServiceResult<NckhImportFormResponse>(
                ResearchFormServiceStatus.InvalidRequest, Message: "Could not extract Form ID from URL.");
        }

        var existing = await dbContext.ResearchForms
            .AnyAsync(item => item.UserId == userId && item.GoogleFormId == formId, cancellationToken);

        if (existing)
        {
            return new ResearchFormServiceResult<NckhImportFormResponse>(
                ResearchFormServiceStatus.Conflict, Message: "This form has already been imported.");
        }

        var accessToken = await googleOAuthService.GetValidAccessTokenAsync(userId, cancellationToken);
        if (accessToken is null)
        {
            return new ResearchFormServiceResult<NckhImportFormResponse>(
                ResearchFormServiceStatus.Unauthorized, Message: "Google account not linked or token expired. Please re-link your Google account.");
        }

        var structure = await googleFormsApiService.GetFormStructureAsync(accessToken, formId, cancellationToken);
        if (structure is null)
        {
            return new ResearchFormServiceResult<NckhImportFormResponse>(
                ResearchFormServiceStatus.NotFound, Message: "Form not found or access denied.");
        }

        var now = DateTimeOffset.UtcNow;
        var form = new ResearchForm
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            GoogleFormId = formId,
            FormUrl = request.FormUrl,
            Title = structure.Title,
            Status = "Draft",
            ImportedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.ResearchForms.Add(form);

        foreach (var q in structure.Questions)
        {
            dbContext.ResearchFormQuestions.Add(new ResearchFormQuestion
            {
                Id = Guid.NewGuid(),
                FormId = form.Id,
                GoogleQuestionId = q.QuestionId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                IsRequired = q.IsRequired,
                OrderIndex = q.OrderIndex,
                CreatedAt = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhImportFormResponse>(
            ResearchFormServiceStatus.Success,
            new NckhImportFormResponse(
                form.Id,
                form.GoogleFormId,
                form.FormUrl,
                form.Title,
                form.Status,
                structure.Questions.Count,
                form.ImportedAt));
    }

    public async Task<ResearchFormServiceResult<NckhFormListResponse>> ListFormsAsync(
        Guid userId,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {

        var hasGoogleLink = await dbContext.UserExternalLogins
            .AnyAsync(item => item.UserId == userId && item.Provider == GoogleProvider, cancellationToken);

        if (!hasGoogleLink)
        {
            return new ResearchFormServiceResult<NckhFormListResponse>(
                ResearchFormServiceStatus.Unauthorized, Message: "Google account not linked.");
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.ResearchForms.Where(item => item.UserId == userId);
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(item => item.Status == status);
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query
            .OrderByDescending(item => item.ImportedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new NckhFormListItem(
                item.Id,
                item.GoogleFormId,
                item.Title,
                item.Status,
                item.Questions.Count,
                item.ImportedAt))
            .ToListAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhFormListResponse>(
            ResearchFormServiceStatus.Success,
            new NckhFormListResponse(items, page, pageSize, totalItems, totalPages));
    }

    public async Task<ResearchFormServiceResult<NckhFormDetailResponse>> GetFormDetailAsync(
        Guid userId,
        Guid formId,
        CancellationToken cancellationToken)
    {
        var form = await dbContext.ResearchForms
            .Include(item => item.Questions)
            .SingleOrDefaultAsync(item => item.Id == formId && item.UserId == userId, cancellationToken);

        if (form is null)
        {
            return new ResearchFormServiceResult<NckhFormDetailResponse>(
                ResearchFormServiceStatus.NotFound);
        }

        var questions = form.Questions
            .OrderBy(item => item.OrderIndex)
            .Select(item => new NckhFormQuestionResponse(
                item.Id,
                item.GoogleQuestionId,
                item.QuestionText,
                item.QuestionType,
                item.IsRequired,
                item.OrderIndex))
            .ToList();

        return new ResearchFormServiceResult<NckhFormDetailResponse>(
            ResearchFormServiceStatus.Success,
            new NckhFormDetailResponse(form.Id, form.GoogleFormId, form.Title, questions));
    }

    public async Task<ResearchFormServiceResult<NckhVariableResponse>> CreateVariableAsync(
        Guid userId,
        Guid modelId,
        NckhCreateVariableRequest request,
        CancellationToken cancellationToken)
    {
        var validation = ValidateVariablePayload(
            request.Name,
            request.Code,
            request.VariableType,
            request.ScaleType,
            request.ScalePoint,
            request.MinValue,
            request.MaxValue);
        if (validation is not null)
        {
            return new ResearchFormServiceResult<NckhVariableResponse>(ResearchFormServiceStatus.InvalidRequest, Message: validation);
        }

        var modelExists = await dbContext.ResearchModels
            .AnyAsync(item => item.Id == modelId && item.UserId == userId, cancellationToken);
        if (!modelExists)
        {
            return new ResearchFormServiceResult<NckhVariableResponse>(ResearchFormServiceStatus.NotFound);
        }

        var code = NormalizeCode(request.Code);
        var duplicate = await dbContext.ResearchVariables
            .AnyAsync(item => item.ModelId == modelId && item.Code.ToUpper() == code.ToUpper(), cancellationToken);
        if (duplicate)
        {
            return new ResearchFormServiceResult<NckhVariableResponse>(
                ResearchFormServiceStatus.Conflict,
                Message: $"Variable code '{code}' already exists in this model.");
        }

        var now = DateTimeOffset.UtcNow;
        var variable = new ResearchVariable
        {
            Id = Guid.NewGuid(),
            ModelId = modelId,
            Name = request.Name.Trim(),
            Code = code,
            VariableType = request.VariableType.Trim(),
            ScaleType = request.ScaleType.Trim(),
            ScalePoint = request.ScalePoint,
            MinValue = request.MinValue,
            MaxValue = request.MaxValue,
            SortOrder = request.SortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.ResearchVariables.Add(variable);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhVariableResponse>(
            ResearchFormServiceStatus.Success,
            ToVariableResponse(variable));
    }

    public async Task<ResearchFormServiceResult<NckhVariableListResponse>> ListVariablesAsync(
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
            return new ResearchFormServiceResult<NckhVariableListResponse>(ResearchFormServiceStatus.NotFound);
        }

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = dbContext.ResearchVariables.Where(item => item.ModelId == modelId);
        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await query
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => ToVariableResponse(item))
            .ToListAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhVariableListResponse>(
            ResearchFormServiceStatus.Success,
            new NckhVariableListResponse(items, page, pageSize, totalItems, totalPages));
    }

    public async Task<ResearchFormServiceResult<NckhVariableResponse>> UpdateVariableAsync(
        Guid userId,
        Guid variableId,
        NckhUpdateVariableRequest request,
        CancellationToken cancellationToken)
    {
        var variable = await dbContext.ResearchVariables
            .Include(item => item.Model)
            .SingleOrDefaultAsync(item => item.Id == variableId && item.Model.UserId == userId, cancellationToken);
        if (variable is null)
        {
            return new ResearchFormServiceResult<NckhVariableResponse>(ResearchFormServiceStatus.NotFound);
        }

        var validation = ValidateVariablePayload(
            request.Name,
            request.Code,
            request.VariableType,
            request.ScaleType,
            request.ScalePoint,
            request.MinValue,
            request.MaxValue);
        if (validation is not null)
        {
            return new ResearchFormServiceResult<NckhVariableResponse>(ResearchFormServiceStatus.InvalidRequest, Message: validation);
        }

        var code = NormalizeCode(request.Code);
        var duplicate = await dbContext.ResearchVariables
            .AnyAsync(item => item.ModelId == variable.ModelId && item.Id != variable.Id && item.Code.ToUpper() == code.ToUpper(), cancellationToken);
        if (duplicate)
        {
            return new ResearchFormServiceResult<NckhVariableResponse>(
                ResearchFormServiceStatus.Conflict,
                Message: $"Variable code '{code}' already exists in this model.");
        }

        variable.Name = request.Name.Trim();
        variable.Code = code;
        variable.VariableType = request.VariableType.Trim();
        variable.ScaleType = request.ScaleType.Trim();
        variable.ScalePoint = request.ScalePoint;
        variable.MinValue = request.MinValue;
        variable.MaxValue = request.MaxValue;
        variable.SortOrder = request.SortOrder;
        variable.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhVariableResponse>(
            ResearchFormServiceStatus.Success,
            ToVariableResponse(variable));
    }

    public async Task<ResearchFormServiceResult<bool>> DeleteVariableAsync(
        Guid userId,
        Guid variableId,
        CancellationToken cancellationToken)
    {
        var variable = await dbContext.ResearchVariables
            .Include(item => item.Model)
            .SingleOrDefaultAsync(item => item.Id == variableId && item.Model.UserId == userId, cancellationToken);
        if (variable is null)
        {
            return new ResearchFormServiceResult<bool>(ResearchFormServiceStatus.NotFound);
        }

        dbContext.ResearchVariables.Remove(variable);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ResearchFormServiceResult<bool>(ResearchFormServiceStatus.Success, true);
    }

    public async Task<ResearchFormServiceResult<NckhMappingResponse>> CreateMappingAsync(
        Guid userId,
        Guid variableId,
        NckhCreateMappingRequest request,
        CancellationToken cancellationToken)
    {
        var variable = await dbContext.ResearchVariables
            .Include(item => item.Model)
            .SingleOrDefaultAsync(item => item.Id == variableId && item.Model.UserId == userId, cancellationToken);
        if (variable is null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.NotFound);
        }

        var validation = ValidateObservedCode(request.ObservedCode);
        if (validation is not null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.InvalidRequest, Message: validation);
        }

        var question = await dbContext.ResearchFormQuestions
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.FormQuestionId, cancellationToken);
        if (question is null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.NotFound);
        }

        if (question.FormId != variable.Model.FormId)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(
                ResearchFormServiceStatus.InvalidRequest,
                Message: "Form question must belong to the same imported form as the variable model.");
        }

        var duplicate = await FindDuplicateMappingAsync(variable.Id, null, request.FormQuestionId, request.ObservedCode, cancellationToken);
        if (duplicate is not null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.Conflict, Message: duplicate);
        }

        var mapping = new ObservedQuestionMapping
        {
            Id = Guid.NewGuid(),
            VariableId = variable.Id,
            FormQuestionId = request.FormQuestionId,
            ObservedCode = NormalizeCode(request.ObservedCode),
            SortOrder = request.SortOrder,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.ObservedQuestionMappings.Add(mapping);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhMappingResponse>(
            ResearchFormServiceStatus.Success,
            ToMappingResponse(mapping, variable.ModelId, question));
    }

    public async Task<ResearchFormServiceResult<NckhMappingListResponse>> ListVariableMappingsAsync(
        Guid userId,
        Guid variableId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var variable = await dbContext.ResearchVariables
            .Include(item => item.Model)
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == variableId && item.Model.UserId == userId, cancellationToken);
        if (variable is null)
        {
            return new ResearchFormServiceResult<NckhMappingListResponse>(ResearchFormServiceStatus.NotFound);
        }

        return await ListMappingsAsync(dbContext.ObservedQuestionMappings.Where(item => item.VariableId == variableId), page, pageSize, cancellationToken);
    }

    public async Task<ResearchFormServiceResult<NckhMappingListResponse>> ListModelMappingsAsync(
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
            return new ResearchFormServiceResult<NckhMappingListResponse>(ResearchFormServiceStatus.NotFound);
        }

        return await ListMappingsAsync(
            dbContext.ObservedQuestionMappings.Where(item => item.Variable.ModelId == modelId),
            page,
            pageSize,
            cancellationToken);
    }

    public async Task<ResearchFormServiceResult<NckhMappingResponse>> UpdateMappingAsync(
        Guid userId,
        Guid mappingId,
        NckhUpdateMappingRequest request,
        CancellationToken cancellationToken)
    {
        var mapping = await dbContext.ObservedQuestionMappings
            .Include(item => item.Variable)
            .ThenInclude(item => item.Model)
            .Include(item => item.FormQuestion)
            .SingleOrDefaultAsync(item => item.Id == mappingId && item.Variable.Model.UserId == userId, cancellationToken);
        if (mapping is null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.NotFound);
        }

        var validation = ValidateObservedCode(request.ObservedCode);
        if (validation is not null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.InvalidRequest, Message: validation);
        }

        var question = await dbContext.ResearchFormQuestions
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == request.FormQuestionId, cancellationToken);
        if (question is null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.NotFound);
        }

        if (question.FormId != mapping.Variable.Model.FormId)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(
                ResearchFormServiceStatus.InvalidRequest,
                Message: "Form question must belong to the same imported form as the variable model.");
        }

        var duplicate = await FindDuplicateMappingAsync(mapping.VariableId, mapping.Id, request.FormQuestionId, request.ObservedCode, cancellationToken);
        if (duplicate is not null)
        {
            return new ResearchFormServiceResult<NckhMappingResponse>(ResearchFormServiceStatus.Conflict, Message: duplicate);
        }

        mapping.FormQuestionId = request.FormQuestionId;
        mapping.ObservedCode = NormalizeCode(request.ObservedCode);
        mapping.SortOrder = request.SortOrder;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhMappingResponse>(
            ResearchFormServiceStatus.Success,
            ToMappingResponse(mapping, mapping.Variable.ModelId, question));
    }

    public async Task<ResearchFormServiceResult<bool>> DeleteMappingAsync(
        Guid userId,
        Guid mappingId,
        CancellationToken cancellationToken)
    {
        var mapping = await dbContext.ObservedQuestionMappings
            .Include(item => item.Variable)
            .ThenInclude(item => item.Model)
            .SingleOrDefaultAsync(item => item.Id == mappingId && item.Variable.Model.UserId == userId, cancellationToken);
        if (mapping is null)
        {
            return new ResearchFormServiceResult<bool>(ResearchFormServiceStatus.NotFound);
        }

        dbContext.ObservedQuestionMappings.Remove(mapping);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ResearchFormServiceResult<bool>(ResearchFormServiceStatus.Success, true);
    }

    private static string? ExtractFormId(Uri formUri)
    {
        var path = formUri.AbsolutePath;
        var match = System.Text.RegularExpressions.Regex.Match(path, @"/forms/d/([^/]+)");
        return match.Success ? match.Groups[1].Value : null;
    }

    private async Task<ResearchFormServiceResult<NckhMappingListResponse>> ListMappingsAsync(
        IQueryable<ObservedQuestionMapping> query,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var items = await query
            .Include(item => item.Variable)
            .Include(item => item.FormQuestion)
            .OrderBy(item => item.Variable.SortOrder)
            .ThenBy(item => item.SortOrder)
            .ThenBy(item => item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(item => ToMappingResponse(item))
            .ToListAsync(cancellationToken);

        return new ResearchFormServiceResult<NckhMappingListResponse>(
            ResearchFormServiceStatus.Success,
            new NckhMappingListResponse(items, page, pageSize, totalItems, totalPages));
    }

    private static NckhVariableResponse ToVariableResponse(ResearchVariable variable)
    {
        return new NckhVariableResponse(
            variable.Id,
            variable.ModelId,
            variable.Name,
            variable.Code,
            variable.VariableType,
            variable.ScaleType,
            variable.ScalePoint,
            variable.MinValue,
            variable.MaxValue,
            variable.SortOrder,
            variable.CreatedAt,
            variable.UpdatedAt);
    }

    private static NckhMappingResponse ToMappingResponse(ObservedQuestionMapping mapping)
    {
        return new NckhMappingResponse(
            mapping.Id,
            mapping.VariableId,
            mapping.Variable.ModelId,
            mapping.FormQuestionId,
            mapping.ObservedCode,
            mapping.FormQuestion.QuestionText,
            mapping.FormQuestion.QuestionType,
            mapping.SortOrder,
            mapping.CreatedAt);
    }

    private static NckhMappingResponse ToMappingResponse(
        ObservedQuestionMapping mapping,
        Guid modelId,
        ResearchFormQuestion question)
    {
        return new NckhMappingResponse(
            mapping.Id,
            mapping.VariableId,
            modelId,
            mapping.FormQuestionId,
            mapping.ObservedCode,
            question.QuestionText,
            question.QuestionType,
            mapping.SortOrder,
            mapping.CreatedAt);
    }

    private static string? ValidateVariablePayload(
        string name,
        string code,
        string variableType,
        string scaleType,
        int? scalePoint,
        decimal? minValue,
        decimal? maxValue)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return "Variable name is required.";
        }

        if (ValidateCode(code, "Variable code") is { } codeError)
        {
            return codeError;
        }

        if (!AllowedVariableTypes.Contains(variableType.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            return "Variable type is invalid.";
        }

        var normalizedScaleType = scaleType.Trim();
        if (!AllowedScaleTypes.Contains(normalizedScaleType, StringComparer.OrdinalIgnoreCase))
        {
            return "Scale type is invalid.";
        }

        if (string.Equals(normalizedScaleType, "Likert", StringComparison.OrdinalIgnoreCase))
        {
            if (scalePoint is null or < 2 or > 10)
            {
                return "Likert scalePoint must be between 2 and 10.";
            }

            return ValidateMinMax(minValue, maxValue);
        }

        if (string.Equals(normalizedScaleType, "Scale", StringComparison.OrdinalIgnoreCase))
        {
            if (scalePoint is not null)
            {
                return "Scale scaleType must not include scalePoint.";
            }

            if (minValue is null || maxValue is null)
            {
                return "Scale scaleType requires minValue and maxValue.";
            }

            return ValidateMinMax(minValue, maxValue);
        }

        if (scalePoint is not null || minValue is not null || maxValue is not null)
        {
            return "Nominal and Ordinal scale types must not include numeric scale payload.";
        }

        return null;
    }

    private static string? ValidateObservedCode(string observedCode)
    {
        return ValidateCode(observedCode, "Observed code");
    }

    private static string? ValidateCode(string code, string label)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return $"{label} is required.";
        }

        var normalized = NormalizeCode(code);
        if (!CodePattern.IsMatch(normalized))
        {
            return $"{label} must start with a letter and contain only letters, numbers, or underscore.";
        }

        return null;
    }

    private static string? ValidateMinMax(decimal? minValue, decimal? maxValue)
    {
        if (minValue.HasValue != maxValue.HasValue)
        {
            return "minValue and maxValue must be provided together.";
        }

        if (minValue is not null && maxValue is not null && minValue >= maxValue)
        {
            return "minValue must be less than maxValue.";
        }

        return null;
    }

    private static string NormalizeCode(string code)
    {
        return code.Trim().ToUpperInvariant();
    }

    private async Task<string?> FindDuplicateMappingAsync(
        Guid variableId,
        Guid? currentMappingId,
        Guid formQuestionId,
        string observedCode,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ObservedQuestionMappings.Where(item => item.VariableId == variableId);
        if (currentMappingId is not null)
        {
            query = query.Where(item => item.Id != currentMappingId.Value);
        }

        if (await query.AnyAsync(item => item.FormQuestionId == formQuestionId, cancellationToken))
        {
            return "This form question is already mapped to this variable.";
        }

        var normalizedObservedCode = NormalizeCode(observedCode);
        if (await query.AnyAsync(item => item.ObservedCode.ToUpper() == normalizedObservedCode.ToUpper(), cancellationToken))
        {
            return $"Observed code '{normalizedObservedCode}' already exists for this variable.";
        }

        return null;
    }
}
