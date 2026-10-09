import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { publicPagePaths } from "@/lib/public-page-inventory";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPagePaths.map((path) => ({ url: `${siteUrl}${path}` }));
}
