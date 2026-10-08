import { expect, test, type Page } from "@playwright/test";

const packageItem = { id: "admin-package", name: "Gói kiểm thử", credits: 100, price: 50000, isActive: true, createdAt: "2026-10-08T00:00:00Z" };
const payment = { id: "admin-payment", topupOrderId: "order", userId: "admin-user", userEmail: "admin@example.invalid", provider: "PayOS", providerOrderCode: "123456", providerPaymentLinkId: "link", amount: 50000, credits: 100, currency: "VND", providerStatus: "Paid", topupOrderStatus: "Approved", createdAt: "2026-10-08T00:00:00Z", lastWebhookAt: "2026-10-08T00:01:00Z" };
const ai = { provider: "OpenAI", displayName: "AI thử", hasApiKey: true, apiKeyPreview: "fixture-hidden", baseUrl: "", defaultModel: "fixture-model", allowedModels: ["fixture-model"], isEnabled: true, lastCheckStatus: "NotChecked", lastCheckMessage: "Chưa kiểm tra" };
const payos = { provider: "PayOS", clientId: "fixture-client", hasApiKey: true, hasChecksumKey: true, apiKeyPreview: "fixture-hidden", checksumKeyPreview: "fixture-hidden", returnUrl: "https://example.invalid/return", cancelUrl: "https://example.invalid/cancel", isEnabled: true, lastCheckStatus: "NotChecked", lastCheckMessage: "Chưa kiểm tra" };
const stats = { totalRuns: 10, successfulRuns: 8, failedRuns: 2, totalCreditsUsed: 20, totalPreviewsGenerated: 10, totalUsers: 1, modeBreakdown: [], recentRuns: [], usageByDay: [], providerPerformance: [], topUsers: [] };
const pages = [
  ["/admin", "Tổng quan quản trị"], ["/admin/payments", "Quản lý top-up và thanh toán"],
  ["/admin/manual-credits", "Đối soát và cộng credit thủ công"], ["/admin/packages", "Quản lý gói credit"],
  ["/admin/revenue", "Báo cáo doanh thu"], ["/admin/payos-settings", "Cấu hình PayOS"],
  ["/admin/ai-provider-settings", "Cấu hình Provider AI"], ["/admin/ai-usage", "Thống kê AI"]
] as const;

async function setup(page: Page, role = "Admin") {
  const writes: Array<{ path: string; body: unknown }> = [];
  await page.addInitScript(role => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "admin-user", email: "admin@example.invalid", fullName: "Quản trị thử", role, accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })), role);
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") writes.push({ path, body: request.postData() ? request.postDataJSON() : null });
    const json = path === "/api/admin/revenue/summary" ? { totalRevenue: 50000, creditSold: 100, creditUsed: 20, successfulTopupOrders: 1, pendingTopupOrders: 0, failedPayments: 0, recentPayments: [payment] }
      : path === "/api/admin/payments" ? { items: [payment] }
      : path === "/api/admin/packages" ? { items: [packageItem] }
      : path === "/api/admin/topup-orders/manual" ? []
      : path === "/api/admin/ai-provider-settings" ? { ...ai, ...(request.method() === "PUT" ? request.postDataJSON() : {}) }
      : path === "/api/admin/payment-providers/payos" ? { ...payos, ...(request.method() === "PUT" ? request.postDataJSON() : {}) }
      : path === "/api/admin/ai-usage" ? stats
      : path === "/api/profile" ? { id: "admin-user", email: "admin@example.invalid", fullName: "Quản trị thử", role, createdAt: "2026-10-08T00:00:00Z" }
      : { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };
    await route.fulfill({ json });
  });
  return writes;
}

for (const width of [1440, 320]) {
  test(`all admin routes render without overflow or runtime errors at ${width}px`, async ({ page }) => {
    const writes = await setup(page);
    await page.setViewportSize({ width, height: width === 320 ? 640 : 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) errors.push(`Chunk ${response.status()}`); });
    for (const [path, title] of pages) {
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Menu tài khoản", exact: true })).toBeVisible();
      if (path.endsWith("packages")) await expect(width >= 768 ? page.getByRole("cell", { name: packageItem.name, exact: true }) : page.getByText(packageItem.name, { exact: true }).first()).toBeVisible();
      if (path.endsWith("payos-settings")) await expect(page.getByLabel("Client ID", { exact: true })).toHaveValue(payos.clientId);
      if (path.endsWith("ai-provider-settings")) await expect(page.getByLabel("Model mặc định", { exact: true })).toHaveValue(ai.defaultModel);
      if (path.endsWith("ai-usage")) {
        await expect(page.getByText("Tổng lượt AI", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Lịch sử AI generation", exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
        await expect(page.getByText("Tổng lượt AI", { exact: true })).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors, path).toEqual([]);
      if (width === 1440) await expect(page.getByRole("navigation", { name: "Điều hướng quản trị" }).locator('[aria-current="page"]')).toHaveCount(1);
      if ((width === 1440 && path === "/admin") || (width === 320 && path === "/admin/payos-settings")) await page.screenshot({ path: `${process.env.TEMP}/formauto-admin-${width}.png`, fullPage: width === 1440 });
    }
    expect(writes).toEqual([]);
  });
}

test("admin mobile navigation changes routes, closes and keeps account popup accessible", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  const menu = page.getByRole("complementary", { name: "Menu di động" });
  await menu.getByRole("link", { name: "Gói credit", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/packages$/);
  await expect(menu).toHaveCount(0);
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Tài khoản" })).toHaveAttribute("data-popup-phase", "open");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Menu tài khoản", exact: true })).toBeFocused();
});

test("admin settings keep their save payloads after restyling", async ({ page }) => {
  const writes = await setup(page);
  await page.goto("/admin/ai-provider-settings");
  await expect(page.getByLabel("Model mặc định", { exact: true })).toHaveValue(ai.defaultModel);
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toEqual({ path: "/api/admin/ai-provider-settings", body: { provider: ai.provider, apiKey: "", defaultModel: ai.defaultModel, isEnabled: true, baseUrl: "" } });
  await page.goto("/admin/payos-settings");
  await expect(page.getByLabel("Client ID", { exact: true })).toHaveValue(payos.clientId);
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1]).toEqual({ path: "/api/admin/payment-providers/payos", body: { clientId: payos.clientId, apiKey: "", checksumKey: "", returnUrl: payos.returnUrl, cancelUrl: payos.cancelUrl, isEnabled: true } });
});

test("normal users still cannot render admin controls", async ({ page }) => {
  await setup(page, "User");
  await page.goto("/admin/packages");
  await expect(page.getByRole("heading", { name: "Bạn chưa có quyền admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo gói mới" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Điều hướng quản trị" })).toHaveCount(0);
});
