import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { seoPageSlugs } from "@/lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...seoPageSlugs.map((slug) => ({
      url: `${siteUrl}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${siteUrl}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];
}
