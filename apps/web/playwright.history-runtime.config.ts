import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "history-runtime.spec.ts", workers: 1, retries: 0, timeout: 30000,
  outputDir: process.env.FAH_HISTORY_TEST_OUTPUT ?? "../../artifacts/reports/fah-history-001/task6-browser-runtime",
  reporter: [["list"]],
  // Auth sessions are real synthetic accounts; traces can contain tokens, so never record them.
  use: { baseURL: "http://localhost:3305", trace: "off", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
