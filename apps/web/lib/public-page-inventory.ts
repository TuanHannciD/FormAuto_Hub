import { seoPageSlugs } from "@/lib/seo-pages";

// Omit lastModified until a significant content-edit date is known for each page.
export const publicPagePaths = ["/", ...seoPageSlugs.map((slug) => `/${slug}`)];
