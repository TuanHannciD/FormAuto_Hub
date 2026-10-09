import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const siteName = "FormAuto Hub";
export const websiteId = `${siteUrl}/#website`;
export const applicationId = `${siteUrl}/#application`;

export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: true }
};

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    name: siteName,
    url: `${siteUrl}/`,
    inLanguage: "vi-VN"
  };
}

export function applicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": applicationId,
    name: siteName,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/`,
    inLanguage: "vi-VN",
    description:
      "FormAuto Hub helps users create sample data for Google Forms to test forms, preview responses, demo Google Sheets dashboards, and prepare reports safely.",
    featureList: [
      "Phân tích Google Forms",
      "Cấu hình quy tắc trả lời",
      "Xem trước phản hồi trước khi gửi",
      "Theo dõi credit và nhật ký sử dụng"
    ]
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
