import { expect, test } from "@playwright/test";

const packages = [
  { id: "inactive", name: "Gói ngừng bán", credits: 10, price: 10000, isActive: false },
  { id: "small", name: "Gói cơ bản", credits: 100, price: 50000, isActive: true },
  { id: "large", name: "Gói mở rộng", credits: 500, price: 200000, isActive: true }
];
const orders = Array.from({ length: 23 }, (_, index) => ({ id: `order-${String(index).padStart(3, "0")}`, packageId: "small", packageName: `Gói lịch sử ${index}`, credits: 100, amount: 50000, status: index === 0 ? "Pending" : "Approved", paymentMethod: "Manual", paymentNote: "Nội dung giao dịch\n" + "Ghi chú dài để kiểm tra cuộn. ".repeat(40), evidenceFileId: null, createdAt: new Date(Date.UTC(2026, 9, index + 1)).toISOString() }));

for (const width of [1440, 320]) test(`topup selection, history pagination and shared details at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 320 ? 640 : 1000 });
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "user", email: "user@example.invalid", fullName: "Người dùng", role: "User", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  let list = [...orders]; const writes: unknown[] = []; const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/**", async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") {
      writes.push(request.postDataJSON());
      return route.fulfill({ status: 400, json: { title: "Chưa cấu hình thanh toán thử" } });
    }
    await route.fulfill({ json: path === "/api/packages" ? packages
      : path === "/api/topup-orders" ? { items: list }
      : path.startsWith("/api/topup-orders/") ? orders[22]
      : { currentCreditBalance: 30, totalCreditsDeposited: 30, totalCreditsUsed: 0, pendingTopupOrders: 1, recentTopupOrders: [], recentUsageLogs: [] } });
  });
  await page.goto("/dashboard/top-up");
  const small = page.getByRole("button", { name: /Gói cơ bản/ });
  await expect(small).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Gói ngừng bán/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Gói mở rộng/ }).click();
  await expect(small).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Tạo liên kết thanh toán", exact: true }).click();
  await expect.poll(() => writes.length).toBe(1); expect(writes[0]).toEqual({ packageId: "large" });
  await page.getByText("Yêu cầu đối soát thủ công", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Gửi yêu cầu đối soát", exact: true })).toBeDisabled();
  // A pending order on the last page still prevents another manual request.
  await expect(page.getByText(/Bạn đang có một yêu cầu đối soát thủ công/)).toBeVisible();
  const detailButtons = page.getByRole("button", { name: width === 320 ? "Xem chi tiết" : "Xem chi tiết yêu cầu", exact: true });
  await expect(detailButtons).toHaveCount(10);
  await expect(page.getByText("Trang 1/3 · 23 kết quả", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await expect(page.getByText("Trang 2/3 · 23 kết quả", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await expect(detailButtons).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Sau", exact: true })).toBeDisabled();
  await detailButtons.first().click();
  const dialog = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp", exact: true });
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  await expect(dialog.getByRole("button", { name: "Đóng", exact: true })).toBeInViewport();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().height <= innerHeight - 16)).toBe(true);
  expect(await dialog.locator("[data-popup-frame]").evaluate(el => el.scrollHeight <= el.clientHeight)).toBe(true);
  await page.screenshot({ path: `${process.env.TEMP}/formauto-topup-detail-${width}.png` });
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  list = orders.slice(0, 2);
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.getByText("Trang 1/1 · 2 kết quả", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { document.querySelector("details")!.open = false; window.scrollTo(0, 0); });
  await page.screenshot({ path: `${process.env.TEMP}/formauto-topup-${width}.png`, fullPage: true });
  await page.goto("/dashboard/top-up/order-022");
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/top-up$/);
  expect(errors).toEqual([]);
});

test("topup error retries and empty packages/history disable payment", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "user", role: "User", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  let fail = true;
  await page.route("**/api/**", route => route.fulfill(fail ? { status: 500, json: { title: "Fixture failure" } } : { json: new URL(route.request().url()).pathname === "/api/packages" ? [] : { items: [], currentCreditBalance: 0 } }));
  await page.goto("/dashboard/top-up");
  await expect(page.getByText("Không tải được dữ liệu nạp credit.", { exact: true })).toBeVisible();
  fail = false; await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByText("Hiện chưa có gói credit khả dụng.", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa có yêu cầu nạp", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo liên kết thanh toán", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sau", exact: true })).toBeDisabled();
});
