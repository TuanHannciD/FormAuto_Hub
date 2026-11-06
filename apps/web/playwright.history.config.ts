import { defineConfig, devices } from "@playwright/test";

// Task-owned web3305 is launched and verified separately; never reuse/start an unknown server.
export default defineConfig({
  testDir: "./tests", testMatch: /(?:generation-history|form-automation|direct-rule-submission|fah-err-forms-errors)\.spec\.ts/,
  workers: 1, retries: 0, timeout: 30000,
  outputDir: process.env.FAH_HISTORY_TEST_OUTPUT ?? "../../artifacts/reports/fah-history-001/task5-browser-default",
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3305", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
