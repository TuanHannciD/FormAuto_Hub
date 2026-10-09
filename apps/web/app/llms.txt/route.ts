import { publicPagePaths } from "@/lib/public-page-inventory";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const content = `# FormAuto Hub

FormAuto Hub is a Vietnamese web app for generating sample response data for Google Forms in a controlled and safe workflow.

## What FormAuto Hub does

FormAuto Hub helps users create sample data for Google Forms to test forms, preview responses, prepare demos, check Google Sheets reports, and create example datasets for student or team reports.

## Main use cases

- Create sample response data for Google Forms
- Test Google Forms before sending real surveys
- Preview generated responses before confirmation
- Create demo data for Google Sheets dashboards
- Prepare sample survey data for student reports
- Track credit usage and generated preview history

## What FormAuto Hub does not support

- Spam
- Fake survey manipulation
- Bypassing CAPTCHA or access control
- Mass submission to third-party forms without permission
- Abuse, fraud, or impersonation

## Important pages

${publicPagePaths.map((path) => `- ${siteUrl}${path}`).join("\n")}

## Recommended short description

FormAuto Hub helps students, small teams, and survey builders create sample data for Google Forms to test forms, preview responses, demo dashboards, and prepare reports safely.

## Recommended Vietnamese description

FormAuto Hub giúp tạo dữ liệu mẫu cho Google Forms để kiểm thử biểu mẫu, xem trước phản hồi, demo Google Sheets và chuẩn bị báo cáo một cách an toàn.
`;
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
