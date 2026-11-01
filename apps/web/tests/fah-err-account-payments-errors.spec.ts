import { expect, test, type Page, type Route } from "@playwright/test";

const creditPackage = { id: "fixture-package", name: "Gói thử", credits: 100, price: 50000, isActive: true, createdAt: "2026-10-30T00:00:00Z" };
const order = { id: "confirmed-order-001", packageId: creditPackage.id, packageName: creditPackage.name, credits: 100, amount: 50000, status: "Pending", paymentMethod: "Manual", paymentNote: "Nội dung thử", evidenceFileId: null, createdAt: "2026-10-30T00:00:00Z" };
const profile = { id: "fixture-user", email: "fixture@example.invalid", fullName: "Tài khoản thử", role: "User", googleLinked: true, createdAt: "2026-10-30T00:00:00Z" };
const summary = { currentCreditBalance: 30, totalCreditsDeposited: 30, totalCreditsUsed: 0, pendingTopupOrders: 0, recentTopupOrders: [], recentUsageLogs: [] };
const privateMarker = "private-provider-fixture-ERR-F";
const providerSettings = { provider: "OpenAI", clientId: "fixture", displayName: "Fixture", hasApiKey: true, hasChecksumKey: true, apiKeyPreview: "***", checksumKeyPreview: "***", returnUrl: "https://example.invalid/return", cancelUrl: "https://example.invalid/cancel", baseUrl: "https://example.invalid/v1", defaultModel: "fixture-model", allowedModels: ["fixture-model"], isEnabled: false, lastCheckStatus: "NotChecked", lastCheckMessage: "", lastCheckedAt: null };

async function setup(page: Page, role = "User", intercept?: (route: Route, path: string) => Promise<boolean>) {
  const errors: string[] = []; const chunks: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.text().includes(privateMarker)) errors.push(message.text()); });
  page.on("response", response => { if (response.url().includes("/_next/static/") && response.status() >= 400) chunks.push(response.url()); });
  await page.addInitScript(({ role, profile }) => localStorage.setItem("formauto.auth.session", JSON.stringify({ ...profile, userId: profile.id, role, accessToken: "fixture-access", refreshToken: "fixture-refresh", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString() })), { role, profile });
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (await intercept?.(route, path)) return;
    const value = path === "/api/profile" ? profile : path === "/api/packages" ? [creditPackage]
      : path === "/api/dashboard/summary" ? summary : path === "/api/topup-orders" ? { items: [] }
      : path.startsWith("/api/topup-orders/") ? order : path === "/api/admin/packages" ? { items: [creditPackage] }
      : path === "/api/admin/topup-orders/manual" ? [{ ...order, userEmail: profile.email }]
      : path === "/api/admin/credit-operations/users" ? { items: [{ id: profile.id, email: profile.email, fullName: profile.fullName }] }
      : path.includes("provider") ? providerSettings : { items: [], totalItems: 0, page: 1, totalPages: 0 };
    await route.fulfill({ json: value });
  });
  return { errors, chunks };
}
async function account(page: Page) {
  await page.goto("/dashboard/credit-transactions");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  return page.getByRole("dialog", { name: "Tài khoản", exact: true });
}

test("ERR021 failed profile load blocks PUT and retries only the read", async ({ page }) => {
  let fail = true; let puts = 0; let gets = 0;
  const observed = await setup(page, "User", async (route, path) => {
    if (path !== "/api/profile") return false;
    if (route.request().method() === "PUT") puts++; else gets++;
    await route.fulfill(fail ? { status: 503, json: { title: privateMarker } } : { json: profile }); return true;
  });
  const dialog = await account(page);
  await expect(dialog.getByText("Không tải được hồ sơ.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Lưu hồ sơ", exact: true })).toBeDisabled();
  await expect(dialog.getByLabel("Họ tên", { exact: true })).toBeDisabled();
  const readsBeforeRetry = gets;
  fail = false; await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(dialog.getByLabel("Họ tên", { exact: true })).toHaveValue(profile.fullName);
  await expect(dialog.getByRole("button", { name: "Lưu hồ sơ", exact: true })).toBeEnabled();
  expect(gets - readsBeforeRetry).toBe(1); expect(puts).toBe(0); expect(observed.errors).toEqual([]); expect(observed.chunks).toEqual([]);
});

test("ERR021 failed security load does not label Google unlinked and retry restores known state", async ({ page }) => {
  let fail = false; let writes = 0;
  const observed = await setup(page, "User", async (route, path) => {
    if (route.request().method() !== "GET") writes++;
    if (path !== "/api/profile" || !fail) return false;
    await route.fulfill({ status: 503, json: { title: privateMarker } }); return true;
  });
  const dialog = await account(page);
  await expect(dialog.getByLabel("Họ tên", { exact: true })).toHaveValue(profile.fullName);
  fail = true; await dialog.getByRole("button", { name: "Bảo mật", exact: true }).click();
  await expect(dialog.getByText("Không tải được hồ sơ bảo mật.", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Chưa liên kết", { exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Đổi mật khẩu", exact: true })).toBeDisabled();
  fail = false; await dialog.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(dialog.getByText("Đã liên kết", { exact: true })).toBeVisible();
  expect(writes).toBe(0); expect(observed.errors).toEqual([]);
});

for (const failure of ["503", "transport"]) test(`ERR016 ${failure} detail offers GET-only retry without claiming missing`, async ({ page }) => {
  let fail = true; let reads = 0; let writes = 0;
  const observed = await setup(page, "User", async (route, path) => {
    if (path !== `/api/topup-orders/${order.id}`) return false;
    if (route.request().method() === "GET") reads++; else writes++;
    if (fail) { if (failure === "transport") await route.abort("failed"); else await route.fulfill({ status: 503, json: { title: privateMarker } }); }
    else await route.fulfill({ json: order });
    return true;
  });
  await page.goto(`/dashboard/top-up/${order.id}`);
  await expect(page.getByText("Không tải được chi tiết yêu cầu nạp.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Không tìm thấy yêu cầu nạp", exact: true })).toHaveCount(0);
  fail = false; await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByText(`Mã yêu cầu: ${order.id}`, { exact: true })).toBeVisible();
  expect(reads).toBe(2); expect(writes).toBe(0); expect(observed.errors).toEqual([]); expect(observed.chunks).toEqual([]);
});
test("ERR016 404 retains privacy-safe wording", async ({ page }) => {
  await setup(page, "User", async (route, path) => {
    if (!path.startsWith("/api/topup-orders/")) return false;
    await route.fulfill({ status: 404, json: { title: privateMarker } }); return true;
  });
  await page.goto("/dashboard/top-up/hidden-fixture");
  await expect(page.getByText("Yêu cầu có thể không tồn tại hoặc không thuộc tài khoản hiện tại.", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(privateMarker);
});

test("ERR015 manual request keeps confirmed ID while history refresh fails; retry never repeats POST", async ({ page }) => {
  let posts = 0; let fail = false; let listReads = 0;
  const observed = await setup(page, "User", async (route, path) => {
    if (path !== "/api/topup-orders") return false;
    if (route.request().method() === "POST") { posts++; fail = true; await route.fulfill({ json: order }); }
    else { listReads++; await route.fulfill(fail ? { status: 503, json: { title: privateMarker } } : { json: { items: posts ? [order] : [] } }); }
    return true;
  });
  await page.goto("/dashboard/top-up");
  await page.getByText("Yêu cầu đối soát thủ công", { exact: true }).click();
  await page.locator("textarea").fill("Chỉ là dữ liệu kiểm thử");
  await page.getByRole("button", { name: "Gửi yêu cầu đối soát", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: order.id })).toBeVisible();
  await expect(page.getByText("Không tải được dữ liệu nạp credit.", { exact: true })).toBeVisible();
  await expect(page.locator("[data-sonner-toast][data-type=error]")).toHaveCount(0);
  const readsBeforeRetry = listReads;
  fail = false; await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByText(/Bạn đang có một yêu cầu đối soát thủ công/)).toBeVisible();
  expect(posts).toBe(1); expect(listReads - readsBeforeRetry).toBe(1); expect(observed.errors).toEqual([]);
});

test("ERR015 checkout redirects even when subsequent list reads would fail", async ({ page }) => {
  let posts = 0; let listReadsAfterPost = 0;
  const observed = await setup(page, "User", async (route, path) => {
    if (path === "/api/topup-orders/payos") { posts++; await route.fulfill({ json: { topupOrderId: order.id, checkoutUrl: `${new URL(page.url()).origin}/payment/payos/return?status=PENDING`, paymentLinkId: "fixture-link", ...creditPackage } }); return true; }
    if (path === "/api/topup-orders" && posts) { listReadsAfterPost++; await route.fulfill({ status: 503, json: { title: privateMarker } }); return true; }
    return false;
  });
  await page.goto("/dashboard/top-up");
  await page.getByRole("button", { name: "Tạo liên kết thanh toán", exact: true }).click();
  await expect(page).toHaveURL(/\/payment\/payos\/return\?status=PENDING$/);
  expect(posts).toBe(1); expect(listReadsAfterPost).toBe(0); expect(observed.errors).toEqual([]);
});

for (const action of ["approve", "reject"]) test(`ERR015 admin ${action} keeps confirmed decision on refresh failure`, async ({ page }) => {
  let posts = 0; let fail = false; let reads = 0;
  const receipt = { id: order.id, status: action === "approve" ? "Approved" : "Rejected", creditTransactionId: "confirmed-approval-credit-001", balanceAfter: 142 };
  const observed = await setup(page, "Admin", async (route, path) => {
    if (path.endsWith(`/${action}`)) { posts++; fail = true; await route.fulfill({ json: action === "approve" ? receipt : { id: order.id, status: "Rejected" } }); return true; }
    if (path === "/api/admin/topup-orders/manual") { reads++; if (fail) { await route.fulfill({ status: 503, json: { title: privateMarker } }); return true; } }
    return false;
  });
  await page.goto("/admin/manual-credits");
  await page.getByRole("button", { name: "Xem chi tiết yêu cầu", exact: true }).click();
  if (action === "reject") await page.getByPlaceholder("Lý do từ chối", { exact: true }).fill("Lý do kiểm thử");
  await page.getByRole("button", { name: action === "approve" ? "Duyệt và cộng credit" : "Từ chối yêu cầu", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: order.id })).toBeVisible();
  if (action === "approve") {
    const confirmation = page.getByRole("status").filter({ hasText: receipt.creditTransactionId });
    await expect(confirmation).toContainText(order.id);
    await expect(confirmation).toContainText("Số dư sau giao dịch: 142 credit");
  }
  await expect(page.getByText("Không tải được danh sách yêu cầu đối soát.", { exact: true })).toBeVisible();
  await expect(page.locator("[data-sonner-toast][data-type=error]")).toHaveCount(0);
  const readsBeforeRetry = reads;
  fail = false; await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Xem chi tiết yêu cầu", exact: true })).toBeVisible();
  if (action === "approve") await expect(page.getByRole("status").filter({ hasText: receipt.creditTransactionId })).toContainText("Số dư sau giao dịch: 142 credit");
  expect(posts).toBe(1); expect(reads - readsBeforeRetry).toBe(1); expect(observed.errors).toEqual([]);
});

test("ERR021 failed admin user search clears old options and blocks grant until retry", async ({ page }) => {
  let fail = false; let writes = 0;
  const observed = await setup(page, "Admin", async (route, path) => {
    if (route.request().method() !== "GET") writes++;
    if (path !== "/api/admin/credit-operations/users" || !fail) return false;
    await route.fulfill({ status: 503, json: { title: privateMarker } }); return true;
  });
  await page.goto("/admin/manual-credits");
  const combo = page.getByRole("combobox"); await combo.focus();
  await page.getByRole("option", { name: new RegExp(profile.email.replaceAll(".", "\\.")) }).click();
  fail = true; await combo.fill("different@example.invalid");
  await expect(page.getByText("Không tải được danh sách người dùng. Thử lại trước khi chọn người nhận.", { exact: true })).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(0);
  await page.getByLabel("Số credit", { exact: true }).fill("10");
  await page.getByLabel("Lý do cộng credit", { exact: true }).fill("Kiểm thử");
  await expect(page.getByRole("button", { name: "Cộng credit", exact: true })).toBeDisabled();
  fail = false; await page.getByRole("button", { name: "Thử lại tìm người dùng", exact: true }).click();
  await combo.focus(); await expect(page.getByRole("option")).toHaveCount(1);
  expect(writes).toBe(0); expect(observed.errors).toEqual([]);
});

test("ERR015 manual grant keeps confirmed transaction and balance when history fails", async ({ page }) => {
  let writes = 0; let fail = false;
  const observed = await setup(page, "Admin", async (route, path) => {
    if (path !== "/api/admin/credit-operations/manual-grants") return false;
    if (route.request().method() === "POST") { writes++; fail = true; await route.fulfill({ json: { userId: profile.id, userEmail: profile.email, creditTransactionId: "confirmed-credit-001", balanceAfter: 42 } }); return true; }
    if (fail) { await route.fulfill({ status: 503, json: { title: privateMarker } }); return true; }
    return false;
  });
  await page.goto("/admin/manual-credits");
  await page.getByRole("combobox").focus();
  await page.getByRole("option").first().click();
  await page.getByLabel("Số credit", { exact: true }).fill("12");
  await page.getByLabel("Lý do cộng credit", { exact: true }).fill("Kiểm thử xác nhận số dư");
  await page.getByRole("button", { name: "Cộng credit", exact: true }).click();
  const confirmation = page.getByRole("status").filter({ hasText: "confirmed-credit-001" });
  await expect(confirmation).toContainText("42 credit");
  await expect(page.getByText("Không tải được lịch sử. Bấm “Làm mới” để thử lại.", { exact: true })).toBeVisible();
  fail = false; await page.getByRole("button", { name: "Làm mới lịch sử", exact: true }).click();
  await expect(confirmation).toContainText("confirmed-credit-001");
  expect(writes).toBe(1); expect(observed.errors).toEqual([]);
});

for (const surface of ["detail", "manual", "payos"]) for (const mode of ["absent", "reject", "success"]) test(`ERR022 ${surface} clipboard ${mode} supports keyboard and repeat feedback`, async ({ page }) => {
  await page.addInitScript(mode => Object.defineProperty(navigator, "clipboard", { configurable: true, value: mode === "absent" ? undefined : { writeText: async () => { if (mode === "reject") throw Error("permission denied"); } } }), mode);
  const observed = await setup(page, surface === "detail" ? "User" : "Admin");
  await page.goto(surface === "detail" ? `/dashboard/top-up/${order.id}` : surface === "manual" ? "/admin/manual-credits" : "/admin/payos-settings");
  const button = page.getByRole("button", { name: surface === "payos" ? "Sao chép" : "Sao chép đầy đủ mã yêu cầu", exact: true }).first();
  await button.focus(); await page.keyboard.press("Enter");
  await expect(page.locator("[data-sonner-toast]").last()).toContainText(mode === "success" ? "Đã sao chép" : "thủ công");
  await page.keyboard.press("Enter");
  if (mode !== "success") await expect(page.getByLabel(surface === "payos" ? "Webhook URL" : "Mã yêu cầu đầy đủ", { exact: true }).first()).toHaveValue(surface === "payos" ? /\/api\/payments\/payos\/webhook$/ : order.id);
  expect(observed.errors).toEqual([]); expect(observed.chunks).toEqual([]);
});

for (const provider of ["ai", "payos"]) test(`ERR015 ERR019 ${provider} retains local configuration check after failed refresh`, async ({ page }) => {
  const path = provider === "ai" ? "/api/admin/ai-provider-settings" : "/api/admin/payment-providers/payos";
  let posts = 0; let fail = false;
  const observed = await setup(page, "Admin", async (route, current) => {
    if (current === `${path}/check`) { posts++; fail = true; await route.fulfill({ json: { status: "Ready", message: privateMarker, checkedAt: "2026-10-30T00:00:00Z" } }); return true; }
    if (current === path && fail) { await route.fulfill({ status: 503, json: { title: privateMarker } }); return true; }
    return false;
  });
  await page.goto(provider === "ai" ? "/admin/ai-provider-settings" : "/admin/payos-settings");
  await page.getByRole("button", { name: "Kiểm tra cấu hình", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "chưa kiểm tra kết nối" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(privateMarker);
  await expect(page.locator("[data-sonner-toast][data-type=error]")).toHaveCount(0);
  fail = false; await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  expect(posts).toBe(1); expect(observed.errors).toEqual([]);
});
test("ERR019 payment return explains waiting for confirmation in user language", async ({ page }) => {
  await page.goto("/payment/payos/return?status=PENDING");
  await expect(page.getByText("Số dư sẽ cập nhật sau khi hệ thống xác minh thanh toán. Bạn có thể xem kết quả trong lịch sử nạp.", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("backend");
});
