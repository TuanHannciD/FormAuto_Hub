namespace FormAutoHub.Api.Services;

public sealed class SubmissionContractException(string code, int statusCode, Exception? innerException = null) : InvalidOperationException(code, innerException)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
