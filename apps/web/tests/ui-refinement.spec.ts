import { expect, test, type Page } from "@playwright/test";

// Isolated API fixtures exercise actual shared components without account/provider writes.
async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: "compact-fixture", email: "compact@example.test", fullName: "Người dùng có tên tiếng Việt dài để kiểm tra bố cục", role: "Admin",
    accessToken: "fixture", refreshToken: "fixture", accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
  })));
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") throw new Error("The geometry fixture must never write to an API");
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path === "/api/profile"
      ? { id: "compact-fixture", email: "compact@example.test", fullName: "Người dùng thử", role: "Admin", createdAt: "2026-10-07T00:00:00Z", googleLinked: false }
      : { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });
  });
}

test("landing elevation remains translucent when the overlay backdrop token exists", async ({ page }) => {
  await page.goto("/");
  // This is the existing hero form illustration, independent of the utility's spelling.
  const shadow = await page.getByRole("heading", { name: "Khảo sát trải nghiệm", exact: true }).locator("..").evaluate(element => getComputedStyle(element).boxShadow);
  expect(shadow).toContain("rgba(40, 54, 102, 0.18)");
  expect(shadow).not.toContain("rgb(24, 36, 74)");
  // Keep the semantic backdrop in use by the real mobile shell.
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  expect(await page.getByRole("dialog", { name: "Điều hướng" }).evaluate(element => getComputedStyle(element, "::backdrop").backgroundColor)).toBe("rgba(24, 36, 74, 0.5)");
});

test("operating shell leaves a compact readable start for the actual task", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/dashboard");
  const topbar = page.locator("main > header");
  const height = (await topbar.boundingBox())!.height;
  expect(height).toBeGreaterThanOrEqual(56);
  expect(height).toBeLessThanOrEqual(64);
  const metric = page.getByText("Credit hiện có", { exact: true });
  const fontSize = await metric.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(12);
  const paddingTop = await topbar.locator("+ div").evaluate(element => parseFloat(getComputedStyle(element).paddingTop));
  expect(paddingTop).toBeGreaterThanOrEqual(20);
  expect(paddingTop).toBeLessThanOrEqual(24);
});

test("320px shell and account popup remain reachable with keyboard and touch-sized primary controls", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/dashboard");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  for (const control of [page.getByRole("button", { name: "Mở menu", exact: true }), page.getByRole("button", { name: "Tìm", exact: true }), page.getByRole("link", { name: "Nạp credit", exact: true })]) {
    const box = (await control.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  const contrast = await page.getByPlaceholder("Tìm theo loại, mô tả, nguồn tham chiếu...").evaluate(element => {
    const luminance = (color: string) => {
      const [red, green, blue] = color.match(/[\d.]+/g)!.slice(0, 3).map(value => {
        const channel = Number(value) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };
    const text = luminance(getComputedStyle(element, "::placeholder").color);
    const surface = luminance(getComputedStyle(element).backgroundColor);
    return (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  const trigger = page.getByRole("button", { name: "Menu tài khoản", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Quản lý tài khoản", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  const popup = page.getByRole("dialog", { name: "Tài khoản", exact: true });
  await expect(popup).toHaveAttribute("data-popup-phase", "open");
  await expect(popup.getByLabel("Họ tên", { exact: true })).toHaveValue("Người dùng thử");
  expect((await popup.boundingBox())!.height).toBeLessThanOrEqual(608);
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("shared textarea preserves default and consumer minimum heights at every breakpoint", async ({ page }) => {
  // Isolated host imports the actual shared components; no product fixture route.
  await page.goto("http://localhost:3001/control-test");
  for (const width of [320, 390, 640, 768, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [label, minimum] of [["Default textarea", 96], ["Prompt textarea", 112], ["Short textarea", 64]] as const) {
      const control = page.getByLabel(label, { exact: true });
      expect(await control.evaluate(element => parseFloat(getComputedStyle(element).minHeight)), `${label} at ${width}px`).toBe(minimum);
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(minimum);
    }
    expect((await page.getByLabel("One line", { exact: true }).boundingBox())!.height).toBe(width < 640 ? 44 : 40);
  }
});

test("native Google provider rendering fits a narrow popup, retains focus on resize and forwards credentials unchanged", async ({ page }) => {
  await setup(page);
  await page.route("https://accounts.google.com/gsi/client", route => route.fulfill({ contentType: "application/javascript", body: `
    window.googleRenderCalls = [];
    window.googleInitializeCount = 0;
    window.google = { accounts: { id: {
      initialize(options) { window.googleInitializeCount++; window.googleCredentialCallback = options.callback; },
      renderButton(parent, options) {
        window.googleRenderCalls.push(options);
        const button = document.createElement('div');
        button.setAttribute('role', 'button'); button.tabIndex = 0;
        button.textContent = options.text === 'signin' ? 'Sign in' : options.text;
        button.style.cssText = 'box-sizing:border-box;height:40px;min-width:' + (options.text === 'signin' ? '100px' : '298px') + ';width:' + options.width + 'px;border:1px solid;';
        parent.append(button);
      }
    } } };
  ` }));
  const writes: unknown[] = [];
  await page.route("**/api/auth/link-google", async route => {
    writes.push({ method: route.request().method(), body: route.request().postDataJSON() });
    await route.fulfill({ json: { linked: true } });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  const popup = page.getByRole("dialog", { name: "Tài khoản", exact: true });
  await expect(popup).toHaveAttribute("data-popup-phase", "open");
  await popup.getByRole("button", { name: "Bảo mật", exact: true }).click();
  await expect(popup.locator("[data-transition-phase]")).toHaveAttribute("data-transition-phase", "stable");
  const provider = popup.locator('[role="button"]');
  await expect(provider).toHaveCount(1);
  await provider.scrollIntoViewIfNeeded();
  const box = (await provider.boundingBox())!;
  const body = (await provider.locator("..").locator("..").boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(body.x - 1);
  expect(box.x + box.width).toBeLessThanOrEqual(body.x + body.width + 1);
  await provider.focus();
  await page.keyboard.press("Tab");
  await expect(popup.getByRole("button", { name: "Đăng xuất", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(provider).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(provider).toBeFocused();
  await expect.poll(() => page.evaluate(() => (window as unknown as { googleRenderCalls: Array<{ width: number }> }).googleRenderCalls.at(-1)!.width)).toBeGreaterThan(240);
  expect((await provider.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const renders = await page.evaluate(() => (window as unknown as { googleRenderCalls: unknown[] }).googleRenderCalls.length);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
  expect(await page.evaluate(() => (window as unknown as { googleRenderCalls: unknown[] }).googleRenderCalls.length)).toBe(renders);
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { googleRenderCalls: Array<{ text: string }> }).googleRenderCalls.at(-1)!.text)).toBe("continue_with");
  expect((await provider.boundingBox())!.height).toBe(40);
  expect(await page.evaluate(() => (window as unknown as { googleInitializeCount: number }).googleInitializeCount)).toBe(1);
  await page.evaluate(() => (window as unknown as { googleCredentialCallback: (response: { credential: string }) => void }).googleCredentialCallback({ credential: "fixture-credential-exact" }));
  await expect.poll(() => writes).toEqual([{ method: "POST", body: { idToken: "fixture-credential-exact" } }]);
});
