import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { AuthTokenResponse, TopupOrder } from "@/lib/api";

// Opt-in only: the state must describe disposable test accounts and an isolated SQL database.
const statePath = process.env.FORMAUTO_MANUAL_SMOKE_STATE;
test.skip(!statePath, "Requires isolated manual-credit runtime fixture.");

test("real API: upload, submit, inspect, approve and grant credits through the browser", async ({ browser }) => {
  const state = JSON.parse(readFileSync(statePath!, "utf8")) as { database: string; adminSession: AuthTokenResponse; userSession: AuthTokenResponse };
  expect(state.database).toMatch(/^FormAutoHub_ManualSmoke_[a-f0-9]{32}$/);
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  await context.route("https://localhost:7039/api/**", async route => {
    // Forward to the real isolated backend. No fabricated API responses.
    const response = await route.fetch({ url: route.request().url().replace(":7039/", ":7040/") });
    await route.fulfill({ response });
  });
  async function open(session: AuthTokenResponse, path: string) {
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(session => localStorage.setItem("formauto.auth.session", JSON.stringify(session)), session);
    await page.goto(`http://localhost:3020${path}`);
    return page;
  }
  const historyUrl = "https://localhost:7040/api/admin/credit-operations/manual-grants";
  const deniedHistory = await context.request.get(historyUrl, { headers: { Authorization: `Bearer ${state.userSession.accessToken}` } });
  expect(deniedHistory.status()).toBe(403);
  const grantHistory = await context.request.get(`${historyUrl}?search=smoke%20grant&pageSize=1`, { headers: { Authorization: `Bearer ${state.adminSession.accessToken}` } });
  expect(grantHistory.status()).toBe(200);
  expect(await grantHistory.json()).toMatchObject({ page: 1, pageSize: 1, totalItems: 1, items: [{ reason: "smoke grant", credits: 7, adminEmail: state.adminSession.email }] });
  const user = await open(state.userSession, "/dashboard/top-up");
  const summaryResponse = await context.request.get("https://localhost:7040/api/dashboard/summary", { headers: { Authorization: `Bearer ${state.userSession.accessToken}` } });
  expect(summaryResponse.status()).toBe(200);
  const initialBalance = (await summaryResponse.json()).currentCreditBalance as number;
  await user.getByText("Yêu cầu đối soát thủ công", { exact: true }).click();
  await user.locator('input[type="file"]').setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=", "base64") });
  await expect(user.getByText("Đã tải ảnh minh chứng.", { exact: true })).toBeVisible();
  await user.getByPlaceholder("Nhập nội dung chuyển khoản, ngân hàng hoặc thông tin để quản trị viên đối soát.").fill("Browser smoke transfer");
  const created = user.waitForResponse(response => new URL(response.url()).pathname === "/api/topup-orders" && response.request().method() === "POST");
  await user.getByRole("button", { name: "Gửi yêu cầu đối soát", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const order = await response.json() as TopupOrder;
  expect(order.evidenceFileId).toBeTruthy();
  const admin = await open(state.adminSession, "/admin/manual-credits");
  await admin.getByRole("row").filter({ hasText: order.id.slice(0, 8).toUpperCase() }).getByRole("button").last().click();
  const dialog = admin.getByRole("dialog", { name: "Chi tiết yêu cầu nạp" });
  await expect(dialog).toHaveAttribute("data-popup-phase", "open");
  const image = dialog.getByRole("img", { name: "Ảnh minh chứng nạp credit", exact: true });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await dialog.getByRole("button", { name: "Duyệt và cộng credit", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(admin.getByText("Đã duyệt yêu cầu đối soát và cộng credit.", { exact: true })).toBeVisible();
  await admin.getByRole("combobox").fill(state.userSession.email);
  await admin.getByRole("option", { name: new RegExp(state.userSession.email) }).click();
  await admin.getByLabel("Số credit", { exact: true }).fill("3");
  await admin.getByLabel("Lý do cộng credit", { exact: true }).fill("Browser grant smoke");
  const granted = admin.waitForResponse(response => response.url().includes("/manual-grants"));
  await admin.getByRole("button", { name: "Cộng credit", exact: true }).click();
  expect((await granted).status()).toBe(200);
  await expect(admin.getByLabel("Số credit", { exact: true })).toHaveValue("");
  await expect(admin.getByRole("cell", { name: "Browser grant smoke", exact: true }).first()).toBeVisible();
  await admin.setViewportSize({ width: 320, height: 640 });
  expect(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await admin.screenshot({ path: `${process.env.TEMP}/formauto-manual-live-mobile.png`, fullPage: true });
  await user.reload();
  await expect(user.getByText(`${initialBalance + 13} credit`, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});
