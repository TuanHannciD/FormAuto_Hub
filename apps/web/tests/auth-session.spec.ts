import { expect, test } from "@playwright/test";

const session = () => ({
  userId: "fixture", email: "fixture@example.invalid", fullName: "Fixture", role: "User",
  accessToken: "old-access", refreshToken: "old-refresh",
  accessTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
  refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
});

test("expired stored session settles on login with one notification", async ({ page }) => {
  const expired = { ...session(), refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString() };
  await page.addInitScript(value => localStorage.setItem("formauto.auth.session", JSON.stringify(value)), expired);
  let refreshes = 0;
  await page.route("**/api/auth/refresh", async route => {
    refreshes++;
    await route.fulfill({ status: 401 });
  });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(1);
  await expect(page.locator("[data-sonner-toast]")).toContainText("Phiên đăng nhập đã hết hạn");
  expect(await page.evaluate(() => localStorage.getItem("formauto.auth.session"))).toBeNull();
  expect(refreshes).toBe(0);
});

test("parallel dashboard requests share refresh and keep the rotated session", async ({ page }) => {
  const old = session();
  await page.addInitScript(value => localStorage.setItem("formauto.auth.session", JSON.stringify(value)), old);
  let refreshes = 0;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/refresh") {
      refreshes++;
      await route.fulfill({ json: { ...old, accessToken: "new-access", refreshToken: "new-refresh", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString() } });
    } else {
      await route.fulfill({ json: path === "/api/packages" ? [] : path === "/api/topup-orders" ? { items: [] } : {
        currentCreditBalance: 5, totalCreditsDeposited: 0, totalCreditsUsed: 0,
        pendingTopupOrders: 0, recentUsageLogs: [], recentTopupOrders: []
      } });
    }
  });
  await page.goto("/dashboard/top-up");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("formauto.auth.session") ?? "null")?.refreshToken)).toBe("new-refresh");
  await expect(page).toHaveURL(/\/dashboard\/top-up$/);
  expect(refreshes).toBe(1);
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
});
