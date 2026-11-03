import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../artifacts/reports/ui-cleanup-2026-11-02");
const fixtures = JSON.parse(readFileSync(resolve(root, "fixture-data.json"), "utf8")).fixtures;
const model = "admin-model-" + "long-name-".repeat(12);
const runs = ["Option2", "Option3", "FullAi", "CustomAi", "FutureMode"].map((mode, i) => ({
  id: `admin-run-${i}`, mode, status: i === 1 ? "Failed" : "Succeeded", provider: "Fixture", model,
  generatedCount: i === 1 ? 0 : 2, requestedCount: 2, creditsUsed: 2, durationMs: 1250,
  createdAt: "2026-11-03T00:00:00Z", projectName: "Khảo sát admin"
}));
const stats = { ...fixtures["/api/admin/ai-usage"], modeBreakdown: runs.map(r => ({ mode: r.mode, runs: 2, creditsUsed: 4 })),
  providerPerformance: [{ provider: "Fixture", model, successfulRuns: 8, failedRuns: 2, avgDurationMs: 1250 }],
  topUsers: [{ userId: "fixture", email: "admin-audit@example.invalid", runs: 10, creditsUsed: 20 }],
  usageByDay: [{ date: "2026-11-03", runs: 10, creditsUsed: 20 }], recentRuns: runs };

async function setup(page: Page, failurePath = "") {
  const calls: URL[] = [];
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "ui-audit-fixture", role: "Admin", email: "admin@example.invalid", fullName: "Quản trị thử", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now()+3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now()+86400000).toISOString() })));
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") throw new Error("Read-only admin audit must not write");
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/ai-usage/runs")) calls.push(url);
    if (url.pathname === failurePath) return route.fulfill({ status: 503, json: { message: "Fixture failure" } });
    return route.fulfill({ json: url.pathname === "/api/admin/ai-usage" ? stats : url.pathname.endsWith("/ai-usage/runs")
      ? { items: runs, page: Number(url.searchParams.get("page") || 1), pageSize: 20, totalItems: 40, totalPages: 2 }
      : fixtures[url.pathname] ?? { items: [], page: 1, totalItems: 0, totalPages: 0 } });
  });
  return calls;
}
async function capture(page: Page, name: string) {
  const folder = resolve(root, process.env.ADMIN_CLEANUP_PHASE ?? "admin-after");
  mkdirSync(folder, { recursive: true });
  await page.screenshot({ path: resolve(folder, `${name}.png`), fullPage: true, animations: "disabled" });
}

test("capture all admin routes with populated AI data", async ({ page }) => {
  test.setTimeout(120000);
  await setup(page);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const heights: Record<string, number> = {};
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const slug of ["", "payments", "manual-credits", "packages", "revenue", "ai-usage", "ai-provider-settings", "payos-settings"]) {
      await page.goto(`/admin/${slug}`);
      await expect(page.locator("main h1")).toBeVisible();
      if (slug === "manual-credits") await expect(page.getByText("Chưa có yêu cầu đối soát", { exact: true })).toBeVisible();
      else if (slug === "ai-provider-settings") await expect(page.getByLabel("Model mặc định", { exact: true })).toHaveValue("fixture-model");
      else if (slug === "payos-settings") await expect(page.getByLabel("Client ID", { exact: true })).toHaveValue("fixture-client");
      else if (slug === "ai-usage") await expect(page.getByText("Tổng lượt AI", { exact: true })).toBeVisible();
      else if (slug === "packages") await expect(page.getByText("Cơ bản", { exact: true }).filter({ visible: true }).first()).toBeVisible();
      else if (slug === "revenue") await expect(page.getByText("50.000 ₫", { exact: true }).first()).toBeVisible();
      else await expect(page.getByText("123456", { exact: true }).filter({ visible: true }).first()).toBeVisible();
      await capture(page, `${slug || "overview"}-${width}`);
      heights[`${slug || "overview"}-${width}`] = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (slug === "ai-usage") {
        await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
        await expect(page.getByText("Trang 1/2 · 40 kết quả")).toBeVisible();
        await capture(page, `ai-history-${width}`);
      }
    }
  }
  expect(errors).toEqual([]);
  const folder=resolve(root, process.env.ADMIN_CLEANUP_PHASE ?? "admin-after");
  writeFileSync(resolve(folder, "heights.json"), JSON.stringify(heights, null, 2));
});

test("manual credit form keeps visible labels after entry", async ({ page }) => {
  await setup(page); await page.goto("/admin/manual-credits");
  await expect(page.getByRole("combobox", { name: "Email người nhận", exact: true })).toBeVisible();
  for (const text of ["Email người nhận", "Số credit", "Lý do cộng credit"]) {
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
  }
  await page.getByLabel("Số credit", { exact: true }).fill("20");
  await page.getByLabel("Lý do cộng credit", { exact: true }).fill("Điều chỉnh theo biên bản");
  await expect(page.getByText("Lý do cộng credit", { exact: true })).toBeVisible();
});

test("PayOS masks new secrets and does not invent an environment", async ({ page }) => {
  await setup(page); await page.goto("/admin/payos-settings");
  for (const name of ["API key", "Checksum key"]) {
    const input = page.getByLabel(name, { exact: true });
    await expect(input).toHaveAttribute("type", "password");
    await input.fill("fake-fixture-secret");
  }
  await expect(page.getByText("Môi trường", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Nếu để trống khóa bí mật khi lưu/)).toBeVisible();
});

test("AI history translates stored modes and preserves mobile technical details", async ({ page }) => {
  await setup(page); await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/admin/ai-usage");
  await expect(page.getByRole("heading", { name: "AI mặc định", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI tùy chỉnh", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
  const records = page.locator("article");
  await expect(records.first().getByText("AI mặc định", { exact: true })).toBeVisible();
  await expect(records.first().getByText("Thành công", { exact: true })).toBeVisible();
  await expect(records.nth(1).getByText("Thất bại", { exact: true })).toBeVisible();
  await expect(records.last().getByText("FutureMode", { exact: true })).toBeVisible();
  await expect(records.first().getByText(model, { exact: false })).not.toBeVisible();
  await records.first().getByText("Chi tiết lượt AI", { exact: true }).click();
  await expect(records.first().getByText(model, { exact: false })).toBeVisible();
  await expect(records.first()).toContainText("1.3s");
  await capture(page, "ai-details-320");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("AI filters apply only on request and reset pagination without duplicate GETs", async ({ page }) => {
  const calls = await setup(page); await page.goto("/admin/ai-usage");
  await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
  await expect(page.getByText("Trang 1/2 · 40 kết quả")).toBeVisible();
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await expect(page.getByText("Trang 2/2 · 40 kết quả")).toBeVisible();
  const count = calls.length;
  await page.getByLabel("Provider", { exact: true }).fill("Fixture");
  await page.getByLabel("Model", { exact: true }).fill("model-filter");
  await page.getByLabel("Chế độ", { exact: true }).selectOption("Option2");
  await page.getByLabel("Đến ngày", { exact: true }).focus();
  expect(calls).toHaveLength(count);
  await page.getByRole("button", { name: "Lọc", exact: true }).click();
  await expect(page.getByText("Trang 1/2 · 40 kết quả")).toBeVisible();
  await expect.poll(() => calls.length).toBe(count+1);
  expect(calls.at(-1)?.searchParams.get("mode")).toBe("Option2");
  expect(calls.at(-1)?.searchParams.get("provider")).toBe("Fixture");
  expect(calls.at(-1)?.searchParams.get("model")).toBe("model-filter");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect.poll(() => calls.length).toBe(count+2);
  expect(calls.at(-1)?.searchParams.has("mode")).toBe(false);
});

for (const [slug, endpoint, label] of [["payments", "/api/admin/payments", "Đã thanh toán"], ["packages", "/api/admin/packages", "Tổng gói"], ["manual-credits", "/api/admin/topup-orders/manual", "Yêu cầu đối soát"]]) {
  test(`${slug} metrics distinguish unknown from zero`, async ({ page }) => {
    await setup(page, endpoint);
    let release!: () => void; const gate = new Promise<void>(r => { release = r; });
    await page.route(`**${endpoint}`, async route => { await gate; await route.fulfill({ status: 503, json: { message: "Fixture failure" } }); });
    await page.goto(`/admin/${slug}`);
    const metric = page.getByText(label, { exact: true }).last().locator("../..");
    await expect(metric).toContainText("—");
    release();
    await expect(page.getByText(/Không tải được/).first()).toBeVisible();
    await expect(metric).toContainText("—");
  });
}
