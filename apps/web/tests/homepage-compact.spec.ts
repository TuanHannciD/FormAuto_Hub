import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1280, height: 800, maxHeight: 4100 },
  { width: 390, height: 844, maxHeight: 6200 },
  { width: 320, height: 568, maxHeight: 7200 }
]) {
  test(`homepage is compact and usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    const failedChunks: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (response.url().includes("/_next/static/") && response.status() >= 400) {
        failedChunks.push(`${response.status()} ${response.url()}`);
      }
    });
    expect((await page.goto("/"))?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
      viewport: innerWidth
    }));
    await test.info().attach("geometry", { body: JSON.stringify(geometry), contentType: "application/json" });
    expect.soft(geometry.height).toBeLessThanOrEqual(viewport.maxHeight);
    expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);
    // Guard the repaint regression without asserting hardware-dependent FPS.
    const rendering = await page.locator("main").evaluate(main => ({
      attachment: getComputedStyle(main).backgroundAttachment,
      overlays: ["::before", "::after"].map(pseudo => getComputedStyle(main, pseudo).content),
      sectionBlur: [...main.querySelectorAll("section")].some(section => getComputedStyle(section).backdropFilter !== "none")
    }));
    expect(rendering.attachment).not.toContain("fixed");
    expect(rendering.overlays.every(content => content === "none" || content === "normal")).toBe(true);
    expect(rendering.sectionBlur).toBe(false);
    const cta = page.getByRole("link", { name: "Nhận 5 credit miễn phí", exact: true });
    await expect(cta).toHaveAttribute("href", "/register");
    const ctaBox = await cta.boundingBox();
    expect(ctaBox!.height).toBeGreaterThanOrEqual(44);
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(viewport.height);
    for (const id of ["dich-vu", "cach-hoat-dong", "bang-gia", "faq"]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    for (const value of ["5 credit", "100 credit", "500 credit", "2.000₫", "10.000₫"]) {
      await expect(page.getByText(value, { exact: true }).first()).toBeVisible();
    }
    const question = page.getByText("Mỗi lần có thể tạo bao nhiêu phản hồi?", { exact: true });
    await question.click();
    await expect(page.getByText("Bạn có thể chọn từ 1 đến 100 phản hồi trong một lần tạo.", { exact: true })).toBeVisible();
    if (viewport.width < 768) {
      await page.locator("header summary").click();
      const navigation = page.getByRole("navigation", { name: "Điều hướng mobile" });
      await expect(navigation.getByRole("link", { name: "Đăng nhập", exact: true })).toHaveAttribute("href", "/login");
      await expect(navigation.getByRole("link", { name: "Đăng ký", exact: true })).toHaveAttribute("href", "/register");
      await navigation.getByRole("link", { name: "Bảng giá", exact: true }).click();
      await expect(navigation).toBeHidden();
      await expect(page).toHaveURL(/#bang-gia$/);
      await expect.poll(() => page.locator("#bang-gia").evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(80);
    }
    expect(errors).toEqual([]);
    expect(failedChunks).toEqual([]);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await test.info().attach("homepage", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    if (viewport.width < 768) {
      expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
  });
}

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`mobile navigation closes before scrolling with ${reducedMotion} motion`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await page.locator("header summary").click();
    const samples = await page.getByRole("navigation", { name: "Điều hướng mobile" }).getByRole("link", { name: "Bảng giá", exact: true }).evaluate(async link => {
      const positions: number[] = [];
      const start = scrollY;
      (link as HTMLAnchorElement).click();
      const closed = !document.querySelector("header details")!.hasAttribute("open");
      for (let frame = 0; frame < 8; frame++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        positions.push(scrollY);
      }
      return { start, closed, positions, target: document.getElementById("bang-gia")!.offsetTop - 80 };
    });
    expect(samples.closed).toBe(true);
    if (reducedMotion === "no-preference") {
      expect(samples.positions.some(position => position > samples.start && position < samples.target)).toBe(true);
    } else {
      expect(samples.positions.every(position => Math.abs(position - samples.target) <= 1)).toBe(true);
    }
    await expect.poll(() => page.locator("#bang-gia").evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(80);
    await expect(page.locator("header summary")).toBeFocused();
  });
}

test("mobile auth actions stay reachable on a short wide viewport and open existing routes", async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 320 });
  for (const [label, route] of [["Đăng nhập", "/login"], ["Đăng ký", "/register"]]) {
    await page.goto("/");
    await page.locator("header summary").click();
    const navigation = page.getByRole("navigation", { name: "Điều hướng mobile" });
    const bounds = await navigation.boundingBox();
    expect(bounds!.x).toBe(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(320);
    await navigation.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
  }
});
