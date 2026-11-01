import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const evidence = resolve(__dirname, "../../../artifacts/reports/ui-refinement-2026-10-28/admin-c/fixtures");
const email = "nguoi-quan-tri-co-dia-chi-email-rat-dai-de-kiem-tra@example.invalid";
const packageName = "Gói nghiên cứu dành cho nhóm có tên rất dài và nhiều thành viên";
const model = "fixture-model-with-a-very-long-name-for-admin-layout-verification";
const payment = { id: "payment", topupOrderId: "order", userId: "user", userEmail: email, provider: "PayOS", providerOrderCode: "123456789012", providerPaymentLinkId: "link", amount: 2147483647, credits: 2147483647, currency: "VND", providerStatus: "Paid", topupOrderStatus: "Approved", createdAt: "2026-10-08T00:00:00Z", lastWebhookAt: null };
const summary = { totalRevenue: 2147483647, creditSold: 2147483647, creditUsed: 100, successfulTopupOrders: 100, pendingTopupOrders: 20, failedPayments: 2, recentPayments: [payment] };
const stats = { totalRuns: 100, successfulRuns: 90, failedRuns: 10, totalCreditsUsed: 2147483647, totalPreviewsGenerated: 1000, totalUsers: 50, modeBreakdown: [{ mode: "FullAi", runs: 100, creditsUsed: 100 }], providerPerformance: [{ provider: "Fixture", model, successfulRuns: 90, failedRuns: 10, avgDurationMs: 500 }], topUsers: [{ userId: "user", email, runs: 100, creditsUsed: 100 }], recentRuns: [], usageByDay: [] };
const routes = ["", "payments", "manual-credits", "packages", "revenue", "ai-usage", "ai-provider-settings", "payos-settings"];

async function setup(page: Page, failurePath = "") {
  mkdirSync(evidence, { recursive: true });
  const writes: string[] = [];
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "admin", email: "admin@example.invalid", fullName: "Quản trị thử", role: "Admin", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") writes.push(path);
    if (path === failurePath) return route.fulfill({ status: 503, json: { message: "Fixture unavailable" } });
    const json = path === "/api/admin/revenue/summary" ? summary
      : path === "/api/admin/payments" ? { items: [payment] }
      : path === "/api/admin/packages" ? { items: [{ id: "package", name: packageName, credits: 2147483647, price: 2147483647, isActive: true, createdAt: "2026-10-08T00:00:00Z" }] }
      : path === "/api/admin/topup-orders/manual" ? []
      : path === "/api/admin/ai-usage" ? stats
      : path === "/api/admin/ai-provider-settings" ? { provider: "Fixture", baseUrl: "https://gateway.example.invalid/very-long-endpoint-for-layout-verification/v1", defaultModel: model, allowedModels: [model], hasApiKey: true, apiKeyPreview: "fixture-hidden", isEnabled: true }
      : path === "/api/admin/payment-providers/payos" ? { provider: "PayOS", clientId: "fixture-client", returnUrl: "https://example.invalid/return", cancelUrl: "https://example.invalid/cancel", hasApiKey: true, hasChecksumKey: true, isEnabled: true }
      : path === "/api/profile" ? { id: "admin", email: "admin@example.invalid", fullName: "Quản trị thử", role: "Admin" }
      : { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 };
    await route.fulfill({ json });
  });
  return writes;
}

test("390px admin task content follows compact summaries within the first viewport", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, marker] of [["", "123456789012"], ["packages", packageName], ["manual-credits", "Cộng credit"]]) {
    await page.goto(`/admin/${path}`);
    const target = path === "manual-credits" ? page.getByRole("button", { name: marker, exact: true }) : page.getByText(marker, { exact: true }).first();
    await expect(target).toBeVisible();
    const box = (await target.boundingBox())!;
    expect(box.y + box.height, `${path || "overview"}: task content should fit at 390×844`).toBeLessThanOrEqual(844);
  }
});

test("mobile AI tabs remain touch sized and long saved models remain readable", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/ai-usage");
  const tab = page.getByRole("button", { name: "Lịch sử", exact: true });
  await expect(tab).toBeVisible();
  expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await tab.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Lịch sử AI generation" })).toBeVisible();
  await page.goto("/admin/ai-provider-settings");
  await expect(page.getByLabel("Model mặc định", { exact: true })).toHaveValue(model);
  const saved = page.getByText(model, { exact: true }).last();
  await expect(saved).toBeVisible();
  expect(await saved.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test("failed AI statistics remain an error instead of an empty dataset", async ({ page }) => {
  await setup(page, "/api/admin/ai-usage");
  await page.goto("/admin/ai-usage");
  await expect(page.getByText("Không tải được thống kê AI.", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa có dữ liệu AI", { exact: true })).toHaveCount(0);
});

test("admin data pages distinguish loading and failed reads from empty results", async ({ page }) => {
  await setup(page);
  const states = [
    ["", "/api/admin/revenue/summary", "Đang tải thanh toán...", "Không tải được tổng quan quản trị. Bấm “Làm mới” để thử lại."],
    ["payments", "/api/admin/payments", "Đang tải thanh toán...", "Không tải được danh sách thanh toán. Tải lại trang để thử lại."],
    ["packages", "/api/admin/packages", "Đang tải gói credit...", "Không tải được danh sách gói credit. Tải lại trang để thử lại."],
    ["revenue", "/api/admin/revenue/summary", "Đang tải báo cáo doanh thu...", "Không tải được báo cáo doanh thu. Bấm “Làm mới báo cáo” để thử lại."],
    ["ai-provider-settings", "/api/admin/ai-provider-settings", "Đang tải cấu hình AI...", "Không tải được cấu hình AI. Bấm “Làm mới” để thử lại."],
    ["payos-settings", "/api/admin/payment-providers/payos", "Đang tải cấu hình PayOS...", "Không tải được cấu hình PayOS. Bấm “Làm mới” để thử lại."]
  ];
  for (const [slug, endpoint, loading, error] of states) {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(`**${endpoint}`, async route => { await gate; await route.fulfill({ status: 503, json: { message: "Fixture unavailable" } }); });
    await page.goto(`/admin/${slug}`);
    await expect(page.getByText(loading, { exact: true })).toBeVisible();
    release();
    await expect(page.getByText(error, { exact: true })).toBeVisible();
    if (slug.endsWith("settings")) await expect(page.getByRole("button", { name: "Lưu thay đổi", exact: true })).toBeDisabled();
    await page.screenshot({ path: resolve(evidence, `error-${slug || "overview"}.png`) });
    await page.unroute(`**${endpoint}`);
  }
});

test("manual payment decisions preserve review details and write payloads in isolated fixtures", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const order = { id: "order-fixture", userId: "user", userEmail: email, packageId: "package", packageName, credits: 2147483647, amount: 2147483647, status: "Pending", paymentMethod: "Manual", paymentNote: "Nội dung đối soát được giữ nguyên", createdAt: "2026-10-08T00:00:00Z" };
  const writes: Array<{ path: string; body: unknown }> = [];
  await page.route("**/api/admin/topup-orders/**", async route => {
    const request = route.request();
    if (request.method() !== "GET") writes.push({ path: new URL(request.url()).pathname, body: request.postDataJSON() });
    await route.fulfill({ json: request.method() === "GET" ? [order] : {} });
  });
  for (const action of ["reject", "approve"]) {
    await page.goto("/admin/manual-credits");
    await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp" });
    await expect(dialog).toHaveAttribute("data-popup-phase", "open");
    await expect(dialog.getByText(order.paymentNote, { exact: true })).toBeVisible();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const reject = dialog.getByRole("button", { name: "Từ chối yêu cầu", exact: true });
    await expect(reject).toBeDisabled();
    if (action === "reject") {
      await dialog.getByPlaceholder("Lý do từ chối", { exact: true }).fill("Cần kiểm tra lại minh chứng");
      await reject.click();
    } else await dialog.getByRole("button", { name: "Duyệt và cộng credit", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
  expect(writes).toEqual([
    { path: "/api/admin/topup-orders/order-fixture/reject", body: { paymentNote: "Cần kiểm tra lại minh chứng" } },
    { path: "/api/admin/topup-orders/order-fixture/approve", body: { paymentNote: order.paymentNote } }
  ]);
});

test("manual grants require a selected recipient and retain credit ledger request fields", async ({ page }) => {
  await setup(page);
  const writes: unknown[] = [];
  await page.route("**/api/admin/credit-operations/users**", route => route.fulfill({ json: { items: [{ id: "recipient", email: "recipient@example.invalid", fullName: "Người nhận thử" }] } }));
  await page.route("**/api/admin/credit-operations/manual-grants", async route => {
    const request = route.request();
    if (request.method() === "POST") writes.push(request.postDataJSON());
    await route.fulfill({ json: request.method() === "POST" ? { userEmail: "recipient@example.invalid", balanceAfter: 125 } : { items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } });
  });
  await page.goto("/admin/manual-credits");
  const grant = page.getByRole("button", { name: "Cộng credit", exact: true });
  await expect(grant).toBeDisabled();
  await page.getByPlaceholder("Tìm email người dùng", { exact: true }).fill("recipient@example.invalid");
  await page.getByRole("option").filter({ hasText: "recipient@example.invalid" }).click();
  await page.getByLabel("Số credit", { exact: true }).fill("25");
  await expect(grant).toBeDisabled();
  await page.getByLabel("Lý do cộng credit", { exact: true }).fill("Hỗ trợ nội bộ có lý do");
  await grant.click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes).toEqual([{ userId: "recipient", credits: 25, reason: "Hỗ trợ nội bộ có lý do" }]);
});

for (const width of [320, 390, 768, 1024, 1366, 1920]) test(`admin long data stays within the document at ${width}px`, async ({ page }) => {
  const writes = await setup(page);
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => { if (response.url().includes("/_next/") && response.status() >= 400) failures.push(`Chunk ${response.status()}`); });
  await page.setViewportSize({ width, height: width < 768 ? 844 : 768 });
  const geometry = [];
  mkdirSync(evidence, { recursive: true });
  for (const route of routes) {
    await page.goto(`/admin/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    if (route === "ai-provider-settings") await expect(page.getByLabel("Model mặc định", { exact: true })).toHaveValue(model);
    if (route === "payos-settings") await expect(page.getByLabel("Client ID", { exact: true })).toHaveValue("fixture-client");
    if (route === "packages") await expect(width >= 768 ? page.getByRole("cell", { name: packageName, exact: true }) : page.getByText(packageName, { exact: true }).first()).toBeVisible();
    if (route === "ai-usage") await expect(page.getByText("Tổng lượt AI", { exact: true })).toBeVisible();
    const measurement = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, heading: getComputedStyle(document.querySelector("h1")!).fontSize, regions: [...document.querySelectorAll('[role="region"][aria-label="Bảng dữ liệu"]')].filter(el => el.getBoundingClientRect().height > 0).map(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth, tabIndex: (el as HTMLElement).tabIndex })) }));
    geometry.push({ route, ...measurement });
    expect(measurement.documentWidth, route).toBeLessThanOrEqual(width);
    for (const region of measurement.regions) expect(region.tabIndex).toBe(0);
    if (route === "payments" && width === 768) {
      const table = page.getByRole("region", { name: "Bảng dữ liệu", exact: true });
      await table.focus(); await page.keyboard.press("ArrowRight");
      await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
      await table.evaluate(el => { el.scrollLeft = 0; });
    }
    if (width === 390 || width === 1366) await page.screenshot({ path: resolve(evidence, `${route || "overview"}-${width}.png`) });
  }
  writeFileSync(resolve(evidence, `geometry-${width}.json`), JSON.stringify(geometry, null, 2));
  expect(failures).toEqual([]); expect(writes).toEqual([]);
});
