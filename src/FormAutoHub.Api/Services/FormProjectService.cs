using System.Text.Json;
using FormAutoHub.Api.Auth;
using FormAutoHub.Api.Contracts;
using FormAutoHub.Api.Data;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Integrations.GoogleForms;
using Microsoft.EntityFrameworkCore;

namespace FormAutoHub.Api.Services;

public interface IFormProjectService
{
    Task<AnalyzeFormResponse> AnalyzeAsync(AnalyzeFormRequest request, CancellationToken cancellationToken);
    Task<FormQuestionListResponse?> GetQuestionsAsync(Guid projectId, CancellationToken cancellationToken);
}

public sealed class FormProjectService(
    FormAutoHubDbContext dbContext,
    ICurrentUserContext currentUser,
    IGoogleFormsClient googleFormsClient,
    ILogger<FormProjectService>? logger = null) : IFormProjectService
{
    public async Task<AnalyzeFormResponse> AnalyzeAsync(AnalyzeFormRequest request, CancellationToken cancellationToken)
    {
        var formUrl = request.FormUrl?.Trim() ?? string.Empty;
        var name = request.Name?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(formUrl))
        {
            await WriteUsageLogAsync(null, UsageLogStatuses.Failed, "Vui lòng nhập đường dẫn biểu mẫu Google Forms.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Vui lòng nhập đường dẫn biểu mẫu Google Forms.");
        }

        if (formUrl.Length > Phase4SafetyLimits.MaxFormUrlLength)
        {
            await WriteUsageLogAsync(null, UsageLogStatuses.Failed, "Đường dẫn biểu mẫu quá dài. Hãy kiểm tra lại đường dẫn.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Đường dẫn biểu mẫu quá dài. Hãy kiểm tra lại đường dẫn.");
        }

        if (name.Length > Phase4SafetyLimits.MaxProjectNameLength)
        {
            await WriteUsageLogAsync(null, UsageLogStatuses.Failed, "Tên dự án quá dài. Hãy rút ngắn tên dự án.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Tên dự án quá dài. Hãy rút ngắn tên dự án.");
        }

        try
        {
            var analysis = await googleFormsClient.AnalyzeAsync(formUrl, cancellationToken);
            var project = new FormProject
            {
                Id = Guid.NewGuid(),
                UserId = currentUser.UserId,
                Name = string.IsNullOrWhiteSpace(name) ? analysis.Title : name,
                FormUrl = formUrl,
                FormTitle = analysis.Title,
                FormActionUrl = analysis.ActionUrl,
                Status = FormProjectStatuses.Analyzed,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.FormProjects.Add(project);

            var questions = analysis.Questions
                .Where(question => Phase3RuleHelpers.IsSupportedQuestionType(question.QuestionType))
                .Select(question => new FormQuestion
                {
                    Id = Guid.NewGuid(),
                    ProjectId = project.Id,
                    Label = question.Label,
                    EntryId = question.EntryId,
                    QuestionType = question.QuestionType,
                    OptionsJson = JsonSerializer.Serialize(question.Options),
                    Required = question.Required,
                    OrderIndex = question.OrderIndex
                })
                .ToList();

            if (questions.Count == 0)
            {
                project.Status = FormProjectStatuses.Unsupported;
            }

            dbContext.FormQuestions.AddRange(questions);
            await WriteUsageLogAsync(project.Id, UsageLogStatuses.Success, "Phân tích biểu mẫu đã hoàn tất.", cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            return new AnalyzeFormResponse(
                project.Id,
                project.Name,
                project.FormUrl,
                project.FormTitle,
                project.Status,
                questions.Select(question => question.ToResponse()).ToList(),
                project.CreatedAt);
        }
        catch (Exception exception) when (exception is InvalidOperationException or HttpRequestException)
        {
            var message = exception is GoogleFormsClient.AnalysisException
                ? exception.Message
                : "Chưa phân tích được biểu mẫu. Hãy kiểm tra quyền truy cập và thử lại sau.";
            logger?.LogWarning("AnalyzeForm failed with {FailureType} and HTTP {StatusCode}",
                exception.GetType().Name, (exception as HttpRequestException)?.StatusCode);
            await WriteUsageLogAsync(null, UsageLogStatuses.Failed, message, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException(message, exception);
        }
    }

    public async Task<FormQuestionListResponse?> GetQuestionsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var ownsProject = await dbContext.FormProjects
            .AnyAsync(project => project.Id == projectId && project.UserId == currentUser.UserId, cancellationToken);

        if (!ownsProject)
        {
            return null;
        }

        var questions = await dbContext.FormQuestions
            .AsNoTracking()
            .Where(question => question.ProjectId == projectId)
            .OrderBy(question => question.OrderIndex)
            .ToListAsync(cancellationToken);

        return new FormQuestionListResponse(questions.Select(question => question.ToResponse()).ToList());
    }

    private Task WriteUsageLogAsync(Guid? projectId, string status, string description, CancellationToken cancellationToken)
    {
        dbContext.UsageLogs.Add(new UsageLog
        {
            Id = Guid.NewGuid(),
            UserId = currentUser.UserId,
            ToolName = "FormAutomation",
            Action = "AnalyzeForm",
            CreditsUsed = 0,
            Status = status,
            Description = description,
            ProjectId = projectId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        return Task.CompletedTask;
    }
}
