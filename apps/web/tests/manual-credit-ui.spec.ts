import { expect, test } from "@playwright/test";

const historyItem = { id: "history-1", userId: "user", userEmail: "recipient@example.invalid", userFullName: "Người nhận", credits: 12, balanceAfter: 30, reason: "Hỗ trợ học tập\nGhi chú đầy đủ cho giao dịch", createdAt: "2026-10-08T00:00:00Z", adminId: "admin", adminEmail: "actor@example.invalid", adminFullName: "Quản trị" };
const order = { id: "order-test", packageId: "package", userEmail: "recipient@example.invalid", packageName: "Gói credit thử", credits: 100, amount: 50000, status: "Pending", paymentMethod: "Manual", paymentNote: "Nội dung chuyển khoản thử", evidenceFileId: "proof", createdAt: "2026-10-08T00:00:00Z" };

for (const width of [1440, 320]) test(`history and compact order/grant details work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 320 ? 640 : 900 });
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({ userId: "admin", email: "actor@example.invalid", fullName: "Quản trị", role: "Admin", accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })));
  let writes = 0;
  await page.route("**/api/**", async route => {
    const request = route.request(); const url = new URL(request.url());
    if (request.method() !== "GET") writes++;
    if (url.pathname.includes("/evidence/")) return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=", "base64") });
    const matched = !url.searchParams.get("search") || url.searchParams.get("search") === "học tập";
    const json = url.pathname.endsWith("/topup-orders/manual") ? [order]
      : url.pathname.endsWith("/manual-grants") ? { items: matched ? [historyItem] : [], page: 1, pageSize: 10, totalItems: matched ? 1 : 0, totalPages: matched ? 1 : 0 }
      : { items: [] };
    await route.fulfill({ json });
  });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/admin/manual-credits");
  await expect(page.getByRole("heading", { name: "Lịch sử cộng credit thủ công", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xem chi tiết cộng credit", exact: true }).click();
  const grant = page.getByRole("dialog", { name: "Chi tiết cộng credit", exact: true });
  await expect(grant).toHaveAttribute("data-popup-phase", "open");
  await expect(grant.getByText(historyItem.adminEmail, { exact: true })).toBeVisible();
  await expect(grant.getByText(historyItem.reason, { exact: true })).toBeVisible();
  await expect(grant.getByRole("button", { name: "Đóng", exact: true })).toBeInViewport();
  await page.screenshot({ path: `${process.env.TEMP}/formauto-manual-grant-${width}.png` });
  await page.keyboard.press("Escape"); await expect(grant).toHaveCount(0);
  await page.getByLabel("Tìm lịch sử cộng credit").fill("no-match");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page.getByText("Chưa có giao dịch cộng credit phù hợp", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: width === 320 ? "Xem chi tiết" : "Xem chi tiết yêu cầu", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết yêu cầu nạp" });
  await expect(detail).toHaveAttribute("data-popup-phase", "open");
  await expect(detail.getByRole("button", { name: "Duyệt và cộng credit", exact: true })).toBeInViewport();
  await expect(detail.getByRole("button", { name: "Đóng", exact: true })).toBeInViewport();
  await expect(detail.getByRole("img", { name: "Ảnh minh chứng nạp credit", exact: true })).toBeVisible();
  expect(await detail.evaluate(element => element.getBoundingClientRect().height <= innerHeight - 16)).toBe(true);
  expect(await detail.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: `${process.env.TEMP}/formauto-manual-detail-${width}.png` });
  await page.keyboard.press("Escape"); await expect(detail).toHaveCount(0);
  expect(errors).toEqual([]); expect(writes).toBe(0);
});
