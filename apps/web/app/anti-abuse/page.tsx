import type { Metadata } from "next";
import { SeoKeywordPage } from "@/components/seo-keyword-page";
import { buildSeoMetadata, seoPages } from "@/lib/seo-pages";

const config = seoPages["anti-abuse"];

export const metadata: Metadata = buildSeoMetadata(config);

export default function AntiAbusePage() {
  return <SeoKeywordPage config={config} />;
}
