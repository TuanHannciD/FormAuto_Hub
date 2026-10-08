import { expect, test, type Page } from "@playwright/test";

const profile = { id: "account-fixture", email: "account@example.invalid", fullName: "Người dùng thử", role: "Admin", createdAt: "2026-10-07T00:00:00Z", googleLinked: true };
async function setup(page: Page) {
  const writes: Array<{ path: string; method: string; body: unknown }> = [];
  await page.addInitScript(value => localStorage.setItem("formauto.auth.session", JSON.stringify({
    userId: value.id, email: value.email, fullName: value.fullName, role: value.role,
    accessToken: "fixture-access", refreshToken: "fixture-refresh",
    accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
  })), profile);
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") writes.push({ path, method: request.method(), body: request.postData() ? request.postDataJSON() : null });
    await route.fulfill({ json: path === "/api/profile" ? { ...profile, ...(request.method() === "PUT" ? request.postDataJSON() : {}) }
      : path === "/api/profile/change-password" ? { changed: true }
      : path === "/api/auth/logout" ? {} : { items: [], totalItems: 0, page: 1, totalPages: 0 } });
  });
  return writes;
}

test("popup grows before revealing content and hides content before closing", async ({ page }) => {
  await setup(page);
  await page.goto("/dashboard/credit-transactions");
  const trigger = page.getByRole("button", { name: "Menu tài khoản", exact: true });
  await trigger.click();
  const opening = await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).evaluate(async button => {
    (button as HTMLButtonElement).click();
    const frames = [];
    for (let i = 0; i < 36; i++) {
      await new Promise(requestAnimationFrame);
      const dialog = document.querySelector<HTMLDialogElement>("dialog[data-popup-phase]")!;
      if (!dialog) continue;
      const body = dialog.querySelector<HTMLElement>("[data-popup-content]")!;
      frames.push({ phase: dialog.dataset.popupPhase, height: dialog.getBoundingClientRect().height, hidden: getComputedStyle(body).visibility === "hidden", inert: body.inert });
    }
    return frames;
  });
  const growing = opening.filter(frame => frame.phase === "opening");
  expect(growing.length).toBeGreaterThan(1);
  expect(growing.every(frame => frame.hidden && frame.inert)).toBe(true);
  expect(new Set(growing.map(frame => Math.round(frame.height))).size).toBeGreaterThan(2);
  expect(opening.at(-1)).toMatchObject({ phase: "open", hidden: false, inert: false });
  const closing = await page.getByRole("dialog").evaluate(async dialog => {
    dialog.querySelector<HTMLButtonElement>("button[aria-label='Đóng tài khoản']")!.click();
    const frames = [];
    while (dialog.isConnected) {
      await new Promise(requestAnimationFrame);
      if (!dialog.isConnected) break;
      const body = dialog.querySelector<HTMLElement>("[data-popup-content]")!;
      frames.push({ phase: (dialog as HTMLElement).dataset.popupPhase, height: dialog.getBoundingClientRect().height, hidden: getComputedStyle(body).visibility === "hidden", inert: body.inert, locked: document.body.style.overflow === "hidden" });
    }
    return frames;
  });
  expect(closing.length).toBeGreaterThan(1);
  expect(closing.every(frame => frame.phase === "closing" && frame.hidden && frame.inert && frame.locked)).toBe(true);
  expect(closing.at(-1)!.height).toBeLessThan(closing[0].height - 20);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("popup can close during opening, dismiss outside and skip motion when reduced", async ({ page }) => {
  await setup(page);
  await page.goto("/dashboard/credit-transactions");
  const trigger = page.getByRole("button", { name: "Menu tài khoản", exact: true });
  const launch = page.getByRole("button", { name: "Quản lý tài khoản", exact: true });
  await trigger.click();
  const interrupted = await launch.evaluate(async button => {
    (button as HTMLButtonElement).click();
    for (let i = 0; i < 20 && !document.querySelector("dialog[data-popup-phase]"); i++) await new Promise(requestAnimationFrame);
    const dialog = document.querySelector<HTMLDialogElement>("dialog[data-popup-phase]")!;
    const phase = dialog.dataset.popupPhase;
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    const visible = [];
    while (dialog.isConnected) {
      await new Promise(requestAnimationFrame);
      if (dialog.isConnected) visible.push(getComputedStyle(dialog.querySelector("[data-popup-content]")!).visibility !== "hidden");
    }
    return { phase, visible };
  });
  expect(interrupted.phase).toBe("opening");
  expect(interrupted.visible.some(Boolean)).toBe(false);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await launch.click();
  await expect(page.locator("dialog[data-popup-phase]")).toHaveAttribute("data-popup-phase", "open");
  await page.mouse.click(2, 2);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await launch.click();
  await expect(page.locator("dialog[data-popup-phase]")).toHaveAttribute("data-popup-phase", "open");
  expect(await page.getByRole("dialog").evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("account entry is in topbar, with shared profile and security navigation", async ({ page }) => {
  await setup(page);
  await page.goto("/dashboard/credit-transactions");
  const sidebar = page.getByRole("navigation", { name: "Điều hướng bảng điều khiển" });
  await expect(sidebar.getByRole("link", { name: /Hồ sơ|Bảo mật/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tài khoản", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Hồ sơ", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Bảo mật", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/credit-transactions$/);
  await expect(dialog.getByRole("button", { name: "Bảo mật", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("heading", { name: "Đổi mật khẩu", exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Đăng nhập bằng Google", exact: true })).toBeVisible();
});

test("account dropdown supports keyboard dismissal, outside click and narrow screens", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/dashboard/credit-transactions");
  const trigger = page.getByRole("button", { name: "Menu tài khoản", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Quản lý tài khoản", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const dropdown = page.getByRole("navigation", { name: "Menu tài khoản", exact: true });
  const box = await dropdown.locator("..").boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.locator("header p").first().click();
  await expect(dropdown).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("profile save updates topbar name and password keeps the existing request contract", async ({ page }) => {
  const writes = await setup(page);
  await page.goto("/dashboard/credit-transactions");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  await page.getByLabel("Họ tên", { exact: true }).fill("Tên đã cập nhật");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("formauto.auth.session")!).fullName)).toBe("Tên đã cập nhật");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("formauto.auth.session")!).refreshToken)).toBe("fixture-refresh");
  await page.getByRole("button", { name: "Bảo mật", exact: true }).click();
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("Old-password-1");
  await page.getByLabel(/^Mật khẩu mới/).fill("New-password-1");
  await page.getByLabel("Xác nhận mật khẩu mới", { exact: true }).fill("New-password-1");
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page.getByText("Đã đổi mật khẩu.", { exact: true })).toBeVisible();
  expect(writes).toEqual([
    { path: "/api/profile", method: "PUT", body: { fullName: "Tên đã cập nhật" } },
    { path: "/api/profile/change-password", method: "PUT", body: { currentPassword: "Old-password-1", newPassword: "New-password-1" } }
  ]);
});

test("admin uses the same account menu and logout clears session", async ({ page }) => {
  await setup(page);
  await page.goto("/admin/packages");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/packages$/);
  await page.getByRole("dialog", { name: "Tài khoản", exact: true }).getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => localStorage.getItem("formauto.auth.session"))).toBeNull();
});

test("compact modal contains focus, fits mobile and restores focus after Escape", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/dashboard/credit-transactions");
  const trigger = page.getByRole("button", { name: "Menu tài khoản", exact: true });
  await trigger.click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tài khoản", exact: true });
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(box!.height).toBeLessThanOrEqual(608);
  await expect(dialog.getByLabel("Họ tên", { exact: true })).toHaveValue(profile.fullName);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("retired profile and security pages no longer render", async ({ page }) => {
  await setup(page);
  for (const path of ["/dashboard/profile", "/dashboard/profile/security"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("button", { name: "Lưu hồ sơ", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Đổi mật khẩu", exact: true })).toHaveCount(0);
  }
});

test("account popup interpolates height, handles interruption and remains bounded on mobile", async ({ page }) => {
  await setup(page);
  await page.goto("/dashboard/credit-transactions");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tài khoản", exact: true });
  await expect(dialog.getByLabel("Họ tên", { exact: true })).toHaveValue(profile.fullName);
  await expect.poll(() => dialog.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  const samples = await dialog.evaluate(async element => {
    const samples = [element.getBoundingClientRect().height];
    const phases: Array<{ phase: string | undefined; hidden: boolean }> = [];
    Array.from(element.querySelectorAll("button")).find(button => button.textContent === "Bảo mật")!.click();
    const started = performance.now();
    while (performance.now() - started < 400) {
      await new Promise(requestAnimationFrame);
      samples.push(element.getBoundingClientRect().height);
      const region = element.querySelector<HTMLElement>("[data-transition-phase]")!;
      phases.push({ phase: region.dataset.transitionPhase, hidden: getComputedStyle(region.querySelector("[data-transition-current]")!).visibility === "hidden" });
    }
    return { heights: samples, phases };
  });
  expect(samples.heights.at(-1)!).toBeGreaterThan(samples.heights[0] + 30);
  expect(samples.heights.some(height => height > samples.heights[0] + 5 && height < samples.heights.at(-1)! - 5)).toBe(true);
  const resizing = samples.phases.filter(sample => sample.phase === "resize");
  expect(resizing.length).toBeGreaterThan(1);
  expect(resizing.every(sample => sample.hidden)).toBe(true);
  await page.setViewportSize({ width: 320, height: 640 });
  const box = await dialog.boundingBox();
  expect(box!.height).toBeLessThanOrEqual(608);
  await dialog.evaluate(async element => {
    for (const name of ["Hồ sơ", "Bảo mật", "Hồ sơ", "Bảo mật"]) {
      Array.from(element.querySelectorAll("button")).find(button => button.textContent === name)!.click();
      await new Promise(requestAnimationFrame);
    }
  });
  await expect(dialog.getByRole("button", { name: "Bảo mật", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("account keeps native scrolling on mobile after resizing before swapping content", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/dashboard/credit-transactions");
  await page.getByRole("button", { name: "Menu tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Quản lý tài khoản", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tài khoản", exact: true });
  await expect(dialog.getByLabel("Họ tên", { exact: true })).toHaveValue(profile.fullName);
  await dialog.getByRole("button", { name: "Bảo mật", exact: true }).click();
  const current = dialog.locator("[data-transition-current]");
  await expect(current.getByRole("heading", { name: "Đổi mật khẩu", exact: true })).toBeVisible();
  await expect(dialog.locator("[data-transition-phase]")).toHaveAttribute("data-transition-phase", "stable");
  const viewport = dialog.locator("[data-transition-phase]");
  expect(await viewport.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  expect(await viewport.evaluate(node => getComputedStyle(node).overflowY)).toBe("auto");
  await expect(dialog.locator("[data-scroll-indicator]")).toHaveCount(0);
  await viewport.hover();
  await page.mouse.wheel(0, 140);
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  const before = await viewport.evaluate(node => node.scrollTop);
  await viewport.focus();
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeGreaterThan(before);
  await dialog.getByRole("button", { name: "Hồ sơ", exact: true }).click();
  const shrink = await dialog.evaluate(async node => {
    const frames = [];
    for (let index = 0; index < 32; index++) {
      await new Promise(requestAnimationFrame);
      const region = node.querySelector<HTMLElement>("[data-transition-phase]")!;
      frames.push(region.dataset.transitionPhase !== "resize" || (getComputedStyle(region).overflowY === "hidden" && getComputedStyle(region.querySelector("[data-transition-current]")!).visibility === "hidden"));
    }
    return frames;
  });
  expect(shrink.every(Boolean)).toBe(true);
  await expect(dialog.locator("[data-transition-phase]")).toHaveAttribute("data-transition-phase", "stable");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
