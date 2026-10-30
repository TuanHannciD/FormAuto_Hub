import { expect, test, type Page } from "@playwright/test";

const privateMarker = "private-provider-payload-ERR001";

function diagnostics(page: Page) {
  const errors: string[] = [];
  const failedChunks: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.text().includes(privateMarker)) errors.push(message.text());
  });
  page.on("response", response => {
    if (response.url().includes("/_next/static/") && response.status() >= 400) failedChunks.push(response.url());
  });
  return { errors, failedChunks };
}

for (const scenario of [
  { status: 401, body: JSON.stringify({ title: "Unauthorized" }), expected: "Email hoặc mật khẩu không đúng." },
  { status: 423, body: "", expected: "Tài khoản bị khóa tạm thời. Vui lòng thử lại sau." },
  { status: 500, body: privateMarker, expected: "Yêu cầu chưa thành công. Vui lòng thử lại sau." }
]) {
  test(`login caller maps HTTP ${scenario.status} without raw details`, async ({ page }) => {
    const observed = diagnostics(page);
    let posts = 0;
    await page.route("**/api/auth/login", async route => {
      posts++;
      expect(route.request().method()).toBe("POST");
      await route.fulfill({ status: scenario.status, body: scenario.body, contentType: "application/problem+json" });
    });
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("error-fixture@example.invalid");
    await page.locator('input[name="password"]').fill("synthetic-pass-123");
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('p[role="alert"]')).toHaveText(scenario.expected);
    await expect(page.locator("[data-sonner-toast]")).toContainText(scenario.expected);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('input[name="email"]')).toHaveValue("error-fixture@example.invalid");
    expect(posts).toBe(1);
    expect(observed.errors).toEqual([]);
    expect(observed.failedChunks).toEqual([]);
  });
}

test("registration caller treats password validation as invalid input", async ({ page }) => {
  const observed = diagnostics(page);
  let posts = 0;
  await page.route("**/api/auth/register", async route => {
    posts++;
    await route.fulfill({ status: 400, json: { detail: `password already invalid ${privateMarker}`, errors: { Password: [privateMarker] } } });
  });
  await page.goto("/register");
  await page.locator('input[name="fullName"]').fill("Tài khoản kiểm thử");
  await page.locator('input[name="email"]').fill("error-fixture@example.invalid");
  await page.locator('input[name="password"]').fill("synthetic-pass-123");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('p[role="alert"]')).toHaveText("Thông tin đăng ký không hợp lệ.");
  await expect(page.locator("body")).not.toContainText("Email đã tồn tại");
  await expect(page.locator("body")).not.toContainText(privateMarker);
  expect(posts).toBe(1);
  expect(observed.errors).toEqual([]);
  expect(observed.failedChunks).toEqual([]);
});

test("network failure remains on login with safe recovery guidance", async ({ page }) => {
  const observed = diagnostics(page);
  await page.route("**/api/auth/login", route => route.abort("failed"));
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("error-fixture@example.invalid");
  await page.locator('input[name="password"]').fill("synthetic-pass-123");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('p[role="alert"]')).toHaveText("Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.");
  await expect(page.locator('form button[type="submit"]')).toBeEnabled();
  expect(observed.errors).toEqual([]);
  expect(observed.failedChunks).toEqual([]);
});
