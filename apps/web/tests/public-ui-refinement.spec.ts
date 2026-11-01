import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const evidenceDir = path.resolve(process.cwd(), "../../artifacts/reports/ui-refinement-2026-10-28/public-d");
const routes = ["/", "/login", "/register", "/auth/callback", "/google-forms/sample-data", "/google-forms/student-report", "/google-forms/survey-demo", "/google-forms/sheets-report", "/anti-abuse", "/payment/payos/return", "/payment/payos/cancel"];

async function fullyVisible(locator: Locator, page: Page) {
  await expect(locator).toBeVisible();
  const rect = await locator.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.y).toBeGreaterThanOrEqual(0);
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  expect(rect!.height).toBeGreaterThanOrEqual(44);
}

test("public route screenshot and geometry evidence", async ({ page }) => {
  test.skip(!process.env.PUBLIC_UI_CAPTURE, "Capture only on the explicit evidence run");
  const phase = process.env.PUBLIC_UI_CAPTURE!;
  const output = path.join(evidenceDir, phase);
  await mkdir(output, { recursive: true });
  const records = [];
  const errors: string[] = [];
  const failedChunks: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.url().includes("/_next/static/") && response.status() >= 400) failedChunks.push(`${response.status()} ${response.url()}`);
  });
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      const response = await page.goto(route);
      await page.locator("main").waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (route.startsWith("/google-forms/") || route === "/anti-abuse") {
        await expect.poll(() => page.locator("h1").evaluate(element => Number(getComputedStyle(element.parentElement!).opacity))).toBe(1);
      }
      // Stop only decorative infinite animations so same-size evidence is stable.
      await page.addStyleTag({ content: ".motion-float { animation-play-state: paused !important; }" });
      const name = `${route === "/" ? "landing" : route.slice(1).replaceAll("/", "-")}-${viewport.width}x${viewport.height}`;
      await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: false });
      const geometry = await page.evaluate(() => ({
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        controls: [...document.querySelectorAll('h1,h2,form,input,main a,main button')].map(element => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, text: element.textContent?.trim().slice(0, 110), name: element.getAttribute("name"), x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom };
        })
      }));
      records.push({ route, status: response?.status(), screenshot: `${phase}/${name}.png`, ...geometry });
    }
  }
  await writeFile(path.join(evidenceDir, `${phase}-geometry.json`), JSON.stringify(records, null, 2));
  await writeFile(path.join(evidenceDir, `${phase}-browser-diagnostics.json`), JSON.stringify({ errors, failedChunks }, null, 2));
  expect(errors).toEqual([]);
  expect(failedChunks).toEqual([]);
});

test("homepage primary CTA fits the laptop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await fullyVisible(page.getByRole("link", { name: "Nhận 5 credit miễn phí", exact: true }), page);
});

for (const route of ["/login", "/register"]) {
  test(`${route} complete primary form fits the laptop viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(route);
    await fullyVisible(page.locator('form button[type="submit"]'), page);
    await expect(page.locator("form")).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(768);
  });
}

test("registration primary action fits a normal mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await fullyVisible(page.getByRole("button", { name: "Tạo tài khoản và nhận 5 credit", exact: true }), page);
});

test("public routes avoid horizontal document overflow across supported widths", async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [320, 390, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${route} at ${width}px`).toBeLessThanOrEqual(width);
    }
  }
});

test("registration retains entered values and reaches its error action in a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  let payload: unknown;
  await page.route("**/api/auth/register", async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { title: "Bad Request", status: 400 } });
  });
  await page.goto("/register");
  await page.getByLabel("Họ tên", { exact: true }).fill("Kiểm thử giao diện");
  await page.getByLabel("Email", { exact: true }).fill("public-ui@example.invalid");
  await page.getByLabel(/^Mật khẩu/).fill("fixture-password");
  const action = page.getByRole("button", { name: "Tạo tài khoản và nhận 5 credit", exact: true });
  await action.click();
  await expect(page.locator('form [role="alert"]')).toHaveText("Bad Request");
  expect(payload).toEqual({ fullName: "Kiểm thử giao diện", email: "public-ui@example.invalid", password: "fixture-password" });
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("public-ui@example.invalid");
  await action.scrollIntoViewIfNeeded();
  await fullyVisible(action, page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.screenshot({ path: path.join(evidenceDir, "register-error-320x568.png") });
});

test("login password toggle remains keyboard reachable and errors keep the request contract", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 400 });
  let payload: unknown;
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
  await page.route("**/api/auth/login", async route => {
    payload = route.request().postDataJSON();
    await responseGate;
    await route.fulfill({ status: 401, json: { title: "Unauthorized", status: 401 } });
  });
  await page.goto("/login");
  const password = page.getByLabel("Mật khẩu", { exact: true });
  await page.getByLabel("Email", { exact: true }).fill("public-ui@example.invalid");
  await password.fill("fixture-password");
  await password.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Hiện mật khẩu", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đang đăng nhập...", exact: true })).toBeDisabled();
  await page.screenshot({ path: path.join(evidenceDir, "login-loading-fixture-390x400.png") });
  releaseResponse();
  await expect(page.locator('form [role="alert"]')).toHaveText("Unauthorized");
  expect(payload).toEqual({ email: "public-ui@example.invalid", password: "fixture-password" });
  const action = page.getByRole("button", { name: "Đăng nhập", exact: true });
  await action.scrollIntoViewIfNeeded();
  await fullyVisible(action, page);
  await page.screenshot({ path: path.join(evidenceDir, "login-error-keyboard-390x400.png") });
});

test("callback fallback and PayOS result copy keep honest boundaries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const mutations: string[] = [];
  await page.route("**/api/**", async route => {
    if (route.request().method() !== "GET") mutations.push(route.request().method() + " " + new URL(route.request().url()).pathname);
    await route.abort();
  });
  await page.goto("/auth/callback?status=provider-unavailable");
  await expect(page.getByRole("alert").filter({ hasText: "Nhà cung cấp đăng nhập hiện không khả dụng." })).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, "callback-provider-unavailable-390x844.png") });
  await page.goto("/payment/payos/return?status=PAID&orderCode=fixture-result");
  await expect(page.getByText("PayOS đã ghi nhận thanh toán", { exact: true })).toBeVisible();
  await expect(page.getByText("Credit không được cộng từ trang này.", { exact: false })).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, "payment-paid-query-fixture-390x844.png") });
  await page.goto("/payment/payos/cancel?cancel=true&status=CANCELLED");
  await expect(page.getByText("Thanh toán đã hủy", { exact: true })).toBeVisible();
  expect(mutations).toEqual([]);
  await page.screenshot({ path: path.join(evidenceDir, "payment-cancel-query-fixture-390x844.png") });
});

test("article reduced motion leaves its content visible and FAQ keyboard operable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/google-forms/sample-data");
  const summary = page.locator("summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  await expect.poll(() => page.locator(".scroll-reveal").evaluateAll(elements => elements.filter(element => getComputedStyle(element).opacity !== "1").length)).toBe(0);
  await page.screenshot({ path: path.join(evidenceDir, "article-reduced-motion-faq-390x844.png") });
});

test("mobile landing navigation opens by keyboard and keeps its targets reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const toggle = page.locator("summary").first();
  await toggle.focus();
  await page.keyboard.press("Enter");
  const navigation = page.getByRole("navigation", { name: "Điều hướng mobile", exact: true });
  await expect(navigation).toBeVisible();
  for (const link of await navigation.getByRole("link").all()) {
    const bounds = await link.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.screenshot({ path: path.join(evidenceDir, "landing-menu-keyboard-320x568.png") });
  await page.keyboard.press("Enter");
  await expect(navigation).toBeHidden();
});
