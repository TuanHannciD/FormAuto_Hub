using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FormAutoHub.Api.Services;

// === FILE MAP (AiGenerationService.cs – 564 dòng) ===
// Dòng    Method                      Mục đích
// 43      AiGenerationService()       Constructor – DI: DbContext, user context, prompt guard, validator, provider adapter, config
// 53      GenerateAsync()             Entry point – validate input, gọi provider, tạo previews, trừ credit, ghi audit
// 383     GetCurrentBalanceAsync()    Truy vấn số dư credit của user hiện tại
// 392     NormalizeMode()             Chuẩn hóa chế độ generate (default → Option2)
// 394     IsSupportedMode()           Kiểm tra chế độ generate có được hỗ trợ
// 397     GetMultiplier()             Tính hệ số nhân credit theo chế độ (Option2=2, Option3=3)
// 400     IsConfiguredProviderSetting() Kiểm tra provider setting đã được admin cấu hình
// 405     BuildPromptSnapshotJson()   Tạo snapshot JSON của prompt profile để audit
// 423     BuildQuestionSnapshotJson() Tạo snapshot JSON của question để audit
// 435     BuildGuardPayload()         Tạo payload gửi qua prompt guard để kiểm tra abuse
// 446     ReadOptions()               Đọc danh sách option từ answer rule
// 463     ReadRawAnswerItems()        Parse kết quả AI trả về thành danh sách RawAnswerItem
// 497     BuildPreviewText()          Tạo text preview cho một answer item
// 500     StartRun()                  Đánh dấu AiGenerationRun bắt đầu (status Running)
// 511     CompleteRun()               Đánh dấu run hoàn tất thành công
// 522     FailRun()                   Đánh dấu run thất bại kèm lý do
// 530     WriteUsageLogAsync()        Ghi UsageLog sau mỗi lần generate
// 553     ToResponse()                Map entity sang DTO AiGenerateResponsesResponse
// 570     GenerateBatchAsync()        Gọi provider, validate output, tạo preview, ghi credit + audit
// 585     RawAnswerItem               Record nội bộ chứa answer text/value thô từ AI provider
public interface IAiGenerationService
{
    Task<AiGenerateResponsesResponse?> GenerateAsync(
        Guid projectId,
        AiGenerateResponsesRequest request,
        CancellationToken cancellationToken);
}

public sealed class AiGenerationService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    IAiPromptGuardService promptGuard,
    IAiOutputValidator outputValidator,
    IAiProviderAdapter providerAdapter,
    IAiProviderSecretProtector secretProtector,
    IConfiguration configuration,
    ICreditService creditService) : IAiGenerationService
{
    public async Task<AiGenerateResponsesResponse?> GenerateAsync(
        Guid projectId,
        AiGenerateResponsesRequest request,
        CancellationToken cancellationToken)
    {
        var mode = NormalizeMode(request.Mode);
        if (!IsSupportedMode(mode))
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Unsupported AI generation mode.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Unsupported AI generation mode.");
        }

        if (request.Count is < 1 or > Phase4SafetyLimits.MaxPreviewResponsesPerRequest)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "AI preview response count must be between 1 and 100.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("AI preview response count must be between 1 and 100.");
        }

        var project = await dbContext.FormProjects
            .SingleOrDefaultAsync(item => item.Id == projectId && item.UserId == currentUser.UserId, cancellationToken);
        if (project is null)
        {
            return null;
        }

        var questions = await dbContext.FormQuestions
            .Where(question => question.ProjectId == projectId)
            .OrderBy(question => question.OrderIndex)
            .ToListAsync(cancellationToken);
        if (questions.Count == 0)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Project has no detected questions for AI generation.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Project has no detected questions for AI generation.");
        }

        var profile = await dbContext.AiPromptProfiles
            .SingleOrDefaultAsync(item => item.ProjectId == projectId && item.Mode == mode, cancellationToken);
        if (profile is null)
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "AI prompt profile is required before generation.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("AI prompt profile is required before generation.");
        }

        var questionPrompts = await dbContext.AiQuestionPrompts
            .Where(item => item.ProfileId == profile.Id)
            .OrderBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        var setting = await dbContext.AiProviderSettings
            .Where(item => item.IsEnabled)
            .OrderByDescending(item => item.UpdatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (setting is null || !IsConfiguredProviderSetting(setting))
        {
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "Enabled AI provider settings are required before generation.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Enabled AI provider settings are required before generation.");
        }

        var now = DateTimeOffset.UtcNow;
        var multiplier = GetMultiplier(mode);
        var promptSnapshotJson = BuildPromptSnapshotJson(profile, questionPrompts);
        var questionSnapshotJson = BuildQuestionSnapshotJson(questions);
        var run = new AiGenerationRun
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            ProjectId = project.Id,
            PromptProfileId = profile.Id,
            Mode = mode,
            Status = AiGenerationRunStatuses.Pending,
            Provider = setting.Provider,
            Model = setting.DefaultModel,
            RequestedCount = request.Count,
            GeneratedCount = 0,
            Multiplier = multiplier,
            CreditsUsed = 0,
            PromptSnapshotJson = promptSnapshotJson,
            QuestionSnapshotJson = questionSnapshotJson,
            ValidationSummaryJson = "{}",
            CreatedAt = now
        };
        dbContext.AiGenerationRuns.Add(run);
        StartRun(run);

        var guardResult = promptGuard.Validate(BuildGuardPayload(profile, questionPrompts));
        if (!guardResult.IsAllowed)
        {
            FailRun(run, guardResult.RejectionReason ?? "Prompt requests unsafe or forbidden AI behavior.");
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, run.ErrorMessage, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return ToResponse(run, 0, await GetCurrentBalanceAsync(cancellationToken), []);
        }

        var account = await dbContext.UserCreditAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == currentUser.UserId, cancellationToken);
        var availableCredits = Math.Max(0, (int)Math.Floor(account?.Balance ?? 0));
        var generationLimit = Math.Min(request.Count, availableCredits / multiplier);
        var missingCredits = Math.Max(0, (request.Count - generationLimit) * multiplier);
        if (generationLimit == 0)
        {
            FailRun(run, "Không đủ credit để tạo bản xem trước AI.");
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, run.ErrorMessage, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return ToResponse(run, missingCredits, account?.Balance ?? 0, []);
        }

        var batchSize = Math.Max(1, configuration.GetValue<int>("AI:BatchSize", 10));
        var maxParallel = Math.Max(1, configuration.GetValue<int>("AI:MaxParallelBatches", 5));
        var numBatches = (int)Math.Ceiling((double)generationLimit / batchSize);
        using var semaphore = new SemaphoreSlim(maxParallel, maxParallel);

        var batchTasks = new List<Task<AiProviderGenerateResult>>();
        for (var batchIndex = 0; batchIndex < numBatches; batchIndex++)
        {
            var batchCount = Math.Min(batchSize, generationLimit - batchIndex * batchSize);
            var batchRequest = new AiProviderGenerateRequest(
                project.Id,
                mode,
                batchCount,
                setting.Provider,
                setting.DefaultModel,
                promptSnapshotJson,
                questionSnapshotJson,
                setting.BaseUrl,
                secretProtector.Unprotect(setting.EncryptedApiKey));
            batchTasks.Add(GenerateBatchAsync(batchRequest, semaphore, cancellationToken));
        }

        AiProviderGenerateResult[] batchResults;
        try
        {
            batchResults = await Task.WhenAll(batchTasks);
        }
        catch (OperationCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            FailRun(run, "AI provider generation timed out.");
            run.ErrorMessage = $"{run.ErrorMessage} {exception.Message}".Trim();
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "AI provider generation timed out.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return ToResponse(run, missingCredits, account?.Balance ?? 0, []);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            FailRun(run, "AI provider generation failed.");
            run.ErrorMessage = $"{run.ErrorMessage} {exception.Message}".Trim();
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, "AI provider generation failed.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return ToResponse(run, missingCredits, account?.Balance ?? 0, []);
        }

        var successfulBatches = batchResults
            .Where(result => result is not null)
            .ToList();
        var allOutputJsons = successfulBatches
            .SelectMany(result => result.OutputJsons)
            .Take(generationLimit)
            .ToList();

        run.RawProviderRequestJson = string.Join(
            "\n---\n",
            successfulBatches.Select((result, index) =>
                $"[Batch {index + 1}/{successfulBatches.Count}]\n{result.RawProviderRequestJson}"));
        run.RawProviderResponseJson = string.Join(
            "\n---\n",
            successfulBatches.Select((result, index) =>
                $"[Batch {index + 1}/{successfulBatches.Count}]\n{result.RawProviderResponseJson}"));

        var generatedResponses = new List<GeneratedResponse>();
        var runItems = new List<AiGenerationRunItem>();
        var validationSummaries = new List<object>();
        foreach (var outputJson in allOutputJsons.Take(generationLimit))
        {
            var responseId = Guid.NewGuid();
            var validation = outputValidator.Validate(outputJson, questions);
            var missingQuestions = questions
                .Where(question => validation.ValidAnswers.All(answer => answer.QuestionId != question.Id))
                .Select(question => question.Id)
                .ToList();
            var responseErrors = validation.Errors.ToList();
            responseErrors.AddRange(missingQuestions.Select(questionId =>
                new AiOutputValidationError(questionId, "AI output must include one valid answer for every project question.")));

            var rawItems = ReadRawAnswerItems(outputJson);
            var isResponseValid = validation.HasValidAnswers && responseErrors.Count == 0;
            validationSummaries.Add(new
            {
                isValid = isResponseValid,
                validAnswerCount = validation.ValidAnswers.Count,
                errors = responseErrors
            });

            if (isResponseValid)
            {
                var response = new GeneratedResponse
                {
                    Id = responseId,
                    ProjectId = projectId,
                    PayloadJson = JsonSerializer.Serialize(validation.ValidAnswers),
                    PreviewText = BuildPreviewText(validation.ValidAnswers),
                    Status = GeneratedResponseStatuses.Previewed,
                    Source = GeneratedResponseSources.AI,
                    IsReadOnly = true,
                    CreatedAt = DateTimeOffset.UtcNow
                };
                generatedResponses.Add(response);
                runItems.AddRange(validation.ValidAnswers.Select(answer => new AiGenerationRunItem
                {
                    Id = Guid.NewGuid(),
                    RunId = run.Id,
                    QuestionId = answer.QuestionId,
                    GeneratedResponseId = responseId,
                    Status = AiGenerationRunItemStatuses.Valid,
                    RawAnswerJson = rawItems.FirstOrDefault(item => item.QuestionId == answer.QuestionId)?.RawJson ?? JsonSerializer.Serialize(answer),
                    ValidationMessage = string.Empty,
                    CreatedAt = DateTimeOffset.UtcNow
                }));
                continue;
            }

            if (rawItems.Count == 0)
            {
                runItems.Add(new AiGenerationRunItem
                {
                    Id = Guid.NewGuid(),
                    RunId = run.Id,
                    Status = AiGenerationRunItemStatuses.Invalid,
                    RawAnswerJson = outputJson,
                    ValidationMessage = responseErrors.FirstOrDefault()?.Message ?? "AI output did not contain parseable answer items.",
                    CreatedAt = DateTimeOffset.UtcNow
                });
                continue;
            }

            runItems.AddRange(rawItems.Select(item => new AiGenerationRunItem
            {
                Id = Guid.NewGuid(),
                RunId = run.Id,
                QuestionId = item.QuestionId,
                Status = AiGenerationRunItemStatuses.Invalid,
                RawAnswerJson = item.RawJson,
                ValidationMessage = responseErrors.FirstOrDefault(error => error.QuestionId == item.QuestionId)?.Message
                    ?? "Response was rejected because not all project questions were valid.",
                CreatedAt = DateTimeOffset.UtcNow
            }));
        }

        if (allOutputJsons.Count == 0)
        {
            runItems.Add(new AiGenerationRunItem
            {
                Id = Guid.NewGuid(),
                RunId = run.Id,
                Status = AiGenerationRunItemStatuses.Invalid,
                RawAnswerJson = run.RawProviderResponseJson,
                ValidationMessage = "AI provider returned no outputs.",
                CreatedAt = DateTimeOffset.UtcNow
            });
            validationSummaries.Add(new { isValid = false, errors = new[] { "AI provider returned no outputs." } });
        }

        dbContext.AiGenerationRunItems.AddRange(runItems);

        if (generatedResponses.Count == 0)
        {
            FailRun(run, "Kết quả đầu ra của AI không chứa bất kỳ phản hồi xem trước hợp lệ nào.");
            run.ValidationSummaryJson = JsonSerializer.Serialize(validationSummaries);
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, run.ErrorMessage, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return ToResponse(run, missingCredits, account?.Balance ?? 0, []);
        }

        dbContext.GeneratedResponses.AddRange(generatedResponses);
        var creditsUsed = generatedResponses.Count * multiplier;
        var creditResult = await creditService.DeductUsageCreditsAsync(
            currentUser.UserId,
            creditsUsed,
            $"Đã tạo {generatedResponses.Count} phản hồi xem trước AI.",
            nameof(AiGenerationRun),
            run.Id,
            cancellationToken);

        if (creditResult is null)
        {
            foreach (var response in generatedResponses)
            {
                dbContext.GeneratedResponses.Remove(response);
            }

            foreach (var item in runItems.Where(item => item.GeneratedResponseId is not null))
            {
                item.GeneratedResponseId = null;
                item.Status = AiGenerationRunItemStatuses.Invalid;
                item.ValidationMessage = "Credit deduction failed; preview was not stored.";
            }

            FailRun(run, "Không đủ credit để lưu bản xem trước AI.");
            run.ValidationSummaryJson = JsonSerializer.Serialize(validationSummaries);
            await WriteUsageLogAsync(projectId, 0, UsageLogStatuses.Failed, run.ErrorMessage, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            return ToResponse(run, Math.Max(0, request.Count * multiplier), account?.Balance ?? 0, []);
        }

        run.GeneratedCount = generatedResponses.Count;
        run.CreditsUsed = creditsUsed;
        run.ValidationSummaryJson = JsonSerializer.Serialize(validationSummaries);
        CompleteRun(run, generatedResponses.Count == request.Count
            ? AiGenerationRunStatuses.Succeeded
            : AiGenerationRunStatuses.Partial);

        await WriteUsageLogAsync(
            projectId,
            creditsUsed,
            UsageLogStatuses.Success,
            "Xem các câu trả lời AI đã tạo.",
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(
            run,
            missingCredits,
            creditResult.Value.Account.Balance,
            generatedResponses.Select(response => response.Id).ToList());
    }

    private async Task<decimal> GetCurrentBalanceAsync(CancellationToken cancellationToken)
    {
        var account = await dbContext.UserCreditAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.UserId == currentUser.UserId, cancellationToken);

        return account?.Balance ?? 0;
    }

    private static string NormalizeMode(string? mode) => mode?.Trim() ?? string.Empty;

    private static bool IsSupportedMode(string mode) =>
        mode is AiPromptProfileModes.Option2 or AiPromptProfileModes.Option3;

    private static int GetMultiplier(string mode) =>
        mode == AiPromptProfileModes.Option3 ? 3 : 2;

    private static bool IsConfiguredProviderSetting(AiProviderSetting setting)
        => !string.IsNullOrWhiteSpace(setting.Provider) &&
           !string.IsNullOrWhiteSpace(setting.DefaultModel) &&
           !string.IsNullOrWhiteSpace(setting.EncryptedApiKey);

    private static string BuildPromptSnapshotJson(AiPromptProfile profile, IReadOnlyList<AiQuestionPrompt> questionPrompts) =>
        JsonSerializer.Serialize(new
        {
            profile.Id,
            profile.ProjectId,
            profile.UserId,
            profile.Mode,
            profile.AudienceJson,
            profile.GlobalPrompt,
            questions = questionPrompts.Select(prompt => new
            {
                prompt.Id,
                prompt.QuestionId,
                prompt.Prompt,
                prompt.UseAi
            })
        });

    private static string BuildQuestionSnapshotJson(IReadOnlyList<FormQuestion> questions) =>
        JsonSerializer.Serialize(questions.Select(question => new
        {
            id = question.Id,
            label = question.Label,
            entryId = question.EntryId,
            questionType = question.QuestionType,
            options = ReadOptions(question),
            required = question.Required,
            orderIndex = question.OrderIndex
        }));

    private static string BuildGuardPayload(AiPromptProfile profile, IReadOnlyList<AiQuestionPrompt> questionPrompts)
    {
        var prompts = questionPrompts
            .Where(prompt => prompt.UseAi && !string.IsNullOrWhiteSpace(prompt.Prompt))
            .Select(prompt => prompt.Prompt);

        return string.Join(
            "\n",
            new[] { profile.AudienceJson, profile.GlobalPrompt }.Concat(prompts).Where(item => !string.IsNullOrWhiteSpace(item)));
    }

    private static IReadOnlyList<string> ReadOptions(FormQuestion question)
    {
        if (string.IsNullOrWhiteSpace(question.OptionsJson))
        {
            return Array.Empty<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<string>>(question.OptionsJson) ?? Array.Empty<string>();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }

    private static List<RawAnswerItem> ReadRawAnswerItems(string outputJson)
    {
        var items = new List<RawAnswerItem>();
        try
        {
            using var document = JsonDocument.Parse(outputJson);
            if (!document.RootElement.TryGetProperty("answers", out var answers) ||
                answers.ValueKind != JsonValueKind.Array)
            {
                return items;
            }

            foreach (var answer in answers.EnumerateArray())
            {
                Guid? questionId = null;
                if (answer.ValueKind == JsonValueKind.Object &&
                    answer.TryGetProperty("questionId", out var questionIdElement) &&
                    questionIdElement.ValueKind == JsonValueKind.String &&
                    Guid.TryParse(questionIdElement.GetString(), out var parsedQuestionId))
                {
                    questionId = parsedQuestionId;
                }

                items.Add(new RawAnswerItem(questionId, answer.GetRawText()));
            }
        }
        catch (JsonException)
        {
            return items;
        }

        return items;
    }

    private static string BuildPreviewText(IReadOnlyList<GeneratedAnswerResponse> answers) =>
        string.Join("; ", answers.Select(answer => $"{answer.Label}: {string.Join(", ", answer.Values)}"));

    private static void StartRun(AiGenerationRun run)
    {
        if (run.Status != AiGenerationRunStatuses.Pending)
        {
            throw new InvalidOperationException("AI generation run can only start from Pending.");
        }

        run.Status = AiGenerationRunStatuses.Running;
        run.StartedAt = DateTimeOffset.UtcNow;
    }

    private static void CompleteRun(AiGenerationRun run, string status)
    {
        if (run.Status != AiGenerationRunStatuses.Running)
        {
            throw new InvalidOperationException("AI generation run can only complete from Running.");
        }

        run.Status = status;
        run.CompletedAt = DateTimeOffset.UtcNow;
    }

    private static void FailRun(AiGenerationRun run, string errorMessage)
    {
        run.GeneratedCount = 0;
        run.CreditsUsed = 0;
        run.ErrorMessage = errorMessage;
        CompleteRun(run, AiGenerationRunStatuses.Failed);
    }

    private async Task WriteUsageLogAsync(
        Guid projectId,
        int creditsUsed,
        string status,
        string description,
        CancellationToken cancellationToken)
    {
        dbContext.UsageLogs.Add(new UsageLog
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            ToolName = "FormAutomation",
            Action = "AiGenerateResponses",
            CreditsUsed = creditsUsed,
            Status = status,
            Description = description,
            ProjectId = projectId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await Task.CompletedTask;
    }

    private static AiGenerateResponsesResponse ToResponse(
        AiGenerationRun run,
        int missingCredits,
        decimal balanceAfter,
        IReadOnlyList<Guid> generatedPreviewIds) =>
        new(
            run.Id,
            run.Status,
            run.RequestedCount,
            run.GeneratedCount,
            run.Multiplier,
            run.CreditsUsed,
            missingCredits,
            balanceAfter,
            generatedPreviewIds);


    private async Task<AiProviderGenerateResult> GenerateBatchAsync(
        AiProviderGenerateRequest request,
        SemaphoreSlim semaphore,
        CancellationToken cancellationToken)
    {
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            return await providerAdapter.GenerateAsync(request, cancellationToken);
        }
        finally
        {
            semaphore.Release();
        }
    }
    private sealed record RawAnswerItem(Guid? QuestionId, string RawJson);
}
