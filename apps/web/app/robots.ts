import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/"
      },
      {
        userAgent: ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot"],
        allow: "/"
      },
      {
        userAgent: [
          "GPTBot",
          "Google-Extended",
          "ClaudeBot",
          "CCBot",
          "Bytespider",
          "Amazonbot",
          "Applebot-Extended",
          "meta-externalagent"
        ],
        disallow: "/"
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
