import { defineConfig, devices } from "@playwright/test";

// Start the intended build explicitly. This runner never reuses an unknown server.
export default defineConfig({
  testDir: "./tests",
  testMatch: "homepage-compact.spec.ts",
  workers: 1,
  timeout: 30000,
  reporter: "line",
  outputDir: "../../artifacts/reports/homepage-compact/test-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.HOMEPAGE_TEST_BASE_URL ?? "http://localhost:3035",
    screenshot: "only-on-failure"
  }
});
