import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { seoPageSlugs } from "@/lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...seoPageSlugs.map((slug) => ({
      url: `${siteUrl}/${slug}`,
      lastModified: now,
      changeFrequency: slug === "anti-abuse" ? ("monthly" as const) : ("weekly" as const),
      priority: slug === "google-forms/sample-data" ? 0.9 : slug === "anti-abuse" ? 0.7 : 0.8
    }))
  ];
}
