using System.Globalization;
using FormAutoHub.Api.Domain;

namespace FormAutoHub.Api.Services;

// Public diagnostics are reconstructed from recognized causes; historical/provider text is never forwarded.
internal static class AiGenerationErrorMessages
{
    public static string? ToPublicMessage(string status, string? storedMessage)
    {
        if (status != AiGenerationRunStatuses.Failed) return null;

        var known = storedMessage switch
        {
            "AI provider generation timed out." => "Dịch vụ AI đã hết thời gian chờ. Vui lòng thử lại sau. Không trừ credit.",
            "Không kết nối được với dịch vụ AI. Không trừ credit." => "Không kết nối được với dịch vụ AI. Vui lòng thử lại sau. Không trừ credit.",
            "Nội dung trả lời của AI không đúng định dạng. Không trừ credit." => "Nội dung trả lời của AI không đúng định dạng. Kiểm tra hướng dẫn tạo câu trả lời. Không trừ credit.",
            "Phản hồi từ dịch vụ AI không phải JSON hợp lệ. Không trừ credit." => "Phản hồi từ dịch vụ AI không đọc được. Vui lòng thử lại sau. Không trừ credit.",
            "Prompt is required." => "Nhập hướng dẫn tạo câu trả lời AI trước khi tiếp tục. Không trừ credit.",
            "Prompt requests unsafe or forbidden AI behavior." => "Hướng dẫn tạo câu trả lời không đáp ứng quy tắc an toàn. Vui lòng chỉnh sửa hướng dẫn. Không trừ credit.",
            "Không đủ credit để tạo bản xem trước AI." or "Không đủ credit để lưu bản xem trước AI." => "Không đủ credit để tạo hoặc lưu bản xem trước AI. Vui lòng kiểm tra số dư. Không trừ credit.",
            "Kết quả đầu ra của AI không chứa bất kỳ phản hồi xem trước hợp lệ nào." => "AI chưa tạo được phản hồi xem trước hợp lệ. Kiểm tra hướng dẫn và cấu hình câu hỏi. Không trừ credit.",
            _ => null
        };
        if (known is not null) return known;

        // Match the complete existing generated HTTP diagnostic, including exactly three status digits.
        const string prefix = "Dịch vụ AI trả về lỗi HTTP ";
        const string suffix = ". Không trừ credit.";
        if (storedMessage is not null && storedMessage.Length == prefix.Length + 3 + suffix.Length &&
            storedMessage.StartsWith(prefix, StringComparison.Ordinal) && storedMessage.EndsWith(suffix, StringComparison.Ordinal) &&
            int.TryParse(storedMessage.AsSpan(prefix.Length, 3), NumberStyles.None, CultureInfo.InvariantCulture, out var code) && code is >= 400 and <= 599)
        {
            return code switch
            {
                401 => "Dịch vụ AI không chấp nhận cấu hình xác thực. Liên hệ quản trị viên kiểm tra cấu hình. Không trừ credit.",
                403 => "Dịch vụ AI từ chối quyền truy cập. Liên hệ quản trị viên kiểm tra quyền. Không trừ credit.",
                408 or 504 => "Dịch vụ AI đã hết thời gian chờ. Vui lòng thử lại sau. Không trừ credit.",
                429 => "Dịch vụ AI đang giới hạn yêu cầu. Vui lòng chờ rồi thử lại. Không trừ credit.",
                >= 500 => "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau. Không trừ credit.",
                _ => "Dịch vụ AI từ chối yêu cầu. Liên hệ quản trị viên kiểm tra cấu hình. Không trừ credit."
            };
        }

        return "Không tạo được bản xem trước AI. Nếu lỗi tiếp diễn, vui lòng liên hệ quản trị viên.";
    }
}
