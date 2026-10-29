import { expect, test, type Page } from "@playwright/test";

// Mock API evidence only. All mutation requests are intercepted; no provider is called.
const packages = Array.from({ length: 5 }, (_, index) => ({
  id: `package-${index + 1}`, name: `Gói credit ${index + 1}`, credits: (index + 1) * 100,
  price: (index + 1) * 50000, isActive: true
}));
const summary = { currentCreditBalance: 99999645, totalCreditsDeposited: 100000000, totalCreditsUsed: 355, pendingTopupOrders: 0, recentUsageLogs: [], recentTopupOrders: [] };

async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "ui-fixture", email: "ui@example.test", fullName: "Người dùng thử", role: "User", accessToken: "fixture", refreshToken: "fixture",
    accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
  })));
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") throw new Error("Unexpected API mutation in UI fixture");
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === "/api/packages" ? packages : path === "/api/dashboard/summary" ? summary : { items: [], totalItems: 0, totalPages: 0, page: 1 } });
  });
}

test("390x844 five-package topup keeps selected package, amount and payment action in the initial viewport", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const writes: unknown[] = [];
  await page.route("**/api/topup-orders/payos", route => {
    writes.push({ method: route.request().method(), body: route.request().postDataJSON() });
    return route.fulfill({ status: 400, json: { title: "Mock checkout: no payment created" } });
  });
  await page.goto("/dashboard/top-up");
  const payment = page.getByRole("heading", { name: "Thanh toán PayOS", exact: true }).locator("../..");
  await expect(payment).toContainText("50.000");
  for (const control of [payment.getByText("Gói credit 1", { exact: true }).first(), payment.getByText(/50\.000/), payment.getByRole("button", { name: "Tạo liên kết thanh toán", exact: true })]) {
    const box = (await control.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
  }
  await expect(page.locator("button[aria-pressed]")).toHaveCount(5);
  await payment.getByRole("button", { name: "Gói credit 1", exact: true }).click();
  await payment.getByRole("option", { name: "Gói credit 5", exact: true }).click();
  await expect(payment).toContainText("250.000");
  await expect(payment).toContainText("500 credit");
  await payment.getByRole("button", { name: "Tạo liên kết thanh toán", exact: true }).click();
  await expect.poll(() => writes).toEqual([{ method: "POST", body: { packageId: "package-5" } }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("large dashboard balances stay on a readable single line at narrow and laptop widths", async ({ page }) => {
  await setup(page);
  for (const width of [320, 390, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dashboard");
    const balance = page.getByText("99.999.645", { exact: true });
    await expect(balance).toBeVisible();
    const geometry = await balance.evaluate(element => ({ height: element.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(element).lineHeight), width: element.getBoundingClientRect().width, scrollWidth: element.scrollWidth }));
    expect(geometry.height).toBeLessThanOrEqual(geometry.lineHeight + 1);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
