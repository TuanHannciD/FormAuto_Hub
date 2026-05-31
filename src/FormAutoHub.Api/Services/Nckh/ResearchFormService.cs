using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Entities.Nckh;
using FormAutoHub.Api.Integrations.Google;
using Microsoft.EntityFrameworkCore;

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
}

public sealed class ResearchFormService(
    FormAutoHubDbContext dbContext,
    IGoogleOAuthService googleOAuthService,
    IGoogleFormsApiService googleFormsApiService) : IResearchFormService
{
    private const string GoogleProvider = "Google";
    private static readonly string[] RequiredScopes = { "https://www.googleapis.com/auth/forms.body.readonly" };

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

    private static string? ExtractFormId(Uri formUri)
    {
        var path = formUri.AbsolutePath;
        var match = System.Text.RegularExpressions.Regex.Match(path, @"/forms/d/([^/]+)");
        return match.Success ? match.Groups[1].Value : null;
    }
}
