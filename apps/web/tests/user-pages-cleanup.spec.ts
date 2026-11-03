import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../artifacts/reports/ui-cleanup-2026-11-02");
const fixtures = JSON.parse(readFileSync(resolve(root, "fixture-data.json"), "utf8")).fixtures;
const longModel = "model-" + "very-long-model-name-".repeat(8);
const stats = { totalRuns: 3, successfulRuns: 2, failedRuns: 1, totalCreditsUsed: 8, totalPreviewsGenerated: 4,
  modeBreakdown: [{ mode: "FullAi", runs: 2, creditsUsed: 4 }, { mode: "CustomAi", runs: 1, creditsUsed: 4 }],
  usageByDay: [{ date: "2026-11-02", runs: 3, creditsUsed: 8 }],
  recentRuns: [{ id: "long-run-id-001", mode: "FullAi", status: "Failed", provider: "FixtureProvider", model: longModel,
    requestedCount: 3, generatedCount: 1, creditsUsed: 2, durationMs: 1250, createdAt: "2026-11-02T00:00:00Z", projectName: "Khảo sát", errorMessage: "Provider unavailable" }] };

async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "ui-audit-fixture", role: "User", email: "audit@example.invalid", fullName: "Người dùng", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") throw new Error("User-page fixture must never write");
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === "/api/dashboard/ai-usage" ? stats : fixtures[path] ?? { items: [], page: 1, totalItems: 0, totalPages: 0 } });
  });
}

async function capture(page: Page, name: string) {
  const phase = process.env.USER_CLEANUP_PHASE ?? "user-final";
  const folder = resolve(root, phase); mkdirSync(folder, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(folder, `${name}.png`), fullPage: true, animations: "disabled" });
}

test("populated user AI records keep errors visible and secondary metadata accessible", async ({ page }) => {
  await setup(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard/ai-usage");
    await expect(page.getByRole("heading", { name: "Lượt AI gần đây", exact: true })).toBeVisible();
    await capture(page, `ai-populated-${width}`);
    if (width < 768) {
      const record = page.locator("article").first();
      await expect(record.getByText("Thất bại", { exact: true })).toBeVisible();
      await expect(record.locator("p.text-destructive")).toBeVisible();
      await expect(record.getByText(longModel, { exact: false })).not.toBeVisible();
      await record.getByText("Chi tiết lượt AI", { exact: true }).click();
      await expect(record).toContainText("long-run-id-001");
      await expect(record.getByText(longModel, { exact: false })).toBeVisible();
      await expect(record).toContainText("1.3s");
      await capture(page, `ai-details-${width}`);
    } else {
      await expect(page.getByRole("table")).toContainText("long-run-id-001");
      await expect(page.getByRole("table")).toContainText(longModel);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("history filter names stay stable and ledger labels describe current page", async ({ page }) => {
  await setup(page);
  for (const [path, label] of [["/dashboard/usage-logs", "Lọc loại thao tác"], ["/dashboard/credit-transactions", "Lọc loại giao dịch"]]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Credit giao dịch đầu trang", { exact: true })).toBeVisible();
  await expect(page.getByText("Credit mới nhất", { exact: true })).toHaveCount(0);
});

test("user AI labels support current and legacy modes without inventing unknown labels", async ({ page }) => {
  await setup(page);
  const modes = ["Option2", "Option3", "FullAi", "CustomAi", "FutureMode"];
  await page.route("**/api/dashboard/ai-usage", route => route.fulfill({ json: {
    ...stats, totalRuns: 5,
    modeBreakdown: modes.map(mode => ({ mode, runs: 1, creditsUsed: 2 })),
    recentRuns: modes.map((mode, i) => ({ ...stats.recentRuns[0], id: `mode-run-${i}`, mode, status: "Succeeded", errorMessage: null }))
  } }));
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard/ai-usage");
    await expect(page.getByRole("heading", { name: "Lượt AI gần đây", exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("heading", { name: "AI mặc định", exact: true })).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "AI tùy chỉnh", exact: true })).toHaveCount(2);
    if (width < 768) {
      const records = page.locator("article");
      for (const [i, label] of ["AI mặc định", "AI tùy chỉnh", "AI mặc định", "AI tùy chỉnh", "FutureMode"].entries()) {
        await expect(records.nth(i).getByText(label, { exact: true })).toBeVisible();
        await expect(records.nth(i).getByText("Thành công", { exact: true })).toBeVisible();
      }
    } else {
      const rows = page.getByRole("table").locator("tbody tr");
      await expect(rows.first()).toContainText("AI mặc định");
      await expect(rows.last()).toContainText("FutureMode");
      await expect(rows.first()).toContainText("Thành công");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, `ai-modes-${width}`);
  }
});

test("mobile topup copy action is touch-sized and routed detail has settled content", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/dashboard/top-up");
  const copy = page.getByRole("button", { name: "Sao chép đầy đủ mã yêu cầu", exact: true }).filter({ visible: true }).first();
  await expect(copy).toBeVisible();
  const box = (await copy.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole("button", { name: "Chọn gói thanh toán", exact: true })).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard/top-up/fixture-order");
    const dialog = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp", exact: true });
    await expect(dialog).toHaveAttribute("data-popup-phase", "open");
    await expect(dialog).toContainText("50.000");
    await capture(page, `topup-detail-settled-${width}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
