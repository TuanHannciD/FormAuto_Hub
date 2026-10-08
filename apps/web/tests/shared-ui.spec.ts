import { expect, test, type Page } from "@playwright/test";

// API fixtures keep these shared-component checks independent of live accounts/payments.
const profile = { id: "fixture", email: "fixture@example.invalid", fullName: "UI Fixture", role: "Admin", createdAt: "2026-10-07T00:00:00Z" };
const stats = { totalRuns: 10, successfulRuns: 8, failedRuns: 2, totalCreditsUsed: 20, totalPreviewsGenerated: 10, totalUsers: 1, modeBreakdown: [], recentRuns: [], usageByDay: [], providerPerformance: [], topUsers: [] };

async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "fixture", email: "fixture@example.invalid", fullName: "UI Fixture", role: "Admin",
    accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
  })));
  const writes: unknown[] = [];
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") writes.push(request.postDataJSON());
    await route.fulfill({ json: path === "/api/profile" ? { ...profile, ...(request.method() === "PUT" ? request.postDataJSON() : {}) }
      : path.includes("ai-usage") ? stats : { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
  });
  return writes;
}

test("profile popup uses shared surfaces and controls while preserving its save request", async ({ page }) => {
  const writes = await setup(page);
  await page.goto("/dashboard/credit-transactions");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  await expect(page.getByLabel("Họ tên")).toHaveValue(profile.fullName);
  const card = page.getByRole("dialog", { name: "Tài khoản", exact: true }).locator("div").filter({ has: page.getByRole("heading", { name: "Tài khoản", exact: true }) }).first();
  expect(await card.evaluate(element => getComputedStyle(element).borderRadius)).toBe("16px");
  expect(await page.getByLabel("Họ tên").evaluate(element => getComputedStyle(element).borderRadius)).toBe("12px");
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  await page.getByLabel("Họ tên").fill("Tên mới");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(page.getByText("Đã lưu hồ sơ.", { exact: true })).toBeVisible();
  expect(writes).toEqual([{ fullName: "Tên mới" }]);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("shared dropdown still selects options and closes on Escape", async ({ page }) => {
  await setup(page);
  await page.goto("/dashboard/credit-transactions");
  const trigger = page.getByRole("button", { name: "Tất cả loại", exact: true });
  await trigger.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.getByRole("option", { name: "Credit đã sử dụng", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  const selected = page.getByRole("button", { name: "Credit đã sử dụng", exact: true });
  expect(await selected.evaluate(element => getComputedStyle(element).borderRadius)).toBe("12px");
  await selected.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("shared admin dialog opens and cancels without creating a package", async ({ page }) => {
  const writes = await setup(page);
  await page.goto("/admin/packages");
  await page.getByRole("button", { name: "Tạo gói mới", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tạo gói credit", exact: true })).toBeVisible();
  await expect(page.getByLabel("Tên gói", { exact: true })).toBeVisible();
  await page.getByLabel("Tên gói", { exact: true }).fill("Gói thử");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Tạo gói credit", exact: true })).toHaveCount(0);
  expect(writes).toEqual([]);
});

test("topup detail popups share closing motion in dashboard, admin and routed detail", async ({ page }) => {
  const writes = await setup(page);
  const order = { id: "popup-order", packageId: "popup-package", packageName: "Gói popup thử", credits: 100, amount: 50000, status: "Approved", paymentMethod: "Manual", paymentNote: "Kiểm thử popup", evidenceFileId: null, createdAt: "2026-10-07T00:00:00Z", userEmail: "fixture@example.invalid" };
  await page.route("**/api/packages", route => route.fulfill({ json: [] }));
  await page.route("**/api/topup-orders", route => route.fulfill({ json: { items: [order] } }));
  await page.route("**/api/topup-orders/popup-order", route => route.fulfill({ json: order }));
  await page.route("**/api/admin/topup-orders/manual", route => route.fulfill({ json: [order] }));
  await page.route("**/api/dashboard/summary", route => route.fulfill({ json: { currentCreditBalance: 10, totalCreditsDeposited: 10, totalCreditsUsed: 0, pendingTopupOrders: 0, recentTopupOrders: [order], recentUsageLogs: [] } }));
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const path of ["/dashboard/top-up", "/admin/manual-credits", "/dashboard/top-up/popup-order"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    if (!path.endsWith("popup-order")) await page.getByRole("row").filter({ hasText: order.packageName }).getByRole("button").last().click();
    const dialog = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp", exact: true });
    await expect(dialog).toHaveAttribute("data-popup-phase", "open");
    await expect(dialog).toContainText(order.packageName);
    const frames = await dialog.evaluate(async element => {
      Array.from(element.querySelectorAll("button")).find(button => button.textContent === "Đóng")!.click();
      const frames = [];
      while (element.isConnected) {
        await new Promise(requestAnimationFrame);
        if (!element.isConnected) break;
        frames.push({ height: element.getBoundingClientRect().height, hidden: getComputedStyle(element.querySelector("[data-popup-content]")!).visibility === "hidden", phase: (element as HTMLElement).dataset.popupPhase });
      }
      return frames;
    });
    expect(frames.length).toBeGreaterThan(1);
    expect(frames.every(frame => frame.phase === "closing" && frame.hidden)).toBe(true);
    expect(frames.at(-1)!.height).toBeLessThan(frames[0].height - 10);
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    if (path.endsWith("popup-order")) await expect(page).toHaveURL(/\/dashboard\/top-up$/);
  }
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("admin approval retains the popup long enough to animate its automatic close", async ({ page }) => {
  await setup(page);
  let approved = false;
  const order = { id: "approve-popup", packageId: "popup-package", packageName: "Gói duyệt thử", credits: 100, amount: 50000, status: "Pending", paymentMethod: "Manual", paymentNote: "Kiểm thử", evidenceFileId: null, createdAt: "2026-10-07T00:00:00Z", userEmail: "fixture@example.invalid" };
  await page.route("**/api/admin/topup-orders/manual", route => route.fulfill({ json: [{ ...order, status: approved ? "Approved" : "Pending" }] }));
  await page.route("**/api/admin/topup-orders/approve-popup/approve", async route => { approved = true; await route.fulfill({ json: {} }); });
  await page.goto("/admin/manual-credits");
  await page.getByRole("row").filter({ hasText: order.packageName }).getByRole("button").last().click();
  const dialog = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp" });
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  const frames = await dialog.evaluate(async element => {
    Array.from(element.querySelectorAll("button")).find(button => button.textContent?.trim() === "Duyệt và cộng credit")!.click();
    const frames = [];
    for (let i = 0; i < 120 && element.isConnected; i++) {
      await new Promise(requestAnimationFrame);
      if (element.isConnected && (element as HTMLElement).dataset.popupPhase === "closing") frames.push({ height: element.getBoundingClientRect().height, hidden: getComputedStyle(element.querySelector("[data-popup-content]")!).visibility === "hidden" });
    }
    return frames;
  });
  expect(approved).toBe(true);
  expect(frames.length).toBeGreaterThan(1);
  expect(frames.every(frame => frame.hidden)).toBe(true);
  expect(frames.at(-1)!.height).toBeLessThan(frames[0].height - 10);
  await expect(dialog).toHaveCount(0);
});

test("dashboard and admin AI pages use the same metric component and actual values", async ({ page }) => {
  await setup(page);
  for (const path of ["/dashboard/ai-usage", "/admin/ai-usage"]) {
    await page.goto(path);
    const metric = page.locator("section").filter({ has: page.getByText("Tổng lượt AI", { exact: true }) });
    await expect(metric).toContainText("10");
    expect(await metric.evaluate(element => getComputedStyle(element).borderRadius)).toBe("16px");
  }
});
