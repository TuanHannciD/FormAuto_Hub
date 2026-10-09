import { defineConfig, devices } from "@playwright/test";

// Run against an explicitly started production build; never reuse a dev server silently.
export default defineConfig({
  testDir: "./tests",
  testMatch: "seo.spec.ts",
  workers: 1,
  timeout: 30000,
  reporter: "line",
  outputDir: "../../artifacts/reports/seo-geo/test-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.SEO_TEST_BASE_URL ?? "http://localhost:3034"
  }
});
