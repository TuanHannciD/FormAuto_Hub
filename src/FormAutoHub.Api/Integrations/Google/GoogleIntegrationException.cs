using System.Net;

namespace FormAutoHub.Api.Integrations.Google;

// Internal provider boundary only; no new API field, status or persisted lifecycle.
internal sealed class GoogleIntegrationException(
    string operation,
    GoogleIntegrationFailureKind kind,
    HttpStatusCode? statusCode = null,
    Exception? innerException = null)
    : HttpRequestException(SafeMessage(kind), innerException, statusCode)
{
    public string Operation { get; } = operation;
    public GoogleIntegrationFailureKind Kind { get; } = kind;

    public static GoogleIntegrationException FromStatus(string operation, HttpStatusCode status) =>
        new(operation, status switch
        {
            HttpStatusCode.Unauthorized => GoogleIntegrationFailureKind.Authorization,
            HttpStatusCode.Forbidden => GoogleIntegrationFailureKind.Forbidden,
            HttpStatusCode.NotFound => GoogleIntegrationFailureKind.NotFound,
            HttpStatusCode.TooManyRequests => GoogleIntegrationFailureKind.RateLimited,
            _ when (int)status >= 500 => GoogleIntegrationFailureKind.Unavailable,
            _ => GoogleIntegrationFailureKind.InvalidResponse
        }, status);

    private static string SafeMessage(GoogleIntegrationFailureKind kind) => kind switch
    {
        GoogleIntegrationFailureKind.Configuration => "Kết nối Google chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.",
        GoogleIntegrationFailureKind.Authorization => "Quyền truy cập Google không còn hợp lệ. Vui lòng liên kết lại tài khoản Google.",
        GoogleIntegrationFailureKind.Forbidden => "Tài khoản Google chưa có quyền thực hiện thao tác này. Hãy kiểm tra quyền của biểu mẫu.",
        GoogleIntegrationFailureKind.NotFound => "Không tìm thấy biểu mẫu Google hoặc biểu mẫu không còn được chia sẻ với tài khoản này.",
        GoogleIntegrationFailureKind.RateLimited => "Google đang giới hạn số yêu cầu. Vui lòng chờ và thử lại sau.",
        GoogleIntegrationFailureKind.InvalidResponse => "Google trả dữ liệu không hợp lệ. Vui lòng thử tải lại sau.",
        _ => "Chưa kết nối được với Google. Vui lòng thử lại sau."
    };
}
