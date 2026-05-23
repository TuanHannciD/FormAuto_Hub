import type { Metadata } from "next";
import { SeoKeywordPage } from "@/components/seo-keyword-page";
import { buildSeoMetadata, seoPages } from "@/lib/seo-pages";

const config = seoPages["google-forms/sheets-report"];

export const metadata: Metadata = buildSeoMetadata(config);

export default function SheetsReportPage() {
  return <SeoKeywordPage config={config} />;
}
