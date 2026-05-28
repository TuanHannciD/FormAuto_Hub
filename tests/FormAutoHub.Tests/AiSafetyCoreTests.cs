using System.Text.Json;
using FormAutoHub.Api.Domain;
using FormAutoHub.Api.Entities;
using FormAutoHub.Api.Services;

namespace FormAutoHub.Tests;

public sealed class AiSafetyCoreTests
{
    [Fact]
    public void PromptGuard_AllowsSafePrompt()
    {
        var guard = new AiPromptGuardService();

        var result = guard.Validate("Create natural short answers for Vietnamese students aged 18 to 24, using a friendly tone.");

        Assert.True(result.IsAllowed);
        Assert.Null(result.RejectionReason);
    }

    [Fact]
    public void PromptGuard_RejectsUnsafePrompt()
    {
        var guard = new AiPromptGuardService();

        var result = guard.Validate("Create many fake responses and bypass Google restrictions so the form looks popular.");

        Assert.False(result.IsAllowed);
        Assert.NotNull(result.RejectionReason);
    }

    [Fact]
    public void OutputValidator_AcceptsChoiceValueOnlyWhenItMatchesStoredOptionExactly()
    {
        var questionId = Guid.NewGuid();
        var validator = new AiOutputValidator();
        var output = JsonSerializer.Serialize(new
        {
            answers = new[]
            {
                new { questionId, values = new[] { "Có" } }
            }
        });

        var result = validator.Validate(output, [ChoiceQuestion(questionId, ["Có", "Không"])]);

        Assert.True(result.IsFullyValid);
        var answer = Assert.Single(result.ValidAnswers);
        Assert.Equal("Có", answer.Values.Single());
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void OutputValidator_RejectsChoiceValueOutsideStoredOptions()
    {
        var questionId = Guid.NewGuid();
        var validator = new AiOutputValidator();
        var output = JsonSerializer.Serialize(new
        {
            answers = new[]
            {
                new { questionId, values = new[] { "Co" } }
            }
        });

        var result = validator.Validate(output, [ChoiceQuestion(questionId, ["Có", "Không"])]);

        Assert.False(result.HasValidAnswers);
        var error = Assert.Single(result.Errors);
        Assert.Equal(questionId, error.QuestionId);
        Assert.Contains("match stored options", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void OutputValidator_RejectsInvalidSchema()
    {
        var validator = new AiOutputValidator();

        var result = validator.Validate("""{"items":[{"value":"A"}]}""", [ChoiceQuestion(Guid.NewGuid(), ["A"])]);

        Assert.False(result.HasValidAnswers);
        var error = Assert.Single(result.Errors);
        Assert.Contains("answers array", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void OutputValidator_RejectsUnsupportedQuestionType()
    {
        var questionId = Guid.NewGuid();
        var validator = new AiOutputValidator();
        var output = JsonSerializer.Serialize(new
        {
            answers = new[]
            {
                new { questionId, values = new[] { "A" } }
            }
        });
        var questions = new[]
        {
            new FormQuestion
            {
                Id = questionId,
                ProjectId = Guid.NewGuid(),
                Label = "Upload",
                EntryId = "entry.1",
                QuestionType = "FileUpload",
                OptionsJson = "[]",
                Required = true,
                OrderIndex = 0
            }
        };

        var result = validator.Validate(output, questions);

        Assert.False(result.HasValidAnswers);
        var error = Assert.Single(result.Errors);
        Assert.Equal(questionId, error.QuestionId);
        Assert.Equal("Unsupported question type.", error.Message);
    }

    [Fact]
    public void OutputValidator_RejectsCheckboxValuesOutsideStoredOptions()
    {
        var questionId = Guid.NewGuid();
        var validator = new AiOutputValidator();
        var output = JsonSerializer.Serialize(new
        {
            answers = new[]
            {
                new { questionId, values = new[] { "A", "D" } }
            }
        });

        var result = validator.Validate(output, [CheckboxQuestion(questionId, ["A", "B", "C"])]);

        Assert.False(result.HasValidAnswers);
        var error = Assert.Single(result.Errors);
        Assert.Equal(questionId, error.QuestionId);
        Assert.Contains("only stored options", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void OutputValidator_AcceptsMultipleChoiceGridRowOption()
    {
        var questionId = Guid.NewGuid();
        var validator = new AiOutputValidator();
        var output = JsonSerializer.Serialize(new
        {
            answers = new[]
            {
                new { questionId, values = new[] { "Column A" } }
            }
        });

        var result = validator.Validate(output, [GridQuestion(questionId, FormQuestionTypes.MultipleChoiceGrid, ["Column A", "Column B"])]);

        Assert.True(result.HasValidAnswers);
        Assert.Empty(result.Errors);
        var answer = Assert.Single(result.ValidAnswers);
        Assert.Equal(["Column A"], answer.Values);
    }

    [Fact]
    public void OutputValidator_AcceptsCheckboxGridRowOptions()
    {
        var questionId = Guid.NewGuid();
        var validator = new AiOutputValidator();
        var output = JsonSerializer.Serialize(new
        {
            answers = new[]
            {
                new { questionId, values = new[] { "Column A", "Column B" } }
            }
        });

        var result = validator.Validate(output, [GridQuestion(questionId, FormQuestionTypes.CheckboxGrid, ["Column A", "Column B"])]);

        Assert.True(result.HasValidAnswers);
        Assert.Empty(result.Errors);
        var answer = Assert.Single(result.ValidAnswers);
        Assert.Equal(["Column A", "Column B"], answer.Values);
    }

    private static FormQuestion ChoiceQuestion(Guid questionId, IReadOnlyList<string> options) =>
        new()
        {
            Id = questionId,
            ProjectId = Guid.NewGuid(),
            Label = "Question",
            EntryId = "entry.1",
            QuestionType = FormQuestionTypes.MultipleChoice,
            OptionsJson = JsonSerializer.Serialize(options),
            Required = true,
            OrderIndex = 0
        };

    private static FormQuestion CheckboxQuestion(Guid questionId, IReadOnlyList<string> options) =>
        new()
        {
            Id = questionId,
            ProjectId = Guid.NewGuid(),
            Label = "Question",
            EntryId = "entry.1",
            QuestionType = FormQuestionTypes.Checkbox,
            OptionsJson = JsonSerializer.Serialize(options),
            Required = true,
            OrderIndex = 0
        };

    private static FormQuestion GridQuestion(Guid questionId, string questionType, IReadOnlyList<string> options) =>
        new()
        {
            Id = questionId,
            ProjectId = Guid.NewGuid(),
            Label = "Grid question",
            EntryId = "entry.1",
            QuestionType = questionType,
            OptionsJson = JsonSerializer.Serialize(options),
            Required = true,
            OrderIndex = 0
        };
}
