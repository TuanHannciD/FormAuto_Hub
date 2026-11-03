import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../artifacts/reports/homepage-cleanup-2026-11-03");
const phase = process.env.HOMEPAGE_PHASE ?? "after";

test("homepage viewport evidence and navigation", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  const failedChunks: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.url().includes("/_next/static/") && response.status() >= 400) failedChunks.push(response.url());
  });
  await page.route("**/api/**", route => route.abort());
  mkdirSync(resolve(root, phase), { recursive: true });
  const records = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    expect((await page.goto("/"))?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const cta = page.getByRole("link", { name: "Nhận 5 credit miễn phí", exact: true });
    const box = (await cta.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    const geometry = await page.evaluate(() => ({
      width: innerWidth, height: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
      pricingTop: document.getElementById("bang-gia")!.getBoundingClientRect().top,
      heroHeight: document.querySelector("main > section")!.getBoundingClientRect().height
    }));
    expect(geometry.documentWidth).toBeLessThanOrEqual(width);
    records.push({ ...geometry, ctaBottom: box.y + box.height });
    await page.screenshot({ path: resolve(root, phase, `home-${width}.png`), fullPage: true, animations: "disabled" });
    await page.screenshot({ path: resolve(root, phase, `hero-${width}.png`), animations: "disabled" });
    const faq = page.locator("#faq details").filter({ hasText: "Tôi có được xem lại trước khi gửi không?" });
    await faq.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(faq).toHaveAttribute("open", "");
    for (const value of ["5 credit", "100 credit", "500 credit", "2.000₫", "10.000₫"]) {
      await expect(page.locator("#bang-gia").getByText(value, { exact: true }).first()).toBeVisible();
    }
    if (width < 768) {
      await page.locator("header summary").focus();
      await page.keyboard.press("Enter");
      const link = page.getByRole("navigation", { name: "Điều hướng mobile" }).getByRole("link", { name: "Bảng giá", exact: true });
      await expect(link).toBeInViewport();
      await link.click();
      await expect(page).toHaveURL(/#bang-gia$/);
    }
  }
  writeFileSync(resolve(root, `${phase}-geometry.json`), JSON.stringify(records, null, 2) + "\n");
  writeFileSync(resolve(root, `${phase}-diagnostics.json`), JSON.stringify({ errors, failedChunks }, null, 2) + "\n");
  expect(errors).toEqual([]);
  expect(failedChunks).toEqual([]);
});

test("homepage explains direct rules separately from confirmed AI previews", async ({ page }) => {
  await page.goto("/");
  const faq = page.locator("#faq details").filter({ hasText: "Tôi có được xem lại trước khi gửi không?" });
  await faq.locator("summary").click();
  await expect(faq).toContainText("Tạo và gửi ngay");
  await expect(faq).toContainText("AI cần xem trước và xác nhận");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  const entities = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts =>
    scripts.flatMap(script => JSON.parse(script.textContent!)["@graph"] ?? []));
  expect(entities.map(entity => entity["@type"])).toEqual(expect.arrayContaining(["WebSite", "SoftwareApplication"]));
});
