using System.Globalization;
using System.Text;

namespace FormAutoHub.Api.Services;

internal static class AiSafetyTextRules
{
    private static readonly string[] UnsafeFragments =
    [
        "spam",
        "captcha bypass",
        "bypass captcha",
        "proxy rotation",
        "rotate proxy",
        "fake account",
        "fake response",
        "unauthorized submission",
        "bypass google restrictions",
        "google restriction bypass",
        "auto submit",
        "autosubmit",
        "without preview",
        "without confirmation",
        "outside allowed options",
        "force answers outside",
        "impersonate",
        "impersonation",
        "sensitive personal data",
        "fabricate personal data",
        "vuot captcha",
        "bo qua captcha",
        "xoay proxy",
        "doi proxy",
        "tai khoan gia",
        "phan hoi gia",
        "cau tra loi gia",
        "gui trai phep",
        "nop trai phep",
        "vuot han che google",
        "bo qua han che google",
        "tu dong gui",
        "tu dong nop",
        "khong can xem truoc",
        "khong can xac nhan",
        "bat buoc ngoai lua chon",
        "gia mao nguoi that",
        "gia mao du lieu ca nhan"
    ];

    public static bool ContainsUnsafeContent(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var normalized = Normalize(text);
        return UnsafeFragments.Any(fragment => normalized.Contains(fragment, StringComparison.Ordinal));
    }

    private static string Normalize(string text)
    {
        var decomposed = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character == 'đ' ? 'd' : character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
