using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IAiPromptProfileService
{
    Task<AiPromptProfileResponse?> GetAsync(Guid projectId, string mode, CancellationToken cancellationToken);
    Task<AiPromptProfileResponse?> UpsertProfileAsync(Guid projectId, UpsertAiPromptProfileRequest request, CancellationToken cancellationToken);
    Task<AiQuestionPromptResponse?> UpsertQuestionPromptAsync(Guid projectId, Guid questionId, UpsertAiQuestionPromptRequest request, CancellationToken cancellationToken);
    Task<AiPromptAutoFillResponse?> AutoFillAsync(Guid projectId, AiPromptAutoFillRequest request, CancellationToken cancellationToken);
}

public sealed class AiPromptProfileService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    IAiPromptGuardService promptGuard) : IAiPromptProfileService
{
    public async Task<AiPromptProfileResponse?> GetAsync(Guid projectId, string mode, CancellationToken cancellationToken)
    {
        mode = NormalizeMode(mode);
        if (!IsSupportedMode(mode))
        {
            throw new InvalidOperationException("Unsupported AI prompt profile mode.");
        }

        var ownsProject = await OwnsProjectAsync(projectId, cancellationToken);
        if (!ownsProject)
        {
            return null;
        }

        var profile = await dbContext.AiPromptProfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.ProjectId == projectId && item.Mode == mode,
                cancellationToken);

        return profile is null ? null : await ToResponseAsync(profile, cancellationToken);
    }

    public async Task<AiPromptProfileResponse?> UpsertProfileAsync(
        Guid projectId,
        UpsertAiPromptProfileRequest request,
        CancellationToken cancellationToken)
    {
        var mode = NormalizeMode(request.Mode);
        if (!IsSupportedMode(mode))
        {
            throw new InvalidOperationException("Unsupported AI prompt profile mode.");
        }

        var ownsProject = await OwnsProjectAsync(projectId, cancellationToken);
        if (!ownsProject)
        {
            return null;
        }

        var audienceJson = NormalizeAudienceJson(request.AudienceJson);
        var globalPrompt = NormalizePrompt(request.GlobalPrompt);
        ValidateGlobalPrompt(globalPrompt);

        var profile = await dbContext.AiPromptProfiles
            .SingleOrDefaultAsync(
                item => item.ProjectId == projectId && item.Mode == mode,
                cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (profile is null)
        {
            profile = new AiPromptProfile
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                UserId = currentUser.UserId,
                Mode = mode,
                CreatedAt = now
            };

            dbContext.AiPromptProfiles.Add(profile);
        }

        profile.UserId = currentUser.UserId;
        profile.AudienceJson = audienceJson;
        profile.GlobalPrompt = globalPrompt;
        profile.UpdatedAt = now;

        await ValidateTotalPromptPayloadAsync(profile, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await ToResponseAsync(profile, cancellationToken);
    }

    public async Task<AiQuestionPromptResponse?> UpsertQuestionPromptAsync(
        Guid projectId,
        Guid questionId,
        UpsertAiQuestionPromptRequest request,
        CancellationToken cancellationToken)
    {
        var mode = NormalizeMode(request.Mode);
        if (!IsSupportedMode(mode))
        {
            throw new InvalidOperationException("Unsupported AI prompt profile mode.");
        }

        var question = await dbContext.FormQuestions
            .SingleOrDefaultAsync(
                item => item.Id == questionId && item.ProjectId == projectId,
                cancellationToken);
        if (question is null || !await OwnsProjectAsync(projectId, cancellationToken))
        {
            return null;
        }

        var prompt = NormalizePrompt(request.Prompt);
        ValidateQuestionPrompt(prompt);

        var profile = await GetOrCreateProfileAsync(projectId, mode, cancellationToken);
        var questionPrompt = await dbContext.AiQuestionPrompts
            .SingleOrDefaultAsync(
                item => item.ProfileId == profile.Id && item.QuestionId == questionId,
                cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (questionPrompt is null)
        {
            questionPrompt = new AiQuestionPrompt
            {
                Id = Guid.NewGuid(),
                ProfileId = profile.Id,
                QuestionId = question.Id,
                CreatedAt = now
            };

            dbContext.AiQuestionPrompts.Add(questionPrompt);
        }

        questionPrompt.Prompt = prompt;
        questionPrompt.UseAi = request.UseAi;
        questionPrompt.UpdatedAt = now;

        await ValidateTotalPromptPayloadAsync(profile, cancellationToken, questionPrompt);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToQuestionResponse(questionPrompt);
    }

    public async Task<AiPromptAutoFillResponse?> AutoFillAsync(
        Guid projectId,
        AiPromptAutoFillRequest request,
        CancellationToken cancellationToken)
    {
        var mode = NormalizeMode(request.Mode);
        if (!IsSupportedMode(mode))
        {
            throw new InvalidOperationException("Unsupported AI prompt profile mode.");
        }

        var ownsProject = await OwnsProjectAsync(projectId, cancellationToken);
        if (!ownsProject)
        {
            return null;
        }

        var context = NormalizePrompt(request.Context);
        if (context.Length > AiPromptProfileLimits.MaxAudienceFieldLength)
        {
            throw new InvalidOperationException("Auto-fill context is too long.");
        }

        if (!string.IsNullOrWhiteSpace(context))
        {
            var guardResult = promptGuard.Validate(context);
            if (!guardResult.IsAllowed)
            {
                throw new InvalidOperationException(guardResult.RejectionReason ?? "Prompt requests unsafe or forbidden AI behavior.");
            }
        }

        var questions = await dbContext.FormQuestions
            .AsNoTracking()
            .Where(question => question.ProjectId == projectId)
            .OrderBy(question => question.OrderIndex)
            .ToListAsync(cancellationToken);

        var audienceJson = JsonSerializer.Serialize(new { context });
        var globalPrompt = string.IsNullOrWhiteSpace(context)
            ? "Create natural, concise answers that match the stored question metadata and allowed options."
            : $"Create natural, concise answers for this context: {context}";

        return new AiPromptAutoFillResponse(
            mode,
            audienceJson,
            globalPrompt,
            questions.Select(question => new AiPromptAutoFillQuestionResponse(
                    question.Id,
                    $"Answer '{question.Label}' naturally while respecting the question type and allowed options.",
                    true))
                .ToList());
    }

    private async Task<bool> OwnsProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

    private async Task<AiPromptProfile> GetOrCreateProfileAsync(
        Guid projectId,
        string mode,
        CancellationToken cancellationToken)
    {
        var profile = await dbContext.AiPromptProfiles
            .SingleOrDefaultAsync(
                item => item.ProjectId == projectId && item.Mode == mode,
                cancellationToken);

        if (profile is not null)
        {
            return profile;
        }

        var now = DateTimeOffset.UtcNow;
        profile = new AiPromptProfile
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Mode = mode,
            AudienceJson = "{}",
            GlobalPrompt = string.Empty,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.AiPromptProfiles.Add(profile);
        return profile;
    }

    private async Task<AiPromptProfileResponse> ToResponseAsync(AiPromptProfile profile, CancellationToken cancellationToken)
    {
        var questionPrompts = await dbContext.AiQuestionPrompts
            .AsNoTracking()
            .Where(item => item.ProfileId == profile.Id)
            .OrderBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return new AiPromptProfileResponse(
            profile.Id,
            profile.ProjectId,
            profile.UserId,
            profile.Mode,
            profile.AudienceJson,
            profile.GlobalPrompt,
            questionPrompts.Select(ToQuestionResponse).ToList(),
            profile.CreatedAt,
            profile.UpdatedAt);
    }

    private static AiQuestionPromptResponse ToQuestionResponse(AiQuestionPrompt prompt) =>
        new(
            prompt.Id,
            prompt.ProfileId,
            prompt.QuestionId,
            prompt.Prompt,
            prompt.UseAi,
            prompt.CreatedAt,
            prompt.UpdatedAt);

    private static string NormalizeMode(string? mode) => mode?.Trim() ?? string.Empty;

    private static string NormalizePrompt(string? prompt) => prompt?.Trim() ?? string.Empty;

    private static bool IsSupportedMode(string mode) =>
        mode is AiPromptProfileModes.Option2 or AiPromptProfileModes.Option3;

    private void ValidateGlobalPrompt(string globalPrompt)
    {
        if (globalPrompt.Length > AiPromptProfileLimits.MaxGlobalPromptLength)
        {
            throw new InvalidOperationException("Global prompt is too long.");
        }

        ValidateSafePrompt(globalPrompt);
    }

    private void ValidateQuestionPrompt(string prompt)
    {
        if (prompt.Length > AiPromptProfileLimits.MaxQuestionPromptLength)
        {
            throw new InvalidOperationException("Question prompt is too long.");
        }

        ValidateSafePrompt(prompt);
    }

    private void ValidateSafePrompt(string prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt))
        {
            return;
        }

        var guardResult = promptGuard.Validate(prompt);
        if (!guardResult.IsAllowed)
        {
            throw new InvalidOperationException(guardResult.RejectionReason ?? "Prompt requests unsafe or forbidden AI behavior.");
        }
    }

    private string NormalizeAudienceJson(string? audienceJson)
    {
        var normalized = string.IsNullOrWhiteSpace(audienceJson) ? "{}" : audienceJson.Trim();
        try
        {
            using var document = JsonDocument.Parse(normalized);
            ValidateAudienceElement(document.RootElement);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException("AudienceJson must be valid JSON.", exception);
        }

        return normalized;
    }

    private void ValidateAudienceElement(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String &&
            element.GetString() is { } value)
        {
            if (value.Length > AiPromptProfileLimits.MaxAudienceFieldLength)
            {
                throw new InvalidOperationException("AudienceJson contains a short context field that is too long.");
            }

            if (!string.IsNullOrWhiteSpace(value) && !promptGuard.Validate(value).IsAllowed)
            {
                throw new InvalidOperationException("AudienceJson contains unsafe or forbidden context.");
            }
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                ValidateAudienceElement(property.Value);
            }
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                ValidateAudienceElement(item);
            }
        }
    }

    private async Task ValidateTotalPromptPayloadAsync(
        AiPromptProfile profile,
        CancellationToken cancellationToken,
        AiQuestionPrompt? pendingQuestionPrompt = null)
    {
        var questionPrompts = await dbContext.AiQuestionPrompts
            .AsNoTracking()
            .Where(item => item.ProfileId == profile.Id)
            .Select(item => new { item.Id, item.Prompt })
            .ToListAsync(cancellationToken);

        var total = profile.AudienceJson.Length + profile.GlobalPrompt.Length;
        foreach (var item in questionPrompts)
        {
            total += pendingQuestionPrompt?.Id == item.Id ? pendingQuestionPrompt.Prompt.Length : item.Prompt.Length;
        }

        if (pendingQuestionPrompt is not null && questionPrompts.All(item => item.Id != pendingQuestionPrompt.Id))
        {
            total += pendingQuestionPrompt.Prompt.Length;
        }

        if (total > AiPromptProfileLimits.MaxTotalPromptPayloadLength)
        {
            throw new InvalidOperationException("Total prompt payload is too large.");
        }
    }
}
